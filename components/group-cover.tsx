import { Image } from 'expo-image';
import { StyleSheet, View, type ImageStyle, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export type GroupCoverProps = {
  uri: string | null;
  /** Seeds the fallback colour and supplies its initials. */
  title: string;
  style?: StyleProp<ViewStyle>;
  /** Scales the fallback initials. Match it roughly to the rendered height. */
  size?: 'small' | 'large';
};

/**
 * A group's cover image, with a deterministic coloured fallback.
 *
 * Groups without a photo still need to be told apart at a glance in a list, so
 * the fallback derives its tint from the title rather than being a flat grey.
 * The same title always yields the same colour.
 */
export function GroupCover({ uri, title, style, size = 'small' }: GroupCoverProps) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  if (uri) {
    return (
      <Image
        source={{ uri }}
        // Callers only ever pass box geometry, which is valid in both style
        // types; RN just models ImageStyle and ViewStyle as disjoint.
        style={[styles.root, style as StyleProp<ImageStyle>]}
        contentFit="cover"
        transition={200}
        accessibilityIgnoresInvertColors
      />
    );
  }

  const palette = [colors.tint, colors.accent, colors.danger];
  const seed = [...title].reduce((total, character) => total + character.charCodeAt(0), 0);
  const background = palette[seed % palette.length];

  return (
    <View style={[styles.root, styles.fallback, { backgroundColor: background }, style]}>
      <ThemedText
        type={size === 'large' ? 'title' : 'subtitle'}
        style={{ color: colors.onTint }}
        accessibilityElementsHidden>
        {initialsFor(title)}
      </ThemedText>
    </View>
  );
}

/** "Goa With The Boys" → "GW". Falls back to a single glyph for one-word names. */
function initialsFor(title: string): string {
  const words = title.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].charAt(0).toUpperCase();
  return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
    height: '100%',
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
