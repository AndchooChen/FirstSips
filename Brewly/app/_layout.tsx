import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="/screens/home_screen" options={{ title: 'Home' }} />
      <Stack.Screen name="/screens/landing_screen" options={{ title: 'Landing' }} />
      <Stack.Screen name="/screens/store_register_screen" options={{ title: 'Shop Register'}} />
    </Stack>
  );
}
