// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight, SymbolViewProps } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

/**
 * SDK 57's `SymbolViewProps['name']` widened to `SFSymbolName | { ios, android,
 * web }`. Only the plain string form can key this mapping.
 */
type SFSymbolName = Extract<SymbolViewProps['name'], string>;

type IconMapping = Record<SFSymbolName, ComponentProps<typeof MaterialIcons>['name']>;

/**
 * SF Symbol → Material Icon mappings. Add an entry here before using an icon
 * anywhere, or Android and web will render nothing.
 * - Material Icons: https://icons.expo.fyi
 * - SF Symbols: the SF Symbols app
 */
const MAPPING = {
  'person.2.fill': 'group',
  'map.fill': 'map',
  'person.crop.circle.fill': 'account-circle',
  // Tab bar and the landing screen's planning modes.
  'safari.fill': 'explore',
  'person.3.fill': 'groups',
  'person.fill': 'person',
  'briefcase.fill': 'work',
  'rectangle.portrait.and.arrow.right': 'logout',
  'chevron.right': 'chevron-right',
  plus: 'add',
  'square.and.arrow.up': 'ios-share',
  'person.badge.plus': 'person-add',
  link: 'link',
  'doc.on.doc': 'content-copy',
  'arrow.clockwise': 'refresh',
  'photo.on.rectangle.angled': 'add-photo-alternate',
  xmark: 'close',
  'checkmark.circle.fill': 'check-circle',
  'exclamationmark.triangle.fill': 'warning',
  // Group feature tiles — see lib/group-features.ts.
  'bubble.left.and.bubble.right.fill': 'forum',
  calendar: 'event',
  'mappin.and.ellipse': 'place',
  'creditcard.fill': 'credit-card',
  'doc.text.fill': 'description',
  'suitcase.fill': 'luggage',
} as IconMapping;

/** The icon names available across every platform. */
export type IconSymbolName = keyof typeof MAPPING;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on
 * Android and web, for a consistent look with optimal resource usage.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
