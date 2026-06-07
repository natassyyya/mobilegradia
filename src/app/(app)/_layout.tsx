import { Stack } from 'expo-router';

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="workspace" />
      <Stack.Screen name="tasks" />
      <Stack.Screen name="presences" />
    </Stack>
  );
}
