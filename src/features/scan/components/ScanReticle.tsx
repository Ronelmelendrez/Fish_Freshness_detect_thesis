import { useEffect, useState } from 'react';
import { Animated, StyleSheet, useWindowDimensions, View } from 'react-native';
import { colors } from '@/shared/theme';

interface ScanReticleProps {
  /** Accent color; defaults to the app accent. */
  color?: string;
  /** Stops the pulse once a reading is locked. */
  scanning?: boolean;
  /** 0..1 feedback fill inside the reticle (driven by stability progress). */
  progress?: number;
}

const DIM = 'rgba(0,0,0,0.35)';
const CORNER_SIZE = 38;

/** Animated camera guide — a corner-bracket reticle, passing scanline and stability fill. */
export function ScanReticle({ color = colors.accent, scanning = true, progress = 0 }: ScanReticleProps) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const size = Math.min(windowWidth - 80, 300);

  const [pulse] = useState(() => new Animated.Value(0));
  const [lineY] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!scanning) {
      pulse.stopAnimation();
      lineY.stopAnimation();
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 900, useNativeDriver: true }),
      ]),
    );
    loop.start();
    const line = Animated.loop(
      Animated.sequence([
        Animated.timing(lineY, { toValue: size - 28, duration: 1700, useNativeDriver: true }),
        Animated.timing(lineY, { toValue: 0, duration: 1700, useNativeDriver: true }),
      ]),
    );
    line.start();
    return () => {
      loop.stop();
      line.stop();
    };
  }, [scanning, pulse, lineY, size]);

  const holeTop = (windowHeight - size) / 2;
  const holeLeft = (windowWidth - size) / 2;
  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.03] });

  const corners = [
    { top: 0, left: 0, borderTopLeftRadius: 10, borderBottomWidth: 0, borderRightWidth: 0 },
    { top: 0, right: 0, borderTopRightRadius: 10, borderBottomWidth: 0, borderLeftWidth: 0 },
    { bottom: 0, left: 0, borderBottomLeftRadius: 10, borderTopWidth: 0, borderRightWidth: 0 },
    { bottom: 0, right: 0, borderBottomRightRadius: 10, borderTopWidth: 0, borderLeftWidth: 0 },
  ];

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Dim backdrop with a clear "hole" built from four panels. */}
      <View style={[styles.panel, { top: 0, left: 0, right: 0, height: holeTop, backgroundColor: DIM }]} />
      <View style={[styles.panel, { bottom: 0, left: 0, right: 0, height: holeTop, backgroundColor: DIM }]} />
      <View style={[styles.panel, { top: holeTop, bottom: holeTop, left: 0, width: holeLeft, backgroundColor: DIM }]} />
      <View style={[styles.panel, { top: holeTop, bottom: holeTop, right: 0, width: windowWidth - holeLeft - size, backgroundColor: DIM }]} />

      <Animated.View
        style={[
          styles.reticle,
          { top: holeTop, left: holeLeft, width: size, height: size, transform: [{ scale }] },
        ]}
      >
        {corners.map((placement, i) => (
          <View key={i} style={[styles.corner, { borderColor: color }, placement]} />
        ))}

        <Animated.View
          style={[styles.scanline, { backgroundColor: color, transform: [{ translateY: lineY }] }]}
        />

        {progress > 0 && (
          <View style={styles.progressHalo}>
            <View
              style={[styles.progressBar, { width: `${Math.min(progress * 100, 100)}%`, backgroundColor: color }]}
            />
          </View>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { position: 'absolute' },
  reticle: { position: 'absolute', justifyContent: 'flex-end' },
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderWidth: 4,
  },
  scanline: {
    position: 'absolute',
    left: 14,
    right: 14,
    top: 14,
    height: 2,
    borderRadius: 1,
    opacity: 0.55,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  progressHalo: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 18,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.85)',
    overflow: 'hidden',
  },
  progressBar: { height: 6 },
});