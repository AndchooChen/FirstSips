import { Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { theme } from './styles/themes';
import { StripeProvider } from '@stripe/stripe-react-native';
// import { STRIPE_PUBLISHABLE_KEY } from '@env';

export default function RootLayout() {
  return (
    <StripeProvider
      publishableKey="pk_test_51R72STPIBKQ6KVT8MFXWOp07xHcjHtJeNFaikqK619zZCqqaQ98k0uLbdmRQGhZbJuF1U8S3b5wixsJhdiVlU1XF00mJuavy5U"
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