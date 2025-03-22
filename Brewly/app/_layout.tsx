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
      <Stack.Screen name="/screens/create_shop_screen" options={{ title: 'Create Shop'}} />
    </Stack>
  );
}
