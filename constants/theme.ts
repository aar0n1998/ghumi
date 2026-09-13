/**
 * Ghumi's "Horizon" theme — warm sand grounds with a deep teal primary and a
 * terracotta accent reserved for calls to action.
 *
 * Components must never hardcode a colour. Read tokens through `useThemeColor`
 * (see `hooks/use-theme-color.ts`) or `Colors[scheme]` when outside a component.
 */

import { Platform } from 'react-native';

const palette = {
  sand: '#FBF7F1',
  bone: '#FFFFFF',
  ink: '#1C1917',
  stone: '#78716C',
  dune: '#E7E0D5',
  teal: '#0E7C6B',
  clay: '#D2694A',
  rust: '#B4442B',

  night: '#14110F',
  slate: '#1F1B18',
  chalk: '#F5F0E8',
  ash: '#A8A29E',
  char: '#302A25',
  seafoam: '#2DA894',
  ember: '#E8845F',
  flare: '#F1746B',
};

export const Colors = {
  light: {
    /** Screen background. */
    background: palette.sand,
    /** Raised surfaces — cards, sheets, list rows. */
    surface: palette.bone,
    /** Primary body and heading text. */
    text: palette.ink,
    /** Secondary text — captions, metadata, helper copy. */
    muted: palette.stone,
    /** Hairlines and dividers. */
    border: palette.dune,
    /** Brand colour. Primary buttons, active states, links. */
    tint: palette.teal,
    /** Reserved for calls to action that must outrank `tint`. */
    accent: palette.clay,
    /** Destructive actions. */
    danger: palette.rust,
    /** Text and glyphs sitting on top of `tint` or `accent`. */
    onTint: palette.bone,

    icon: palette.stone,
    tabIconDefault: palette.stone,
    tabIconSelected: palette.teal,
  },
  dark: {
    background: palette.night,
    surface: palette.slate,
    text: palette.chalk,
    muted: palette.ash,
    border: palette.char,
    tint: palette.seafoam,
    accent: palette.ember,
    danger: palette.flare,
    onTint: palette.night,

    icon: palette.ash,
    tabIconDefault: palette.ash,
    tabIconSelected: palette.seafoam,
  },
} as const;

/** Colour token names valid in both schemes. */
export type ColorName = keyof typeof Colors.light & keyof typeof Colors.dark;

/** 4pt spacing scale. Use these instead of loose numbers in `StyleSheet.create`. */
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

/** Corner radii. `pill` fully rounds any height. */
export const Radii = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
})!;
