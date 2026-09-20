import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol, type IconSymbolName } from '@/components/ui/icon-symbol';
import { Radii, Spacing } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';

export type GroupVisibility = 'private' | 'public';

export type VisibilityToggleProps = {
  value: GroupVisibility;
  onChange: (value: GroupVisibility) => void;
};

const OPTIONS: readonly { value: GroupVisibility; label: string; icon: IconSymbolName }[] = [
  { value: 'private', label: 'Private', icon: 'lock.fill' },
  { value: 'public', label: 'Public', icon: 'globe' },
] as const;

/** Two-option segmented control for who a group is meant for. */
export function VisibilityToggle({ value, onChange }: VisibilityToggleProps) {
  const surface = useThemeColor({}, 'surface');
  const border = useThemeColor({}, 'border');
  const muted = useThemeColor({}, 'muted');
  const tint = useThemeColor({}, 'tint');
  const onTint = useThemeColor({}, 'onTint');

  return (
    <View
      accessibilityRole="radiogroup"
      style={[styles.track, { backgroundColor: surface, borderColor: border }]}>
      {OPTIONS.map((option) => {
        const isSelected = option.value === value;
        const ink = isSelected ? onTint : muted;

        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={option.label}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => [
              styles.segment,
              isSelected && { backgroundColor: tint },
              pressed && styles.pressed,
            ]}>
            <IconSymbol name={option.icon} size={15} color={ink} />
            <ThemedText type="defaultSemiBold" style={[styles.label, { color: ink }]}>
              {option.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    gap: Spacing.xs,
    padding: Spacing.xs,
    borderRadius: Radii.pill,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    height: 44,
    borderRadius: Radii.pill,
  },
  label: {
    fontSize: 14,
  },
  pressed: {
    opacity: 0.7,
  },
});
