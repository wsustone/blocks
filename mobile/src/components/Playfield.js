import React from 'react';
import { View, StyleSheet } from 'react-native';

export const Playfield = ({ engine, aimState, launchOverlay }) => {
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

  const renderAimOverlay = () => {
    if (!aimState?.isAiming || !aimState.start || !aimState.current) return null;
    const dx = aimState.current.x - aimState.start.x;
    const dy = aimState.current.y - aimState.start.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

    return (
      <View style={styles.aimLayer}>
        <View
          style={[
            styles.aimLine,
            {
              width: Math.max(0, length),
              left: aimState.start.x,
              top: aimState.start.y,
              transform: [{ rotate: `${angle}deg` }],
            },
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
    );
  };

  const renderLaunchOverlay = () => {
    if (aimState?.isAiming || !launchOverlay?.start || !launchOverlay?.end) {
      return null;
    }
    const dx = launchOverlay.end.x - launchOverlay.start.x;
    const dy = launchOverlay.end.y - launchOverlay.start.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

    return (
      <View style={styles.launchLayer}>
        <View
          style={[
            styles.launchLine,
            {
              width: Math.max(0, length),
              left: launchOverlay.start.x,
              top: launchOverlay.start.y,
              transform: [{ rotate: `${angle}deg` }],
            },
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
    );
  };

  return (
    <View
      style={[styles.playfield, { width: engine.width, height: engine.height }]}
      pointerEvents="none"
    >
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
              { transform: [{ rotate: `${well.rotation}rad` }] },
            ]}
          >
            <View style={styles.wellIndicator} />
          </View>
        </View>
      ))}

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

      {renderAimOverlay()}
      {renderLaunchOverlay()}

      {engine.enemies.map((enemy) => (
        <View
          key={enemy.id}
          style={[styles.enemy, enemy.isFragment && styles.fragmentEnemy, {
            width: enemy.width,
            height: enemy.height,
            backgroundColor: enemy.color,
            transform: [
              { translateX: enemy.x },
              { translateY: enemy.y },
              { rotate: `${enemy.rotation}rad` },
            ],
          }]}
        >
          {enemy.health < enemy.maxHealth && (
            <View style={styles.healthBarContainer}>
              <View style={styles.healthBarBackground} />
              <View
                style={[styles.healthBarFill, {
                  width: `${(enemy.health / enemy.maxHealth) * 100}%`,
                  backgroundColor:
                    enemy.health / enemy.maxHealth > 0.5
                      ? '#4CAF50'
                      : enemy.health / enemy.maxHealth > 0.25
                        ? '#FFA500'
                        : '#FF4444',
                }]}
              />
            </View>
          )}
        </View>
      ))}

      {engine.balls.map((ball, index) => (
        <View
          key={`ball-${index}`}
          style={[styles.ball, {
            width: ball.radius * 2,
            height: ball.radius * 2,
            borderRadius: ball.radius,
            backgroundColor: ball.color,
            transform: [
              { translateX: ball.x - ball.radius },
              { translateY: ball.y - ball.radius },
            ],
          }]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
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
  aimLayer: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
  },
  aimLine: {
    position: 'absolute',
    height: 2,
    backgroundColor: '#fcd34d',
    borderRadius: 1,
  },
  aimHandle: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#bfdbfe',
    borderWidth: 1,
    borderColor: '#93c5fd',
  },
  aimHandleActive: {
    backgroundColor: '#fcd34d',
    borderColor: '#fde68a',
  },
  launchLayer: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
  },
  launchLine: {
    position: 'absolute',
    height: 2,
    backgroundColor: 'rgba(252,211,77,0.4)',
    borderRadius: 1,
  },
  launchPoint: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#60a5fa',
  },
});
