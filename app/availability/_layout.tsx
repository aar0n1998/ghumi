import { Stack } from 'expo-router';

/** Availability opens as a sheet over the group it belongs to. */
export default function AvailabilityLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="[id]" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
