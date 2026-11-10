import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';

import { colors, radii, spacing, typography } from '@/shared/theme';

type Variant = 'primary' | 'secondary' | 'outline' | 'danger';

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
};

const VARIANT_BG: Record<Variant, string> = {
  primary: colors.primary,
  secondary: colors.primaryLight,
  outline: colors.transparent,
  danger: colors.notFresh,
};

const VARIANT_TEXT: Record<Variant, string> = {
  primary: colors.textOnColor,
  secondary: colors.primaryDark,
  outline: colors.primary,
  danger: colors.textOnColor,
};

export function AppButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
}: Props) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        fullWidth && styles.fullWidth,
        { backgroundColor: VARIANT_BG[variant] },
        variant === 'outline' && styles.outline,
        (pressed || isDisabled) && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={VARIANT_TEXT[variant]} />
      ) : (
        <Text style={[styles.label, { color: VARIANT_TEXT[variant] }]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: radii.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: { width: '100%' },
  outline: { borderWidth: 1.5, borderColor: colors.primary },
  pressed: { opacity: 0.7 },
  label: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
  },
});