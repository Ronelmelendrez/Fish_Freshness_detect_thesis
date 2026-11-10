import { StyleSheet, View } from 'react-native';
import type { BoundingBox } from '@/features/detection';
import { colors } from '@/shared/theme';

interface BoundingBoxOverlayProps {
  /** Detection box in relative (0..1) coordinates; omitted if the model did not localize. */
  box: BoundingBox | null;
  color?: string;
}

/**
 * Draws the model's detected part box over a frame with the same aspect ratio
 * as the live feed. Normalized coordinates, so it works for any container.
 */
export function BoundingBoxOverlay({ box, color = colors.accent }: BoundingBoxOverlayProps) {
  if (!box) return null;
  return (
    <View style={[styles.overlay, { borderColor: color }]} pointerEvents="none">
      <View
        style={[
          styles.box,
          {
            left: `${box.x * 100}%`,
            top: `${box.y * 100}%`,
            width: `${box.width * 100}%`,
            height: `${box.height * 100}%`,
            borderColor: color,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  box: { position: 'absolute', borderWidth: 2, borderRadius: 4 },
});