import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Svg, Polygon } from 'react-native-svg';

const PolygonShape = ({ type, size, color, borderColor }) => {
  const getPoints = (sides, radius) => {
    const angle = (Math.PI * 2) / sides;
    return Array.from({ length: sides }, (_, i) => {
      const x = radius * Math.cos(angle * i - Math.PI / 2);
      const y = radius * Math.sin(angle * i - Math.PI / 2);
      return `${x},${y}`;
    }).join(' ');
  };

  const sides = {
    triangle: 3,
    normal: 4,
    bouncy: 4,
    sticky: 4,
    heavy: 4,
    boss: 4,
    pentagon: 5,
    hexagon: 6,
    heptagon: 7,
  }[type] || 4;

  const points = getPoints(sides, size / 2);

  return (
    <Svg width={size} height={size} viewBox={`${-size/2} ${-size/2} ${size} ${size}`}>
      <Polygon points={points} fill={color} stroke={borderColor} strokeWidth="3" />
    </Svg>
  );
};

export const Playfield = ({ engine }) => {
  if (!engine) return null;

  const getHitsRemaining = (enemy) => Math.ceil(enemy.health / engine.ballDamage);
  const getBorderColor = (hits) => {
    if (hits === 1) return '#ef4444'; // red
    if (hits === 2) return '#f97316'; // orange
    if (hits === 3) return '#eab308'; // yellow
    return '#22c55e'; // green (4+)
  };

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

      {engine.enemies.map((enemy) => {
        const hits = getHitsRemaining(enemy);
        const borderColor = getBorderColor(hits);
        return (
          <View
            key={enemy.id}
            style={[
              styles.enemyContainer,
              {
                transform: [
                  { translateX: enemy.x },
                  { translateY: enemy.y },
                  { rotate: `${enemy.rotation}rad` },
                ],
              },
            ]}
          >
            <PolygonShape
              type={enemy.type}
              size={enemy.width}
              color={enemy.color}
              borderColor={borderColor}
            />
            <Text
              style={[
                styles.hitCount,
                { transform: [{ rotate: `${-enemy.rotation}rad` }] },
              ]}
            >
              {hits}
            </Text>
          </View>
        );
      })}

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
  enemyContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  hitCount: {
    position: 'absolute',
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000000',
    textShadowColor: 'rgba(255,255,255,0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 1,
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
