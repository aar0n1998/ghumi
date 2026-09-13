import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandMark } from '@/components/brand-mark';
import { GoogleSignInButton } from '@/components/google-sign-in-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radii, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function SignInScreen() {
  const { signInWithGoogle, isSigningIn, error } = useAuth();
  const danger = useThemeColor({}, 'danger');
  const muted = useThemeColor({}, 'muted');

  return (
    <ThemedView style={styles.root}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.hero}>
          <BrandMark size={104} />
          <View style={styles.wordmarkBlock}>
            <ThemedText type="title" style={styles.wordmark}>
              Ghumi
            </ThemedText>
            <ThemedText style={[styles.tagline, { color: muted }]}>
              Your travel companion. Plan trips together, wander better.
            </ThemedText>
          </View>
        </View>

        <View style={styles.actions}>
          {error ? (
            <View
              accessibilityRole="alert"
              style={[styles.errorBox, { borderColor: danger }]}>
              <ThemedText style={[styles.errorText, { color: danger }]}>{error}</ThemedText>
            </View>
          ) : null}

          <GoogleSignInButton loading={isSigningIn} onPress={signInWithGoogle} />

          <ThemedText style={[styles.legal, { color: muted }]}>
            By continuing you agree to Ghumi&apos;s Terms of Service and Privacy Policy.
          </ThemedText>
        </View>
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
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xl,
  },
  wordmarkBlock: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  wordmark: {
    letterSpacing: -0.5,
  },
  tagline: {
    textAlign: 'center',
    maxWidth: 280,
  },
  actions: {
    gap: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  errorBox: {
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderRadius: Radii.md,
    padding: Spacing.md,
  },
  errorText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  legal: {
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
    paddingHorizontal: Spacing.md,
  },
});
