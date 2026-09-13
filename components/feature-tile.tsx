import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Radii, Spacing } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { GroupFeature } from '@/lib/group-features';

export type FeatureTileProps = {
  feature: GroupFeature;
  onPress: () => void;
};

/** One of the six feature squares inside a group. Placeholder for now. */
export function FeatureTile({ feature, onPress }: FeatureTileProps) {
  const surface = useThemeColor({}, 'surface');
  const border = useThemeColor({}, 'border');
  const tone = useThemeColor({}, feature.tone);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${feature.label}. ${feature.blurb}. Coming soon.`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.root,
        { backgroundColor: surface, borderColor: border },
        pressed && styles.pressed,
      ]}>
      {/* Theme tokens are all 6-digit hex, so appending an alpha pair is safe
          here and keeps the well tinted by the same token as the glyph. */}
      <View style={[styles.iconWell, { backgroundColor: `${tone}1A`, borderColor: `${tone}33` }]}>
        <IconSymbol name={feature.icon} size={22} color={tone} />
      </View>
      <ThemedText type="defaultSemiBold" numberOfLines={1}>
        {feature.label}
      </ThemedText>
      <ThemedText type="caption" numberOfLines={2}>
        {feature.blurb}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    // Two per row with a gap between; the parent supplies the gap.
    flexBasis: '47%',
    flexGrow: 1,
    gap: Spacing.xs,
    padding: Spacing.lg,
    borderRadius: Radii.lg,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  iconWell: {
    width: 40,
    height: 40,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth * 2,
    marginBottom: Spacing.xs,
  },
  pressed: {
    opacity: 0.7,
  },
});
