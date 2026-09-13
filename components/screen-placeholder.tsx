import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol, type IconSymbolName } from '@/components/ui/icon-symbol';
import { Spacing } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';

export type ScreenPlaceholderProps = {
  icon: IconSymbolName;
  title: string;
  /** One short line explaining what will live here. */
  description: string;
};

/** Centred empty state shared by screens that have no content yet. */
export function ScreenPlaceholder({ icon, title, description }: ScreenPlaceholderProps) {
  const muted = useThemeColor({}, 'muted');

  return (
    <ThemedView style={styles.root}>
      <View style={styles.content}>
        <IconSymbol name={icon} size={44} color={muted} />
        <ThemedText type="subtitle" style={styles.title}>
          {title}
        </ThemedText>
        <ThemedText style={[styles.description, { color: muted }]}>{description}</ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxl,
  },
  content: {
    alignItems: 'center',
    gap: Spacing.md,
    maxWidth: 320,
  },
  title: {
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
  },
});
