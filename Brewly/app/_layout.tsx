import { Stack, useRouter, useSegments } from 'expo-router';
import { useState, useEffect } from "react";

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
  );
}