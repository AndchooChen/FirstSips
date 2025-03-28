import { Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { theme } from './styles/themes';
import { StripeProvider } from '@stripe/stripe-react-native';
// import { STRIPE_PUBLISHABLE_KEY } from '@env';

export default function RootLayout() {
  return (
    <StripeProvider
      publishableKey="sk_test_51R72STPIBKQ6KVT8UO01em7IPghH1Ln0bGZaJwcolRmTw7hhomH8bLvMpfdaCaxIQBtfW6yQAGOI1IKSyQ8Y4MvZ00ysJYwFPT"
      merchantIdentifier="FirstSips"
    >
      <PaperProvider theme={theme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen 
            name="(public)" 
            options={{ headerShown: false }} 
          />
          <Stack.Screen 
            name="(tabs)" 
            options={{ headerShown: false }} 
          />
          <Stack.Screen 
            name="(auth)" 
            options={{ headerShown: false }} 
          />
        </Stack>
      </PaperProvider>
    </StripeProvider>
  );
}