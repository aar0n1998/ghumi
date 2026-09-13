import { Stack } from 'expo-router';

/** The invite preview, presented as a sheet over whatever the user was doing. */
export default function JoinLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="[code]" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
