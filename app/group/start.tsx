import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PlanModeCard, type PlanModeCardItem } from '@/components/plan-mode-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Radii, Spacing } from '@/constants/theme';
import { useGoBack } from '@/hooks/use-go-back';
import { useThemeColor } from '@/hooks/use-theme-color';

type Choice = PlanModeCardItem & { id: 'create' | 'join'; href: '/group/create' | '/join' };

const CHOICES: readonly Choice[] = [
  {
    id: 'create',
    label: 'Create Group',
    blurb: 'Start a new trip and invite people once it exists',
    icon: 'plus',
    status: 'ready',
    href: '/group/create',
  },
  {
    id: 'join',
    label: 'Join a Group',
    blurb: 'Got an invite code? Put it in here',
    icon: 'link',
    status: 'ready',
    emphasis: 'secondary',
    href: '/join',
  },
] as const;

/** The fork between starting a trip and joining someone else's. */
export default function GroupStartScreen() {
  const router = useRouter();
  const goBack = useGoBack('/');
  const muted = useThemeColor({}, 'muted');

  return (
    <ThemedView style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            onPress={goBack}
            style={({ pressed }) => [styles.back, pressed && styles.pressed]}>
            <IconSymbol name="chevron.right" size={20} color={muted} style={styles.backGlyph} />
          </Pressable>
          <ThemedText type="subtitle">Group</ThemedText>
        </View>

        <ThemedText type="caption" style={styles.blurb}>
          Start a new trip, or join one you have been invited to.
        </ThemedText>

        <View style={styles.choices}>
          {CHOICES.map((choice) => (
            <PlanModeCard key={choice.id} mode={choice} onPress={() => router.push(choice.href)} />
          ))}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingTop: Spacing.lg,
  },
  back: {
    width: 36,
    height: 36,
    borderRadius: Radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -Spacing.sm,
  },
  backGlyph: {
    transform: [{ rotate: '180deg' }],
  },
  blurb: {
    paddingTop: Spacing.sm,
    maxWidth: 300,
  },
  choices: {
    gap: Spacing.md,
    paddingTop: Spacing.xxl,
  },
  pressed: {
    opacity: 0.7,
  },
});
