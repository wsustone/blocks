import React from 'react';
import { View, StyleSheet } from 'react-native';
import {
  TIMELINE_HEIGHT,
  TIMELINE_MARGIN,
  TIMELINE_POINT_RADIUS,
  TIMELINE_POINT_Y,
  TIMELINE_MAX_Y,
  TIMELINE_RADIUS,
} from '../constants/layout';

export const LaunchTimeline = ({
  width,
  aimState,
  launchOverlay,
  variant = 'standalone',
}) => {
  const activeState =
    aimState?.isAiming && aimState.start && aimState.current
      ? { start: aimState.start, end: aimState.current }
      : launchOverlay?.start && launchOverlay.end
        ? launchOverlay
        : null;

  const startX = activeState
    ? Math.max(TIMELINE_MARGIN, Math.min(width - TIMELINE_MARGIN, activeState.start.x))
    : null;
  const pointerX = activeState?.end?.x ?? null;
  const pointerY = activeState?.end?.y ?? null;
  const clampedPointerX = pointerX === null
    ? startX
    : Math.max(TIMELINE_MARGIN, Math.min(width - TIMELINE_MARGIN, pointerX));
  const clampedPointerY = pointerY === null
    ? TIMELINE_MAX_Y
    : Math.max(TIMELINE_POINT_Y, Math.min(TIMELINE_MAX_Y, pointerY));
  const deltaX = startX !== null && clampedPointerX !== null
    ? clampedPointerX - startX
    : 0;
  const deltaY = clampedPointerY - TIMELINE_POINT_Y;
  const magnitude = Math.max(0.001, Math.sqrt(deltaX * deltaX + deltaY * deltaY));
  const cappedLength = Math.min(TIMELINE_RADIUS, magnitude);
  const dirX = deltaX / magnitude;
  const dirY = deltaY / magnitude;
  const lineEndX = startX !== null ? startX + dirX * cappedLength : startX;
  const lineEndY = TIMELINE_POINT_Y + dirY * cappedLength;
  const angleRadians = Math.atan2(dirY, dirX);

  const pointerEventsValue = variant === 'overlay' ? 'none' : 'auto';
  const containerStyles = [
    styles.container,
    variant === 'overlay' && styles.overlayContainer,
    { width },
  ];

  return (
    <View style={containerStyles} pointerEvents={pointerEventsValue}>
      <View style={[styles.base, variant === 'overlay' && styles.overlayBase]} />
      {activeState && startX !== null && (
        <>
          <View
            style={[
              styles.launchPoint,
              { left: startX - TIMELINE_POINT_RADIUS },
              variant === 'overlay' && styles.overlayLaunchPoint,
            ]}
          />
          <View
            style={[
              styles.angleLayer,
              { left: startX, top: TIMELINE_POINT_Y },
            ]}
          >
            <View
              style={[
                styles.angleLine,
                {
                  width: cappedLength,
                  transform: [
                    { translateX: -cappedLength / 2 },
                    { rotate: `${angleRadians}rad` },
                    { translateX: cappedLength / 2 },
                  ],
                },
              ]}
            />
            <View
              style={[
                styles.angleHandle,
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
};

const styles = StyleSheet.create({
  container: {
    height: TIMELINE_HEIGHT + 12,
    justifyContent: 'flex-start',
    marginBottom: 0,
  },
  overlayContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-start',
  },
  base: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(148,163,184,0.3)',
    marginHorizontal: TIMELINE_MARGIN,
    marginTop: TIMELINE_POINT_Y,
  },
  overlayBase: {
    marginTop: 16,
    backgroundColor: 'rgba(248,250,252,0.15)',
  },
  launchPoint: {
    position: 'absolute',
    width: TIMELINE_POINT_RADIUS * 2,
    height: TIMELINE_POINT_RADIUS * 2,
    borderRadius: TIMELINE_POINT_RADIUS,
    backgroundColor: '#60a5fa',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    top: TIMELINE_POINT_Y - TIMELINE_POINT_RADIUS,
  },
  overlayLaunchPoint: {
    backgroundColor: '#fcd34d',
    borderColor: '#fde68a',
  },
  angleLayer: {
    position: 'absolute',
    width: 0,
    height: 0,
  },
  angleLine: {
    position: 'absolute',
    height: 2,
    backgroundColor: '#fcd34d',
    borderRadius: 1,
    shadowColor: '#fcd34d',
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  angleHandle: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#fcd34d',
    borderWidth: 1,
    borderColor: '#fde68a',
  },
});
