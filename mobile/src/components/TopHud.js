import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const StatBlock = ({ label, value, variant = 'default' }) => (
  <View
    style={[
      styles.statBlock,
      variant === 'accent' && styles.statBlockAccent,
      variant === 'muted' && styles.statBlockMuted,
    ]}
  >
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={styles.statValue}>{value}</Text>
  </View>
);

export const TopHud = ({
  width,
  score,
  balls,
  comboMultiplier,
  pendingBonus,
}) => {
  const comboActive = comboMultiplier > 1.01;
  const bonusActive = pendingBonus > 0;

  return (
    <View style={[styles.container, { width }]}>
      <View style={styles.row}>
        <StatBlock label="Score" value={score} />
        <StatBlock label="Balls" value={balls} />
        <StatBlock
          label="Combo"
          value={`${comboMultiplier.toFixed(1)}x`}
          variant={comboActive ? 'accent' : 'muted'}
        />
      </View>
      <View
        style={[
          styles.bonusPill,
          bonusActive ? styles.bonusPillActive : styles.bonusPillInactive,
        ]}
      >
        <Text
          style={[
            styles.bonusLabel,
            !bonusActive && styles.bonusLabelMuted,
          ]}
        >
          Next Turn Bonus
        </Text>
        <Text
          style={[
            styles.bonusValue,
            !bonusActive && styles.bonusValueMuted,
          ]}
        >
          {bonusActive ? `+${pendingBonus}` : '+0'}
        </Text>
      </View>
    </View>
  );
};

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
  statBlockMuted: {
    backgroundColor: 'rgba(15,23,42,0.6)',
    borderColor: 'rgba(148,163,184,0.2)',
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
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    gap: 6,
  },
  bonusPillActive: {
    backgroundColor: 'rgba(16,185,129,0.15)',
    borderColor: 'rgba(16,185,129,0.4)',
  },
  bonusPillInactive: {
    backgroundColor: 'rgba(15,23,42,0.6)',
    borderColor: 'rgba(148,163,184,0.25)',
  },
  bonusLabel: {
    color: '#a7f3d0',
    fontWeight: '600',
  },
  bonusLabelMuted: {
    color: '#94a3b8',
  },
  bonusValue: {
    color: '#34d399',
    fontWeight: '700',
  },
  bonusValueMuted: {
    color: '#e2e8f0',
    opacity: 0.6,
  },
});
