import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radii, Spacing } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { GroupMember } from '@/hooks/use-group';

export type MemberRowProps = {
  member: GroupMember;
};

/** One person in a group's member list. */
export function MemberRow({ member }: MemberRowProps) {
  const border = useThemeColor({}, 'border');
  const muted = useThemeColor({}, 'muted');
  const tint = useThemeColor({}, 'tint');

  const name = member.displayName ?? 'Traveller';
  const initial = name.trim().charAt(0).toUpperCase() || '?';

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
      </View>

      {member.role === 'owner' ? (
        <View style={[styles.badge, { borderColor: tint }]}>
          <ThemedText type="caption" style={{ color: tint }}>
            Host
          </ThemedText>
        </View>
      ) : null}
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
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radii.pill,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
});
