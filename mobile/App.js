import 'react-native-gesture-handler';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Pressable,
  useWindowDimensions,
  PanResponder,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { GameEngine } from './src/game/GameEngine';
import { BallPhysics } from './src/game/BallPhysics';
import { EnemySystem } from './src/game/EnemySystem';
import { CollisionSystem } from './src/game/CollisionSystem';

const BACKGROUND_COLOR = '#030712';
const TIMELINE_HEIGHT = 32;
const TIMELINE_MARGIN = 10;
const TIMELINE_TOP = 8;
const TIMELINE_RADIUS = 70;
const TIMELINE_POINT_RADIUS = 5;
const TIMELINE_POINT_Y = TIMELINE_TOP + TIMELINE_POINT_RADIUS;
const TIMELINE_LINE_Y = TIMELINE_POINT_Y + 4;

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
      y: Math.max(TIMELINE_HEIGHT, Math.min(point.y, playHeight)),
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
        y: currentPoint.y - launchStart.y,
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
        end: currentPoint,
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
          speed: 11,
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
        onPanResponderTerminate: () => resetAimState(),
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

  const dropBall = (x) => {
    const engine = engineRef.current;
    const ballPhysics = ballPhysicsRef.current;
    if (!engine || !ballPhysics) return;
    const positionX = typeof x === 'number' ? x : Math.random() * engine.width;
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
    pendingBonus: 0,
  };

  return (
    <GestureHandlerRootView style={styles.root}>
      <View style={styles.container}>
        <View
          style={[styles.canvasWrapper, { width: playWidth, height: playHeight }]}
          {...panResponder.panHandlers}
        >
          <LaunchTimeline
            width={playWidth}
            aimState={aimState}
            launchOverlay={launchOverlay}
          />
          <Playfield
            engine={engineRef.current}
            aimState={aimState}
            launchOverlay={launchOverlay}
          />
        </View>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.turnText}>
          {turnInfo.currentTurn === 'player' ? 'YOUR TURN' : 'ENEMY TURN'}
        </Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Score:</Text>
          <Text style={styles.infoValue}>
            {(engine?.score ?? 0).toLocaleString('en-US')}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Balls:</Text>
          <Text style={styles.infoValue}>
            {turnInfo.ballsDropped}/{turnInfo.maxBalls}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Enemies:</Text>
          <Text style={styles.infoValue}>{turnInfo.enemyCount}</Text>
        </View>
        {turnInfo.pendingBonus > 0 && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Next Turn Bonus:</Text>
            <Text style={[styles.infoValue, styles.bonusValue]}>
              +{turnInfo.pendingBonus}
            </Text>
          </View>
        )}

      {/* Launch overlay */}
      {!aimState?.isAiming &&
        launchOverlay?.start &&
        launchOverlay?.end && (
          <View style={styles.launchLayer}>
            <View
              style={[
                styles.launchLine,
                (() => {
                  const dx = launchOverlay.end.x - launchOverlay.start.x;
                  const dy = launchOverlay.end.y - launchOverlay.start.y;
                  const length = Math.sqrt(dx * dx + dy * dy);
                  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
                  return {
                    width: Math.max(0, length),
                    left: launchOverlay.start.x,
                    top: launchOverlay.start.y,
                    transform: [{ rotate: `${angle}deg` }],
                  };
                })(),
              ]}
            />
            <View
              style={[
                styles.launchPoint,
                {
                  left: launchOverlay.start.x - 5,
                  top: launchOverlay.start.y - 5,
                },
              ]}
            />
          </View>
        )}
        {(engine?.comboMultiplier ?? 1) > 1 && (
          <View style={styles.comboBadge}>
            <Text style={styles.comboLabel}>Combo</Text>
            <Text style={styles.comboValue}>
              {(engine?.comboMultiplier ?? 1).toFixed(1)}x
            </Text>
          </View>
        )}
      </View>

      <View style={styles.buttonRow}>
        <GameButton label="Drop Ball" onPress={() => dropBall()} />
        <GameButton label="End Turn" onPress={handleEndTurn} />
        <GameButton label="Clear Balls" onPress={handleClearBalls} />
      </View>
    </GestureHandlerRootView>
  );
}

function LaunchTimeline({ width, aimState, launchOverlay }) {
  const activeState =
    aimState?.isAiming && aimState.start && aimState.current
      ? { start: aimState.start, end: aimState.current }
      : launchOverlay?.start && launchOverlay.end
        ? launchOverlay
        : null;

  const startX = activeState
    ? Math.max(8, Math.min(width - 8, activeState.start.x))
    : null;

  const pointerX = activeState?.end?.x ?? null;
  const pointerY = activeState?.end?.y ?? null;
  const deltaX =
    pointerX !== null && startX !== null ? pointerX - startX : 0;
  const deltaY =
    pointerY !== null ? Math.max(0, pointerY - TIMELINE_POINT_Y) : TIMELINE_RADIUS;
  const magnitude = Math.max(0.001, Math.sqrt(deltaX * deltaX + deltaY * deltaY));
  const dirX = deltaX / magnitude;
  const dirY = deltaY / magnitude;
  const lineEndX = startX !== null ? startX + dirX * TIMELINE_RADIUS : startX;
  const lineEndY = TIMELINE_POINT_Y + dirY * TIMELINE_RADIUS;
  const angleRadians = Math.atan2(dirY, dirX);

  return (
    <View style={[styles.timelineContainer, { width }]}>
      <View style={styles.timelineBase} />
      {activeState && startX !== null && (
        <>
          <View
            style={[
              styles.timelineLaunchPoint,
              {
                left: startX - TIMELINE_POINT_RADIUS,
              },
            ]}
          />
          <View
            style={[
              styles.timelineAngleLayer,
              {
                left: startX,
                top: TIMELINE_POINT_Y,
              },
            ]}
          >
            <View
              style={[
                styles.timelineAngleLine,
                {
                  transform: [
                    { translateX: TIMELINE_RADIUS / 2 },
                    { rotate: `${angleRadians}rad` },
                    { translateX: -TIMELINE_RADIUS / 2 },
                  ],
                },
              ]}
            />
            <View
              style={[
                styles.timelineAngleHandle,
                {
                  left: lineEndX - startX - 6,
                  top: lineEndY - TIMELINE_POINT_Y - 6,
                },
              ]}
            />
          </View>
        </>
      )}
    </View>
  );
}

function Playfield({ engine, aimState, launchOverlay }) {
  if (!engine) return null;

  const gridSpacing = 40;
  const verticalLines = Array.from(
    { length: Math.floor(engine.width / gridSpacing) + 1 },
    (_, index) => index * gridSpacing
  );
  const horizontalLines = Array.from(
    { length: Math.floor(engine.height / gridSpacing) + 1 },
    (_, index) => index * gridSpacing
  );

  return (
    <View
      style={[
        styles.playfield,
        { width: engine.width, height: engine.height },
      ]}
      pointerEvents="none"
    >
      {/* Wells */}
      {engine.gravityWells?.map((well) => (
        <View
          key={well.id}
          style={[
            styles.well,
            {
              left: well.x - well.radius,
              top: well.y - well.radius,
              width: well.radius * 2,
              height: well.radius * 2,
            },
          ]}
        >
          <View
            style={[
              styles.wellCore,
              {
                transform: [{ rotate: `${well.rotation}rad` }],
              },
            ]}
          >
            <View style={styles.wellIndicator} />
          </View>
        </View>
      ))}

      {/* Grid */}
      {verticalLines.map((x) => (
        <View
          key={`v-${x}`}
          style={[styles.gridLine, { left: x, height: engine.height }]}
        />
      ))}
      {horizontalLines.map((y) => (
        <View
          key={`h-${y}`}
          style={[styles.gridLineHorizontal, { top: y, width: engine.width }]}
        />
      ))}

      {/* Aim line */}
      {aimState?.isAiming && aimState.start && aimState.current && (
        <View style={styles.aimLayer}>
          <View
            style={[
              styles.aimLine,
              (() => {
                const dx = aimState.current.x - aimState.start.x;
                const dy = aimState.current.y - aimState.start.y;
                const length = Math.sqrt(dx * dx + dy * dy);
                const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
                return {
                  width: Math.max(0, length),
                  left: aimState.start.x,
                  top: aimState.start.y,
                  transform: [{ rotate: `${angle}deg` }],
                };
              })(),
            ]}
          />
          <View
            style={[
              styles.aimHandle,
              {
                left: aimState.start.x - 6,
                top: aimState.start.y - 6,
              },
            ]}
          />
          <View
            style={[
              styles.aimHandle,
              styles.aimHandleActive,
              {
                left: aimState.current.x - 8,
                top: aimState.current.y - 8,
              },
            ]}
          />
        </View>
      )}

      {/* Enemies */}
      {engine.enemies.map((enemy, index) => (
        <View
          key={`enemy-${index}`}
          style={[
            styles.enemy,
            enemy.isFragment && styles.fragmentEnemy,
            {
              width: enemy.width,
              height: enemy.height,
              backgroundColor: enemy.color,
              transform: [
                { translateX: enemy.x },
                { translateY: enemy.y },
                { rotate: `${enemy.rotation}rad` },
              ],
            },
          ]}
        >
          {enemy.health < enemy.maxHealth && (
            <View style={styles.healthBarContainer}>
              <View style={styles.healthBarBackground} />
              <View
                style={[
                  styles.healthBarFill,
                  {
                    width: `${(enemy.health / enemy.maxHealth) * 100}%`,
                    backgroundColor:
                      enemy.health / enemy.maxHealth > 0.5
                        ? '#4CAF50'
                        : enemy.health / enemy.maxHealth > 0.25
                          ? '#FFA500'
                          : '#FF4444',
                  },
                ]}
              />
            </View>
          )}
        </View>
      ))}

      {/* Balls */}
      {engine.balls.map((ball, index) => (
        <View
          key={`ball-${index}`}
          style={[
            styles.ball,
            {
              width: ball.radius * 2,
              height: ball.radius * 2,
              borderRadius: ball.radius,
              backgroundColor: ball.color,
              transform: [
                { translateX: ball.x - ball.radius },
                { translateY: ball.y - ball.radius },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
}

function GameButton({ label, onPress }) {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <Text style={styles.buttonText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BACKGROUND_COLOR,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 32,
    paddingBottom: 24,
    gap: 20,
  },
  canvasWrapper: {
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#020617',
  },
  timelineContainer: {
    height: 40,
    justifyContent: 'center',
    marginTop: 8,
    position: 'relative',
  },
  timelineBase: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(148,163,184,0.3)',
    marginHorizontal: 8,
  },
  timelineLaunchPoint: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#60a5fa',
    top: TIMELINE_POINT_Y - TIMELINE_POINT_RADIUS,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  timelineLaunchLine: {
    position: 'absolute',
    height: 2,
    top: TIMELINE_LINE_Y,
    backgroundColor: '#fcd34d',
    borderRadius: 1,
    shadowColor: '#fcd34d',
    shadowOpacity: 0.6,
    shadowRadius: 4,
  },
  timelineAngleLayer: {
    position: 'absolute',
    width: 0,
    height: 0,
  },
  timelineAngleLine: {
    position: 'absolute',
    width: TIMELINE_RADIUS,
    height: 2,
    backgroundColor: '#fcd34d',
    borderRadius: 1,
    shadowColor: '#fcd34d',
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  timelineAngleHandle: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#fcd34d',
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  playfield: {
    position: 'relative',
    backgroundColor: '#030712',
  },
  gridLine: {
    position: 'absolute',
    width: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
  },
  gridLineHorizontal: {
    position: 'absolute',
    height: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
  },
  well: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.4)',
    backgroundColor: 'rgba(59,130,246,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  wellCore: {
    width: '60%',
    height: '60%',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  wellIndicator: {
    width: '35%',
    height: 2,
    backgroundColor: '#93c5fd',
    borderRadius: 1,
  },
  enemy: {
    position: 'absolute',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fragmentEnemy: {
    borderWidth: 1,
    borderColor: '#fde68a',
    shadowColor: '#fcd34d',
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  healthBarContainer: {
    position: 'absolute',
    top: -10,
    left: 0,
    right: 0,
    height: 4,
  },
  healthBarBackground: {
    position: 'absolute',
    top: 0,
    left: 4,
    right: 4,
    height: 4,
    backgroundColor: '#00000088',
    borderRadius: 2,
  },
  healthBarFill: {
    position: 'absolute',
    top: 0,
    left: 4,
    height: 4,
    borderRadius: 2,
  },
  ball: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  infoCard: {
    width: '90%',
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  turnText: {
    color: '#e0f2fe',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoLabel: {
    color: '#94a3b8',
    fontSize: 16,
  },
  infoValue: {
    color: '#e2e8f0',
    fontSize: 16,
    fontWeight: '600',
  },
  bonusValue: {
    color: '#fbbf24',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  comboBadge: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(59,130,246,0.2)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(147,197,253,0.5)',
  },
  comboLabel: {
    color: '#bfdbfe',
    fontWeight: '600',
  },
  comboValue: {
    color: '#fcd34d',
    fontWeight: '700',
  },
  button: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 999,
    shadowColor: '#2563eb',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
  },
  buttonText: {
    color: '#e0f2fe',
    fontSize: 16,
    fontWeight: '600',
  },
});
