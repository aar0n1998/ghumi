import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radii, Spacing } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { MemberAvailability } from '@/hooks/use-group-availability';
import { formatRange } from '@/lib/dates';

export type AvailabilityRowProps = {
  member: MemberAvailability;
};

/**
 * One person's answer to "can you make it".
 *
 * Three states, and the third is the point: somebody who has not shared dates
 * is *unknown*, not unavailable. Counting silence as a no is how a trip gets
 * cancelled over nothing.
 */
export function AvailabilityRow({ member }: AvailabilityRowProps) {
  const border = useThemeColor({}, 'border');
  const muted = useThemeColor({}, 'muted');
  const tint = useThemeColor({}, 'tint');
  const danger = useThemeColor({}, 'danger');

  const name = member.displayName ?? 'Traveller';
  const initial = name.trim().charAt(0).toUpperCase() || '?';

  const status =
    member.freeForTrip === null
      ? { label: 'No dates yet', tone: muted }
      : member.freeForTrip
        ? { label: 'Free', tone: tint }
        : { label: 'Clashes', tone: danger };

  const detail = member.range
    ? `Free ${formatRange(member.range.startsOn, member.range.endsOn)}`
    : 'Has not shared dates yet';

  return (
    <View style={styles.root}>
      {member.avatarUrl ? (
        <Image
          source={{ uri: member.avatarUrl }}
          style={styles.avatar}
          contentFit="cover"
          accessibilityIgnoresInvertColors
        />
      ) : (
        <View style={[styles.avatar, styles.fallback, { borderColor: border }]}>
          <ThemedText type="defaultSemiBold" style={{ color: muted }}>
            {initial}
          </ThemedText>
        </View>
      )}

      <View style={styles.identity}>
        <ThemedText numberOfLines={1}>
          {name}
          {member.isYou ? ' (you)' : ''}
        </ThemedText>
        <ThemedText type="caption" numberOfLines={1}>
          {detail}
        </ThemedText>
      </View>

      <View style={[styles.badge, { backgroundColor: `${status.tone}1A` }]}>
        <ThemedText type="caption" style={{ color: status.tone }}>
          {status.label}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: Radii.pill,
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  identity: {
    flex: 1,
    gap: 2,
  },
  badge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 3,
    borderRadius: Radii.pill,
  },
});
