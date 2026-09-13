import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FeatureTile } from '@/components/feature-tile';
import { GroupCover } from '@/components/group-cover';
import { InviteShareCard } from '@/components/invite-share-card';
import { MemberRow } from '@/components/member-row';
import { ScreenPlaceholder } from '@/components/screen-placeholder';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Radii, Spacing } from '@/constants/theme';
import { useGroup } from '@/hooks/use-group';
import { useThemeColor } from '@/hooks/use-theme-color';
import { GROUP_FEATURES, type GroupFeature } from '@/lib/group-features';

export default function GroupScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { group, isLoading, isRefreshing, notFound, error, refresh, resetInviteLink, leaveGroup } =
    useGroup(id);

  const surface = useThemeColor({}, 'surface');
  const border = useThemeColor({}, 'border');
  const muted = useThemeColor({}, 'muted');
  const tint = useThemeColor({}, 'tint');
  const danger = useThemeColor({}, 'danger');

  const openFeature = (feature: GroupFeature) => {
    Alert.alert(feature.label, `${feature.blurb}. Not built yet — it is next up for this group.`);
  };

  const confirmLeave = () => {
    Alert.alert('Leave this group?', 'You will need the invite link again to come back.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave',
        style: 'destructive',
        onPress: async () => {
          try {
            await leaveGroup();
            router.replace('/');
          } catch (cause) {
            Alert.alert(
              'Could not leave the group',
              cause instanceof Error ? cause.message : 'Please try again.'
            );
          }
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <ThemedView style={[styles.root, styles.centred]}>
        <ActivityIndicator color={tint} />
      </ThemedView>
    );
  }

  if (notFound || !group) {
    return (
      <ThemedView style={styles.root}>
        <SafeAreaView edges={['top']} style={styles.flex}>
          <BackButton onPress={() => router.replace('/')} color={muted} />
          <ScreenPlaceholder
            icon="exclamationmark.triangle.fill"
            title="Group unavailable"
            description={
              error ?? 'This group no longer exists, or you are not a member of it any more.'
            }
          />
        </SafeAreaView>
      </ThemedView>
    );
  }

  const memberLabel = `${group.members.length} ${group.members.length === 1 ? 'member' : 'members'}`;

  return (
    <ThemedView style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={refresh} tintColor={tint} />
        }>
        <View style={styles.hero}>
          <GroupCover uri={group.coverUrl} title={group.title} size="large" />
          <SafeAreaView edges={['top']} style={styles.heroOverlay}>
            <BackButton onPress={() => router.replace('/')} color={muted} onSurface={surface} />
          </SafeAreaView>
        </View>

        <View style={styles.body}>
          <View style={styles.titleBlock}>
            <ThemedText type="title">{group.title}</ThemedText>
            {group.description ? <ThemedText>{group.description}</ThemedText> : null}
            <View style={styles.meta}>
              <IconSymbol name="person.2.fill" size={14} color={muted} />
              <ThemedText type="caption">{memberLabel}</ThemedText>
            </View>
          </View>

          <View style={styles.section}>
            <ThemedText type="subtitle">Plan the trip</ThemedText>
            <ThemedText type="caption">
              Each of these becomes its own space inside the group.
            </ThemedText>
            <View style={styles.grid}>
              {GROUP_FEATURES.map((feature) => (
                <FeatureTile
                  key={feature.id}
                  feature={feature}
                  onPress={() => openFeature(feature)}
                />
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <ThemedText type="subtitle">Who is coming</ThemedText>
            <View style={[styles.card, { backgroundColor: surface, borderColor: border }]}>
              {group.members.map((member) => (
                <MemberRow key={member.userId} member={member} />
              ))}
            </View>
          </View>

          <InviteShareCard
            groupTitle={group.title}
            inviteCode={group.inviteCode}
            onReset={group.yourRole === 'owner' ? resetInviteLink : undefined}
          />

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Leave group"
            onPress={confirmLeave}
            style={({ pressed }) => [styles.leave, pressed && styles.pressed]}>
            <ThemedText type="defaultSemiBold" style={{ color: danger }}>
              Leave group
            </ThemedText>
          </Pressable>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

function BackButton({
  onPress,
  color,
  onSurface,
}: {
  onPress: () => void;
  color: string;
  /** When set, the button sits on an image and needs its own backdrop. */
  onSurface?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Back to groups"
      onPress={onPress}
      style={({ pressed }) => [
        styles.back,
        onSurface ? { backgroundColor: onSurface } : null,
        pressed && styles.pressed,
      ]}>
      <IconSymbol name="chevron.right" size={20} color={color} style={styles.backGlyph} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  centred: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    paddingBottom: Spacing.xxxl,
  },
  hero: {
    width: '100%',
    aspectRatio: 16 / 10,
  },
  heroOverlay: {
    // RN 0.86 dropped `StyleSheet.absoluteFillObject`; `absoluteFill` is a
    // registered style id and cannot be spread, so write the edges out.
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  back: {
    width: 36,
    height: 36,
    borderRadius: Radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.lg,
    marginTop: Spacing.sm,
  },
  backGlyph: {
    transform: [{ rotate: '180deg' }],
  },
  body: {
    padding: Spacing.xl,
    gap: Spacing.xxl,
  },
  titleBlock: {
    gap: Spacing.sm,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  section: {
    gap: Spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    paddingTop: Spacing.sm,
  },
  card: {
    padding: Spacing.lg,
    borderRadius: Radii.lg,
    borderWidth: StyleSheet.hairlineWidth * 2,
    marginTop: Spacing.sm,
  },
  leave: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  pressed: {
    opacity: 0.7,
  },
});
