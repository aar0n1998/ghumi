import { Circle, G, Line, Path, Svg } from 'react-native-svg';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export type BrandMarkProps = {
  /** Rendered width and height in points. */
  size?: number;
};

/**
 * The Ghumi mark — a compass needle crossing a horizon inside a ring.
 *
 * Kept in sync with `assets/brand/ghumi-mark.svg`, which is the source the
 * app icon and splash PNGs in `assets/images/` are rasterised from. Edit both.
 */
export function BrandMark({ size = 96 }: BrandMarkProps) {
  const scheme = useColorScheme() ?? 'light';
  const { tint, accent, background } = Colors[scheme];

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Path d="M13.9 57 A38 38 0 0 0 86.1 57 Z" fill={tint} opacity={0.13} />
      <Line x1="14.5" y1="57" x2="85.5" y2="57" stroke={tint} strokeWidth={5} strokeLinecap="round" />
      <Circle cx="50" cy="50" r="38" fill="none" stroke={tint} strokeWidth={6.5} />
      <G transform="rotate(40 50 50)">
        <Path d="M50 24 L58.5 50 L50 76 L41.5 50 Z" fill={accent} />
      </G>
      <Circle cx="50" cy="50" r="4.2" fill={background} />
    </Svg>
  );
}
