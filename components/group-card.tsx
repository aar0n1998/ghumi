import { Pressable, StyleSheet, View } from 'react-native';

import { GroupCover } from '@/components/group-cover';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Radii, Spacing } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { GroupSummary } from '@/hooks/use-groups';

export type GroupCardProps = {
  group: GroupSummary;
  onPress: () => void;
};

/** One row in the Groups list. */
export function GroupCard({ group, onPress }: GroupCardProps) {
  const surface = useThemeColor({}, 'surface');
  const border = useThemeColor({}, 'border');
  const muted = useThemeColor({}, 'muted');

  const memberLabel = `${group.memberCount} ${group.memberCount === 1 ? 'member' : 'members'}`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${group.title}, ${memberLabel}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.root,
        { backgroundColor: surface, borderColor: border },
        pressed && styles.pressed,
      ]}>
      <View style={styles.cover}>
        <GroupCover uri={group.coverUrl} title={group.title} />
      </View>

      <View style={styles.body}>
        <ThemedText type="defaultSemiBold" numberOfLines={1}>
          {group.title}
        </ThemedText>
        {group.description ? (
          <ThemedText type="caption" numberOfLines={1}>
            {group.description}
          </ThemedText>
        ) : null}
        <View style={styles.meta}>
          <IconSymbol name="person.2.fill" size={13} color={muted} />
          <ThemedText type="caption">{memberLabel}</ThemedText>
          {group.role === 'owner' ? <ThemedText type="caption">· You host</ThemedText> : null}
        </View>
      </View>

      <IconSymbol name="chevron.right" size={18} color={muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    padding: Spacing.md,
    borderRadius: Radii.lg,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  cover: {
    width: 64,
    height: 64,
    borderRadius: Radii.md,
    overflow: 'hidden',
  },
  body: {
    flex: 1,
    gap: 2,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingTop: 2,
  },
  pressed: {
    opacity: 0.7,
  },
});
