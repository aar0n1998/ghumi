import { Stack } from 'expo-router';

/**
 * Group routes sit outside `(tabs)` so a group opens full-screen over the tab
 * bar rather than inside a tab.
 */
export default function GroupLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="[id]" />
      <Stack.Screen name="create" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
