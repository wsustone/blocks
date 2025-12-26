import 'react-native-gesture-handler';
import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { GameEngine } from './src/game/GameEngine';
import { BallPhysics } from './src/game/BallPhysics';
import { EnemySystem } from './src/game/EnemySystem';
import { CollisionSystem } from './src/game/CollisionSystem';

const BACKGROUND_COLOR = '#030712';

export default function App() {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const playWidth = Math.min(windowWidth - 24, 800);
  const playHeight = Math.min(windowHeight * 0.7, 620);

  const engineRef = useRef(null);
  const ballPhysicsRef = useRef(null);
  const enemySystemRef = useRef(null);
  const collisionSystemRef = useRef(null);

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

  const [, setTick] = useState(0);

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

  const turnInfo = engineRef.current?.getTurnInfo() ?? {
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
        <Pressable
          style={[styles.canvasWrapper, { width: playWidth, height: playHeight }]}
          onPress={(event) => {
            const { locationX } = event.nativeEvent;
            dropBall(locationX);
          }}
        >
          <Playfield engine={engineRef.current} />
        </Pressable>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.turnText}>
          {turnInfo.currentTurn === 'player' ? 'YOUR TURN' : 'ENEMY TURN'}
        </Text>
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
      </View>

      <View style={styles.buttonRow}>
        <GameButton label="Drop Ball" onPress={() => dropBall()} />
        <GameButton label="End Turn" onPress={handleEndTurn} />
        <GameButton label="Clear Balls" onPress={handleClearBalls} />
      </View>
    </GestureHandlerRootView>
  );
}

function Playfield({ engine }) {
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

      {/* Enemies */}
      {engine.enemies.map((enemy, index) => (
        <View
          key={`enemy-${index}`}
          style={[
            styles.enemy,
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
  enemy: {
    position: 'absolute',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
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
