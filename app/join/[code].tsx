import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GroupCover } from '@/components/group-cover';
import { PrimaryButton } from '@/components/primary-button';
import { ScreenPlaceholder } from '@/components/screen-placeholder';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Radii, Spacing } from '@/constants/theme';
import { useGoBack } from '@/hooks/use-go-back';
import { useGroupInvite } from '@/hooks/use-group-invite';
import { useThemeColor } from '@/hooks/use-theme-color';
import { GROUP_FEATURES } from '@/lib/group-features';

/**
 * The pre-join screen an invite link lands on.
 *
 * Everything here comes from `get_group_preview`, a security-definer RPC that
 * returns a fixed, safe subset. A non-member has no read access to the `groups`
 * table itself, so a guessed code cannot leak more than what is on this screen.
 */
export default function JoinGroupScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const router = useRouter();
  const dismiss = useGoBack('/');
  const { preview, isLoading, isInvalid, isJoining, error, join } = useGroupInvite(code);

  const surface = useThemeColor({}, 'surface');
  const border = useThemeColor({}, 'border');
  const muted = useThemeColor({}, 'muted');
  const tint = useThemeColor({}, 'tint');
  const danger = useThemeColor({}, 'danger');

  const confirm = async () => {
    try {
      const groupId = await join();
      router.replace(`/group/${groupId}`);
    } catch {
      // `error` from the hook already carries the message for the banner.
    }
  };

  if (isLoading) {
    return (
      <ThemedView style={[styles.root, styles.centred]}>
        <ActivityIndicator color={tint} />
      </ThemedView>
    );
  }

  if (isInvalid || !preview) {
    return (
      <ThemedView style={styles.root}>
        <SafeAreaView edges={['top']} style={styles.flex}>
          <CloseButton onPress={dismiss} color={muted} />
          <ScreenPlaceholder
            icon="exclamationmark.triangle.fill"
            title="Invite not valid"
            description="This link has been reset or the group no longer exists. Ask whoever invited you for a fresh one."
          />
        </SafeAreaView>
      </ThemedView>
    );
  }

  const memberLabel = `${preview.memberCount} ${preview.memberCount === 1 ? 'person is' : 'people are'} in`;

  return (
    <ThemedView style={styles.root}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.flex}>
        <CloseButton onPress={dismiss} color={muted} />

        <ScrollView contentContainerStyle={styles.scroll}>
          <ThemedText type="caption" style={styles.kicker}>
            {preview.hostName ? `${preview.hostName} invited you to` : 'You have been invited to'}
          </ThemedText>

          <View style={[styles.cover, { borderColor: border }]}>
            <GroupCover uri={preview.coverUrl} title={preview.title} size="large" />
          </View>

          <ThemedText type="title" style={styles.title}>
            {preview.title}
          </ThemedText>

          {preview.description ? (
            <ThemedText style={styles.description}>{preview.description}</ThemedText>
          ) : null}

          <View style={styles.meta}>
            <IconSymbol name="person.2.fill" size={14} color={muted} />
            <ThemedText type="caption">{memberLabel}</ThemedText>
          </View>

          <View style={[styles.card, { backgroundColor: surface, borderColor: border }]}>
            <ThemedText type="defaultSemiBold">What you get access to</ThemedText>
            <View style={styles.featureList}>
              {GROUP_FEATURES.map((feature) => (
                <View key={feature.id} style={styles.featureRow}>
                  <IconSymbol name={feature.icon} size={17} color={tint} />
                  <ThemedText type="caption">{feature.label}</ThemedText>
                </View>
              ))}
            </View>
          </View>

          {error ? (
            <View style={styles.errorRow}>
              <IconSymbol name="exclamationmark.triangle.fill" size={15} color={danger} />
              <ThemedText type="caption" style={[styles.flex, { color: danger }]}>
                {error}
              </ThemedText>
            </View>
          ) : null}
        </ScrollView>

        <View style={styles.footer}>
          {preview.alreadyMember ? (
            <PrimaryButton
              label="Open group"
              onPress={() => router.replace(`/group/${preview.id}`)}
            />
          ) : (
            <PrimaryButton
              label="Join group"
              variant="accent"
              onPress={confirm}
              isLoading={isJoining}
            />
          )}
          <ThemedText type="caption" style={styles.footerNote}>
            {preview.alreadyMember
              ? 'You are already a member of this group.'
              : 'Everyone in the group will see that you joined.'}
          </ThemedText>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

function CloseButton({ onPress, color }: { onPress: () => void; color: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Close"
      onPress={onPress}
      style={({ pressed }) => [styles.close, pressed && styles.pressed]}>
      <IconSymbol name="xmark" size={22} color={color} />
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
  close: {
    alignSelf: 'flex-end',
    padding: Spacing.lg,
  },
  scroll: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
    gap: Spacing.md,
  },
  kicker: {
    textAlign: 'center',
  },
  cover: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: Radii.lg,
    borderWidth: StyleSheet.hairlineWidth * 2,
    overflow: 'hidden',
  },
  title: {
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  card: {
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: Radii.lg,
    borderWidth: StyleSheet.hairlineWidth * 2,
    marginTop: Spacing.sm,
  },
  featureList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    flexBasis: '45%',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xs,
  },
  footer: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    gap: Spacing.sm,
  },
  footerNote: {
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});
