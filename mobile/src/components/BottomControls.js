import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GameButton } from './GameButton';

export const BottomControls = ({ turnLabel, onDropBall, onEndTurn, onClearBalls }) => (
  <View style={styles.container}>
    <View style={styles.turnBadge}>
      <Text style={styles.turnText}>{turnLabel}</Text>
    </View>
    <View style={styles.buttonRow}>
      <GameButton label="Drop Ball" onPress={onDropBall} />
      <GameButton label="End Turn" onPress={onEndTurn} />
      <GameButton label="Clear Balls" onPress={onClearBalls} />
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  turnBadge: {
    backgroundColor: 'rgba(15,118,110,0.3)',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(20,184,166,0.5)',
  },
  turnText: {
    color: '#34d399',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
});
