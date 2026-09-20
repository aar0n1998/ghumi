import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/primary-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Radii, Spacing } from '@/constants/theme';
import { useGoBack } from '@/hooks/use-go-back';
import { useThemeColor } from '@/hooks/use-theme-color';

/** Invite codes are 8 characters from an alphabet with no 0/O/1/I/L. */
const CODE_LENGTH = 8;
const CODE_PATTERN = /^[A-HJ-KM-NP-Z2-9]+$/;

/**
 * Types an invite code in by hand.
 *
 * Invite links use the `ghumi://` scheme, so they only open for someone who
 * already has the app — and never at all in Expo Go. The code has always been
 * shown next to the link for exactly this reason; this is the door it fits.
 * Everything after this screen is the existing `/join/[code]` flow.
 */
export default function EnterInviteCodeScreen() {
  const router = useRouter();
  const dismiss = useGoBack('/');

  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const surface = useThemeColor({}, 'surface');
  const border = useThemeColor({}, 'border');
  const text = useThemeColor({}, 'text');
  const muted = useThemeColor({}, 'muted');
  const danger = useThemeColor({}, 'danger');

  const submit = () => {
    const cleaned = code.trim().toUpperCase();

    if (cleaned.length < 4 || !CODE_PATTERN.test(cleaned)) {
      setError('That does not look like an invite code. Check it and try again.');
      return;
    }

    // `replace`, so dismissing the preview does not land back on this form.
    router.replace(`/join/${cleaned}`);
  };

  return (
    <ThemedView style={styles.root}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <View style={styles.header}>
          <ThemedText type="subtitle">Join a group</ThemedText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cancel"
            onPress={dismiss}
            style={({ pressed }) => [pressed && styles.pressed]}>
            <IconSymbol name="xmark" size={22} color={muted} />
          </Pressable>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.body}>
          <ThemedText type="caption">
            Whoever set the trip up can find the code under Invite people.
          </ThemedText>

          <TextInput
            value={code}
            onChangeText={(next) => {
              setCode(next.toUpperCase());
              setError(null);
            }}
            placeholder="ABCD2345"
            placeholderTextColor={muted}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={CODE_LENGTH}
            accessibilityLabel="Invite code"
            returnKeyType="go"
            onSubmitEditing={submit}
            style={[styles.input, { backgroundColor: surface, borderColor: border, color: text }]}
          />

          {error ? (
            <View style={styles.errorRow}>
              <IconSymbol name="exclamationmark.triangle.fill" size={15} color={danger} />
              <ThemedText type="caption" style={[styles.flex, { color: danger }]}>
                {error}
              </ThemedText>
            </View>
          ) : null}

          <View style={styles.spacer} />

          <PrimaryButton label="Continue" onPress={submit} disabled={code.trim().length === 0} />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  body: {
    flex: 1,
    gap: Spacing.md,
  },
  flex: {
    flex: 1,
  },
  input: {
    height: 64,
    borderRadius: Radii.md,
    borderWidth: StyleSheet.hairlineWidth * 2,
    paddingHorizontal: Spacing.lg,
    fontSize: 24,
    fontWeight: '600',
    letterSpacing: 6,
    textAlign: 'center',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xs,
  },
  spacer: {
    flex: 1,
  },
  pressed: {
    opacity: 0.7,
  },
});
