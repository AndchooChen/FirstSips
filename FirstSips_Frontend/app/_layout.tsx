<<<<<<< HEAD
import { Stack, useRouter, useSegments } from 'expo-router';
import { useState, useEffect } from "react";
import { PaperProvider } from 'react-native-paper';
import { theme } from './styles/themes';

// import auth, { FirebaseAuthTypes } from "@react-native-firebase/auth";

export default function RootLayout() {

  /*
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>();
  const router = useRouter();
  const segments = useSegments();

  const onAuthStateChanged = (user: FirebaseAuthTypes.User | null) => {
    console.log('onAuthStateChanged', user);
    setUser(user)
    if (initializing) {
      setInitializing(false);
    }
  }

  useEffect(() => {
    const subscriber = auth().onAuthStateChanged(onAuthStateChanged);
    return subscriber;
  })

  useEffect(() => {
    if (initializing) {
      return;
    }
    
    const inAuthGroup = segments[0] === '(auth)';

    if (user && !inAuthGroup) {
      router.replace('/(auth)/DashboardScreen');
    } 
    else if (!user && inAuthGroup) {
      router.replace('(/public)/LandingScreen')
    }

  }, [user, initializing])
  */

  return (
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
=======
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
>>>>>>> LoginRedesign
  );
}