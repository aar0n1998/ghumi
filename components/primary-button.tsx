import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radii, Spacing } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';

export type PrimaryButtonProps = Omit<PressableProps, 'style'> & {
  label: string;
  /** `accent` outranks `tint` — use it for the single main action on a screen. */
  variant?: 'tint' | 'accent' | 'outline';
  /** Swaps the label for a spinner and blocks presses. */
  isLoading?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** The full-width pill action used across the group screens. */
export function PrimaryButton({
  label,
  variant = 'tint',
  isLoading = false,
  disabled,
  style,
  ...rest
}: PrimaryButtonProps) {
  const tint = useThemeColor({}, 'tint');
  const accent = useThemeColor({}, 'accent');
  const onTint = useThemeColor({}, 'onTint');
  const border = useThemeColor({}, 'border');
  const text = useThemeColor({}, 'text');

  const isOutline = variant === 'outline';
  const background = isOutline ? 'transparent' : variant === 'accent' ? accent : tint;
  const foreground = isOutline ? text : onTint;
  const isDisabled = disabled === true || isLoading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: isLoading }}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.root,
        { backgroundColor: background },
        isOutline && { borderWidth: StyleSheet.hairlineWidth * 2, borderColor: border },
        pressed && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
      {...rest}>
      {isLoading ? (
        <ActivityIndicator color={foreground} />
      ) : (
        <ThemedText type="defaultSemiBold" style={{ color: foreground }}>
          {label}
        </ThemedText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    height: 52,
    borderRadius: Radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
  },
  pressed: {
    opacity: 0.75,
  },
  disabled: {
    opacity: 0.5,
  },
});
