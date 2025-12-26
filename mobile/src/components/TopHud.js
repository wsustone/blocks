import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const StatBlock = ({ label, value, accent }) => (
  <View style={[styles.statBlock, accent && styles.statBlockAccent]}>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={styles.statValue}>{value}</Text>
  </View>
);

export const TopHud = ({
  width,
  score,
  balls,
  enemies,
  comboMultiplier,
  pendingBonus
}) => (
  <View style={[styles.container, { width }]}>
    <View style={styles.row}>
      <StatBlock label="Score" value={score} />
      <StatBlock label="Balls" value={balls} />
      <StatBlock label="Enemies" value={enemies} />
      {comboMultiplier > 1 && (
        <StatBlock
          label="Combo"
          value={`${comboMultiplier.toFixed(1)}x`}
          accent
        />
      )}
    </View>
    {pendingBonus > 0 && (
      <View style={styles.bonusPill}>
        <Text style={styles.bonusLabel}>Next Turn Bonus</Text>
        <Text style={styles.bonusValue}>+{pendingBonus}</Text>
      </View>
    )}
  </View>
);

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  statBlock: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  statBlockAccent: {
    backgroundColor: 'rgba(37,99,235,0.15)',
    borderColor: 'rgba(147,197,253,0.5)',
  },
  statLabel: {
    color: '#94a3b8',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  statValue: {
    marginTop: 2,
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '600',
  },
  bonusPill: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(16,185,129,0.15)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.4)',
    gap: 6,
  },
  bonusLabel: {
    color: '#a7f3d0',
    fontWeight: '600',
  },
  bonusValue: {
    color: '#34d399',
    fontWeight: '700',
  },
});
