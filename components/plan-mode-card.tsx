import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol, type IconSymbolName } from '@/components/ui/icon-symbol';
import { Radii, Spacing } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';

/**
 * Anything this card can render. `PlanMode` satisfies it, and so does an
 * ad-hoc choice like "Create Group" on the group start screen — the card is
 * about the shape of the row, not about planning modes specifically.
 */
export type PlanModeCardItem = {
  label: string;
  blurb: string;
  icon: IconSymbolName;
  status: 'ready' | 'soon';
  /**
   * `secondary` is still a live action — it just does not compete with the
   * primary one on the same screen. Defaults to `primary`.
   */
  emphasis?: 'primary' | 'secondary';
};

export type PlanModeCardProps = {
  mode: PlanModeCardItem;
  onPress: () => void;
};

/**
 * One of the three ways to start a trip on the landing screen.
 *
 * A `ready` mode is filled with `tint` and ends in a chevron, so the one thing
 * that actually works reads as the primary action. A `soon` mode is an outline
 * with a badge — visible, tappable, and honest that it goes nowhere yet.
 */
export function PlanModeCard({ mode, onPress }: PlanModeCardProps) {
  const surface = useThemeColor({}, 'surface');
  const background = useThemeColor({}, 'background');
  const border = useThemeColor({}, 'border');
  const muted = useThemeColor({}, 'muted');
  const tint = useThemeColor({}, 'tint');
  const accent = useThemeColor({}, 'accent');
  const onTint = useThemeColor({}, 'onTint');

  const isReady = mode.status === 'ready';
  const isFilled = isReady && mode.emphasis !== 'secondary';

  // Theme tokens are all 6-digit hex, so appending an alpha pair keeps the
  // translucent fills on-palette in both schemes. Same trick as feature-tile.
  const wellColor = isFilled ? `${onTint}29` : isReady ? `${tint}1A` : background;
  const glyphColor = isFilled ? onTint : isReady ? tint : muted;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        isReady ? `${mode.label}. ${mode.blurb}.` : `${mode.label}. ${mode.blurb}. Coming soon.`
      }
      onPress={onPress}
      style={({ pressed }) => [
        styles.root,
        isFilled
          ? { backgroundColor: tint }
          : {
              backgroundColor: surface,
              borderColor: border,
              borderWidth: StyleSheet.hairlineWidth * 2,
            },
        pressed && styles.pressed,
      ]}>
      <View style={[styles.iconWell, { backgroundColor: wellColor }]}>
        <IconSymbol name={mode.icon} size={22} color={glyphColor} />
      </View>

      <View style={styles.body}>
        <ThemedText type="defaultSemiBold" style={isFilled ? { color: onTint } : undefined}>
          {mode.label}
        </ThemedText>
        <ThemedText
          type="caption"
          numberOfLines={2}
          style={isFilled ? { color: onTint } : undefined}>
          {mode.blurb}
        </ThemedText>
      </View>

      {isReady ? (
        <IconSymbol name="chevron.right" size={18} color={isFilled ? onTint : muted} />
      ) : (
        <View style={[styles.badge, { backgroundColor: `${accent}1A` }]}>
          <ThemedText type="caption" style={[styles.badgeText, { color: accent }]}>
            Soon
          </ThemedText>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    minHeight: 80,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radii.pill,
  },
  iconWell: {
    width: 44,
    height: 44,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    gap: 2,
  },
  badge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: Radii.pill,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  pressed: {
    opacity: 0.7,
  },
});
