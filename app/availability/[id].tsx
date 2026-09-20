import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AvailabilityRow } from '@/components/availability-row';
import { DateRangeSheet } from '@/components/date-range-sheet';
import { PrimaryButton } from '@/components/primary-button';
import { ScreenPlaceholder } from '@/components/screen-placeholder';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Radii, Spacing } from '@/constants/theme';
import { useGoBack } from '@/hooks/use-go-back';
import { useGroupAvailability } from '@/hooks/use-group-availability';
import { useThemeColor } from '@/hooks/use-theme-color';
import { formatRange } from '@/lib/dates';

/**
 * Who can make the trip.
 *
 * Everything on this screen comes from what people have actually shared. A
 * member with no dates shows as unknown rather than being counted out, and the
 * suggested window is only offered when it is genuinely different from the
 * dates the group already has.
 */
export default function AvailabilityScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const dismiss = useGoBack('/');
  const {
    title,
    tripDates,
    members,
    yours,
    freeCount,
    sharedCount,
    commonWindow,
    isLoading,
    isRefreshing,
    isSaving,
    notFound,
    error,
    refresh,
    share,
  } = useGroupAvailability(id);

  const [isPicking, setIsPicking] = useState(false);

  const surface = useThemeColor({}, 'surface');
  const border = useThemeColor({}, 'border');
  const muted = useThemeColor({}, 'muted');
  const tint = useThemeColor({}, 'tint');
  const danger = useThemeColor({}, 'danger');

  if (isLoading) {
    return (
      <ThemedView style={[styles.root, styles.centred]}>
        <ActivityIndicator color={tint} />
      </ThemedView>
    );
  }

  if (notFound) {
    return (
      <ThemedView style={styles.root}>
        <SafeAreaView edges={['top']} style={styles.flex}>
          <CloseButton onPress={dismiss} color={muted} />
          <ScreenPlaceholder
            icon="exclamationmark.triangle.fill"
            title="Group unavailable"
            description={error ?? 'This group no longer exists, or you are not a member of it.'}
          />
        </SafeAreaView>
      </ThemedView>
    );
  }

  const suggestion =
    commonWindow &&
    sharedCount > 1 &&
    (!tripDates ||
      commonWindow.startsOn !== tripDates.startsOn ||
      commonWindow.endsOn !== tripDates.endsOn)
      ? commonWindow
      : null;

  const headline = tripDates
    ? `${freeCount} of ${members.length} free for ${formatRange(tripDates.startsOn, tripDates.endsOn)}`
    : `${sharedCount} of ${members.length} have shared dates`;

  return (
    <ThemedView style={styles.root}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.flex}>
        <View style={styles.header}>
          <ThemedText type="subtitle">Availability</ThemedText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close"
            onPress={dismiss}
            style={({ pressed }) => [pressed && styles.pressed]}>
            <IconSymbol name="xmark" size={22} color={muted} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={refresh} tintColor={tint} />
          }>
          <View style={[styles.card, { backgroundColor: surface, borderColor: border }]}>
            <ThemedText type="defaultSemiBold" numberOfLines={1}>
              {title ?? 'This trip'}
            </ThemedText>
            <ThemedText type="caption">
              {tripDates
                ? `${formatRange(tripDates.startsOn, tripDates.endsOn)} · ${members.length} ${members.length === 1 ? 'member' : 'members'}`
                : 'No dates set yet'}
            </ThemedText>
          </View>

          {error ? (
            <View style={styles.errorRow}>
              <IconSymbol name="exclamationmark.triangle.fill" size={15} color={danger} />
              <ThemedText type="caption" style={[styles.flex, { color: danger }]}>
                {error}
              </ThemedText>
            </View>
          ) : null}

          <View style={[styles.card, { backgroundColor: surface, borderColor: border }]}>
            {members.map((member) => (
              <AvailabilityRow key={member.userId} member={member} />
            ))}
          </View>

          <View style={[styles.card, { backgroundColor: surface, borderColor: border }]}>
            <ThemedText type="defaultSemiBold">{headline}</ThemedText>
            {suggestion ? (
              <View style={styles.suggestion}>
                <IconSymbol name="checkmark.circle" size={16} color={tint} />
                <ThemedText type="caption" style={styles.flex}>
                  Everyone who has answered is free{' '}
                  {formatRange(suggestion.startsOn, suggestion.endsOn)}.
                </ThemedText>
              </View>
            ) : (
              <ThemedText type="caption">
                {sharedCount === members.length
                  ? 'Everyone has answered.'
                  : 'Waiting on the rest of the group.'}
              </ThemedText>
            )}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <PrimaryButton
            label={yours ? 'Change your dates' : 'Share your dates'}
            variant={yours ? 'outline' : 'accent'}
            isLoading={isSaving}
            onPress={() => setIsPicking(true)}
          />
        </View>
      </SafeAreaView>

      <DateRangeSheet
        visible={isPicking}
        value={yours}
        title="When could you go?"
        onDismiss={() => setIsPicking(false)}
        onConfirm={(range) => {
          setIsPicking(false);
          if (!range) return;

          void share(range).catch((cause: unknown) => {
            Alert.alert(
              'Could not save your dates',
              cause instanceof Error ? cause.message : 'Please try again.'
            );
          });
        }}
      />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
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
  card: {
    gap: Spacing.xs,
    padding: Spacing.lg,
    borderRadius: Radii.lg,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    paddingTop: Spacing.xs,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xs,
  },
  footer: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
  },
  pressed: {
    opacity: 0.7,
  },
});
