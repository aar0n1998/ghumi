import { useRouter } from 'expo-router';
import { Alert, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandMark } from '@/components/brand-mark';
import { PlanModeCard } from '@/components/plan-mode-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { PLAN_MODES, type PlanMode } from '@/lib/plan-modes';

/**
 * The landing screen. Always.
 *
 * This file must stay `index.tsx`: Expo Router navigates to "/" on launch, and
 * if nothing resolves there the root layout never mounts and the app hangs on
 * the splash with no error. `__tests__/app/routes.test.ts` guards it.
 */
export default function PlanScreen() {
  const router = useRouter();

  const openMode = (mode: PlanMode) => {
    if (mode.status === 'ready') {
      router.push('/group/start');
      return;
    }

    Alert.alert(mode.label, `${mode.blurb}. Not built yet.`);
  };

  return (
    <ThemedView style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.masthead}>
          <BrandMark size={30} />
          <ThemedText type="subtitle">Ghumi</ThemedText>
        </View>

        <View style={styles.heading}>
          <ThemedText type="title">My Plan</ThemedText>
          <ThemedText type="caption">Choose how you want to plan this trip.</ThemedText>
        </View>

        <View style={styles.modes}>
          {PLAN_MODES.map((mode) => (
            <PlanModeCard key={mode.id} mode={mode} onPress={() => openMode(mode)} />
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
  masthead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingTop: Spacing.lg,
  },
  heading: {
    gap: Spacing.xs,
    paddingTop: Spacing.xxl,
  },
  modes: {
    gap: Spacing.md,
    paddingTop: Spacing.xxl,
  },
});
