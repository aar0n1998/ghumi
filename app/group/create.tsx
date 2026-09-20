import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DateRangeSheet } from '@/components/date-range-sheet';
import { PrimaryButton } from '@/components/primary-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { VisibilityToggle, type GroupVisibility } from '@/components/visibility-toggle';
import { Radii, Spacing } from '@/constants/theme';
import { useCoverPicker } from '@/hooks/use-cover-picker';
import { useCreateGroup } from '@/hooks/use-create-group';
import { useThemeColor } from '@/hooks/use-theme-color';
import { formatRange, type DateRange } from '@/lib/dates';

const TITLE_LIMIT = 80;
const DESCRIPTION_LIMIT = 500;
const LOCATION_LIMIT = 120;

export default function CreateGroupScreen() {
  const router = useRouter();
  const { createGroup, isCreating, error } = useCreateGroup();
  const { cover, isPicking, error: coverError, pick, clear } = useCoverPicker();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dates, setDates] = useState<DateRange | null>(null);
  const [location, setLocation] = useState('');
  const [visibility, setVisibility] = useState<GroupVisibility>('private');
  const [isPickingDates, setIsPickingDates] = useState(false);

  const surface = useThemeColor({}, 'surface');
  const border = useThemeColor({}, 'border');
  const text = useThemeColor({}, 'text');
  const muted = useThemeColor({}, 'muted');
  const tint = useThemeColor({}, 'tint');
  const danger = useThemeColor({}, 'danger');

  const canSubmit = title.trim().length > 0 && !isCreating;

  const submit = async () => {
    try {
      const group = await createGroup({
        title,
        description,
        cover: cover ? { base64: cover.base64, mimeType: cover.mimeType } : null,
        dates,
        location,
        isPublic: visibility === 'public',
      });

      // Replace rather than push: dismissing the new group should land on the
      // list, not back on a form for a group that now exists.
      router.replace(`/group/${group.id}`);
    } catch {
      // `error` from the hook already carries the message for the banner.
    }
  };

  return (
    <ThemedView style={styles.root}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <View style={styles.header}>
          <ThemedText type="subtitle">New group</ThemedText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cancel"
            onPress={() => router.back()}
            style={({ pressed }) => [pressed && styles.pressed]}>
            <IconSymbol name="xmark" size={22} color={muted} />
          </Pressable>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flex}>
          <ScrollView
            contentContainerStyle={styles.form}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={cover ? 'Change cover image' : 'Add a cover image'}
              onPress={pick}
              disabled={isPicking}
              style={({ pressed }) => [
                styles.coverWell,
                { backgroundColor: surface, borderColor: border },
                pressed && styles.pressed,
              ]}>
              {cover ? (
                <Image
                  source={{ uri: cover.uri }}
                  style={styles.coverImage}
                  contentFit="cover"
                  accessibilityIgnoresInvertColors
                />
              ) : (
                <View style={styles.coverEmpty}>
                  {isPicking ? (
                    <ActivityIndicator color={tint} />
                  ) : (
                    <IconSymbol name="photo.on.rectangle.angled" size={28} color={muted} />
                  )}
                  <ThemedText type="caption">Add a cover image</ThemedText>
                </View>
              )}
            </Pressable>

            {cover ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Remove cover image"
                onPress={clear}
                style={({ pressed }) => [styles.removeCover, pressed && styles.pressed]}>
                <ThemedText type="caption" style={{ color: danger }}>
                  Remove cover
                </ThemedText>
              </Pressable>
            ) : null}

            {coverError ? (
              <ThemedText type="caption" style={{ color: danger }}>
                {coverError}
              </ThemedText>
            ) : null}

            <View style={styles.field}>
              <ThemedText type="defaultSemiBold">Title</ThemedText>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Goa, March"
                placeholderTextColor={muted}
                maxLength={TITLE_LIMIT}
                accessibilityLabel="Group title"
                returnKeyType="next"
                style={[styles.input, { backgroundColor: surface, borderColor: border, color: text }]}
              />
            </View>

            <View style={styles.field}>
              <View style={styles.fieldHeader}>
                <ThemedText type="defaultSemiBold">Description</ThemedText>
                <ThemedText type="caption">Optional</ThemedText>
              </View>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Four days, one rented scooter each, no fixed plan."
                placeholderTextColor={muted}
                maxLength={DESCRIPTION_LIMIT}
                accessibilityLabel="Group description"
                multiline
                textAlignVertical="top"
                style={[
                  styles.input,
                  styles.multiline,
                  { backgroundColor: surface, borderColor: border, color: text },
                ]}
              />
              <ThemedText type="caption" style={styles.counter}>
                {description.length}/{DESCRIPTION_LIMIT}
              </ThemedText>
            </View>

            <View style={styles.field}>
              <ThemedText type="defaultSemiBold">Members</ThemedText>
              <View style={[styles.readOnlyRow, { backgroundColor: surface, borderColor: border }]}>
                <IconSymbol name="person.2.fill" size={18} color={muted} />
                <ThemedText type="caption" style={styles.flex}>
                  Just you for now. Everyone else joins with the invite link once the group exists.
                </ThemedText>
              </View>
            </View>

            <View style={styles.field}>
              <View style={styles.fieldHeader}>
                <ThemedText type="defaultSemiBold">Dates</ThemedText>
                <ThemedText type="caption">Optional</ThemedText>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  dates ? `Trip dates, ${formatRange(dates.startsOn, dates.endsOn)}` : 'Add trip dates'
                }
                onPress={() => setIsPickingDates(true)}
                style={({ pressed }) => [
                  styles.pickerRow,
                  { backgroundColor: surface, borderColor: dates ? tint : border },
                  pressed && styles.pressed,
                ]}>
                <IconSymbol name="calendar" size={20} color={dates ? tint : muted} />
                <ThemedText style={[styles.flex, !dates && { color: muted }]}>
                  {dates ? formatRange(dates.startsOn, dates.endsOn) : 'When are you going?'}
                </ThemedText>
                <IconSymbol name="chevron.right" size={16} color={muted} />
              </Pressable>
            </View>

            <View style={styles.field}>
              <View style={styles.fieldHeader}>
                <ThemedText type="defaultSemiBold">Location</ThemedText>
                <ThemedText type="caption">Optional</ThemedText>
              </View>
              <TextInput
                value={location}
                onChangeText={setLocation}
                placeholder="Where are you headed?"
                placeholderTextColor={muted}
                maxLength={LOCATION_LIMIT}
                accessibilityLabel="Trip location"
                style={[styles.input, { backgroundColor: surface, borderColor: border, color: text }]}
              />
            </View>

            <View style={styles.field}>
              <ThemedText type="defaultSemiBold">Visibility</ThemedText>
              <VisibilityToggle value={visibility} onChange={setVisibility} />
              <ThemedText type="caption">
                {visibility === 'private'
                  ? 'Only people with the invite link can find this group.'
                  : 'Marked public. Discovery is not built yet, so it behaves the same for now.'}
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
          </ScrollView>

          <View style={styles.footer}>
            <PrimaryButton
              label="Create group"
              variant="accent"
              onPress={submit}
              disabled={!canSubmit}
              isLoading={isCreating}
            />
            <ThemedText type="caption" style={styles.footerNote}>
              You can invite people straight after.
            </ThemedText>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <DateRangeSheet
        visible={isPickingDates}
        value={dates}
        title="When is the trip?"
        onDismiss={() => setIsPickingDates(false)}
        onConfirm={(range) => {
          setDates(range);
          setIsPickingDates(false);
        }}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  form: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
    gap: Spacing.lg,
  },
  coverWell: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: Radii.lg,
    borderWidth: StyleSheet.hairlineWidth * 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverEmpty: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  removeCover: {
    alignSelf: 'center',
  },
  field: {
    gap: Spacing.sm,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  input: {
    minHeight: 52,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radii.md,
    borderWidth: StyleSheet.hairlineWidth * 2,
    fontSize: 16,
  },
  multiline: {
    minHeight: 120,
  },
  counter: {
    alignSelf: 'flex-end',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xs,
  },
  readOnlyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    minHeight: 52,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radii.md,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    minHeight: 52,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radii.md,
    borderWidth: StyleSheet.hairlineWidth * 2,
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
