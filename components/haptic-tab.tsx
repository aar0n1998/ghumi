import * as Haptics from 'expo-haptics';
import { PlatformPressable } from 'expo-router/react-navigation';
import type { BottomTabBarButtonProps } from 'expo-router/tabs';
import type { ReactNode } from 'react';

/**
 * Tab bar button with haptic feedback on press.
 *
 * Both imports come from expo-router rather than `@react-navigation/*`: since
 * SDK 57 expo-router vendors its own copy of react-navigation, and the vendored
 * types are structurally identical to the originals but nominally distinct.
 * Mixing the two makes `tabBarButton` reject this component.
 */
export function HapticTab(props: BottomTabBarButtonProps): ReactNode {
  return (
    <PlatformPressable
      {...props}
      onPressIn={(ev) => {
        if (process.env.EXPO_OS === 'ios') {
          // Add a soft haptic feedback when pressing down on the tabs.
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        props.onPressIn?.(ev);
      }}
    />
  );
}
