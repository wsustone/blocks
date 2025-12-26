import 'react-native-gesture-handler';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View, useWindowDimensions, PanResponder } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { GameEngine } from './src/game/GameEngine';
import { BallPhysics } from './src/game/BallPhysics';
import { EnemySystem } from './src/game/EnemySystem';
import { CollisionSystem } from './src/game/CollisionSystem';
import { TopHud, LaunchTimeline, Playfield, BottomControls } from './src/components';
import {
  BACKGROUND_COLOR,
  TIMELINE_HEIGHT,
  TIMELINE_MARGIN,
  TIMELINE_POINT_Y,
  TIMELINE_MAX_Y
} from './src/constants/layout';

export default function App() {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const playWidth = Math.min(windowWidth - 24, 800);
  const playHeight = Math.min(windowHeight * 0.7, 620);

  const engineRef = useRef(null);
  const ballPhysicsRef = useRef(null);
  const enemySystemRef = useRef(null);
  const collisionSystemRef = useRef(null);
  const initialAimState = useMemo(
    () => ({ isAiming: false, start: null, current: null }),
    []
  );
  const [aimState, setAimState] = useState(initialAimState);
  const [launchOverlay, setLaunchOverlay] = useState(null);
  const [, setTick] = useState(0);
  const volleyTimeoutRef = useRef(null);

  if (!engineRef.current) {
    engineRef.current = new GameEngine({ width: playWidth, height: playHeight });
    ballPhysicsRef.current = new BallPhysics(engineRef.current);
    enemySystemRef.current = new EnemySystem(engineRef.current);
    collisionSystemRef.current = new CollisionSystem(
      engineRef.current,
      ballPhysicsRef.current,
      enemySystemRef.current
    );
  }

  useEffect(() => {
    engineRef.current.setDimensions(playWidth, playHeight);
    enemySystemRef.current.updateDimensions(playWidth, playHeight);
  }, [playWidth, playHeight]);

  const clampPoint = useCallback(
    (point) => ({
      x: Math.max(0, Math.min(point.x, playWidth)),
      y: Math.max(TIMELINE_HEIGHT, Math.min(point.y, playHeight))
    }),
    [playWidth, playHeight]
  );

  const clearVolleyTimeout = useCallback(() => {
    if (volleyTimeoutRef.current) {
      clearTimeout(volleyTimeoutRef.current);
      volleyTimeoutRef.current = null;
    }
  }, []);

  useEffect(
    () => () => {
      clearVolleyTimeout();
    },
    [clearVolleyTimeout]
  );

  const fireVolley = useCallback(
    (startPoint, currentPoint) => {
      const engine = engineRef.current;
      const ballPhysics = ballPhysicsRef.current;
      if (!engine || !ballPhysics) return;
      if (engine.currentTurn !== 'player') return;

      const timelineX = Math.max(
        TIMELINE_MARGIN,
        Math.min(playWidth - TIMELINE_MARGIN, startPoint.x)
      );
      const launchStart = { x: timelineX, y: TIMELINE_POINT_Y };

      const direction = {
        x: currentPoint.x - launchStart.x,
        y: currentPoint.y - launchStart.y
      };
      const magnitude = Math.sqrt(direction.x ** 2 + direction.y ** 2);
      if (magnitude < 5) return;

      const availableShots = Math.max(
        0,
        engine.maxBallsPerTurn - engine.ballsDroppedThisTurn
      );

      clearVolleyTimeout();
      setLaunchOverlay({
        start: launchStart,
        end: currentPoint
      });

      let shotIndex = 0;
      const shootNext = () => {
        if (shotIndex >= availableShots) {
          volleyTimeoutRef.current = null;
          setLaunchOverlay(null);
          return;
        }

        ballPhysics.createBall(launchStart.x, launchStart.y, {
          direction,
          speed: 11
        });
        setTick((tick) => tick + 1);
        shotIndex += 1;

        if (shotIndex < availableShots) {
          volleyTimeoutRef.current = setTimeout(shootNext, 80);
        } else {
          volleyTimeoutRef.current = null;
          setLaunchOverlay(null);
        }
      };

      shootNext();
    },
    [clearVolleyTimeout, setTick]
  );

  const resetAimState = useCallback(() => {
    setAimState({ isAiming: false, start: null, current: null });
  }, []);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
          const engine = engineRef.current;
          if (!engine || engine.currentTurn !== 'player') return;
          const { locationX, locationY } = evt.nativeEvent;
          const timelineX = Math.max(
            TIMELINE_MARGIN,
            Math.min(playWidth - TIMELINE_MARGIN, locationX)
          );
          const startPoint = { x: timelineX, y: TIMELINE_POINT_Y };
          const currentPoint = clampPoint({ x: locationX, y: locationY });
          setAimState({ isAiming: true, start: startPoint, current: currentPoint });
        },
        onPanResponderMove: (evt) => {
          const { locationX, locationY } = evt.nativeEvent;
          const point = clampPoint({ x: locationX, y: locationY });
          setAimState((prev) => {
            if (!prev.isAiming) return prev;
            return { ...prev, current: point };
          });
        },
        onPanResponderRelease: () => {
          setAimState((prev) => {
            if (prev.isAiming && prev.start && prev.current) {
              fireVolley(prev.start, prev.current);
            }
            return initialAimState;
          });
        },
        onPanResponderTerminate: () => resetAimState()
      }),
    [clampPoint, fireVolley, initialAimState, resetAimState]
  );

  useEffect(() => {
    let raf;
    let mounted = true;

    const loop = () => {
      if (!mounted) return;

      const engine = engineRef.current;
      const ballPhysics = ballPhysicsRef.current;
      const enemySystem = enemySystemRef.current;
      const collisionSystem = collisionSystemRef.current;

      ballPhysics.updateBalls();
      enemySystem.updateEnemies();
      collisionSystem.checkCollisions();

      if (
        engine.currentTurn === 'player' &&
        !engine.enemyMovementRequested &&
        engine.ballsDroppedThisTurn >= engine.maxBallsPerTurn &&
        engine.balls.length === 0
      ) {
        engine.requestEnemyMovement();
      }

      engine.updateTurns();

      setTick((tick) => tick + 1);
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => {
      mounted = false;
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const dropRandomBall = () => {
    const engine = engineRef.current;
    const ballPhysics = ballPhysicsRef.current;
    if (!engine || !ballPhysics) return;
    const positionX = Math.random() * engine.width;
    ballPhysics.createBall(positionX, 20);
    setTick((tick) => tick + 1);
  };

  const handleEndTurn = () => {
    engineRef.current?.endTurn();
    setTick((tick) => tick + 1);
  };

  const handleClearBalls = () => {
    engineRef.current?.clearBalls();
    setTick((tick) => tick + 1);
  };

  const engine = engineRef.current;
  const turnInfo = engine?.getTurnInfo() ?? {
    currentTurn: 'player',
    ballsDropped: 0,
    maxBalls: 5,
    ballCount: 0,
    enemyCount: 0,
    pendingBonus: 0
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <GestureHandlerRootView style={styles.root}>
        <TopHud
          width={playWidth}
          score={(engine?.score ?? 0).toLocaleString('en-US')}
          balls={`${turnInfo.ballsDropped}/${turnInfo.maxBalls}`}
          enemies={turnInfo.enemyCount.toString()}
          comboMultiplier={engine?.comboMultiplier ?? 1}
          pendingBonus={turnInfo.pendingBonus}
        />

        <LaunchTimeline
          width={playWidth}
          aimState={aimState}
          launchOverlay={launchOverlay}
        />

        <View style={styles.playArea}>
          <View
            style={[styles.canvasWrapper, { width: playWidth, height: playHeight }]}
            {...panResponder.panHandlers}
          >
            <Playfield
              engine={engineRef.current}
              aimState={aimState}
              launchOverlay={launchOverlay}
            />
          </View>
        </View>

        <BottomControls
          turnLabel={turnInfo.currentTurn === 'player' ? 'YOUR TURN' : 'ENEMY TURN'}
          onDropBall={dropRandomBall}
          onEndTurn={handleEndTurn}
          onClearBalls={handleClearBalls}
        />
      </GestureHandlerRootView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BACKGROUND_COLOR
  },
  root: {
    flex: 1,
    backgroundColor: BACKGROUND_COLOR,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 16
  },
  playArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  canvasWrapper: {
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#020617'
  }
});
