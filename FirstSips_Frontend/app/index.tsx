import { View } from 'react-native';
import LandingScreen from './(public)/LandingScreen';
<<<<<<< HEAD

export default function Index() {
=======
import * as Linking from 'expo-linking';
import { useStripe } from '@stripe/stripe-react-native';
import { useCallback, useEffect } from 'react';

const linking = {
  prefixes: [Linking.createURL('/')], // Expo's deep link handler
  config: {
    screens: {
      StripeConnect: 'stripe-connect',
      EditShop: 'EditShopScreen',
    },
  },
};

export default function Index() {
  const { handleURLCallback } = useStripe();

  const handleDeepLink = useCallback(
    async (url: string | null) => {
      if (url) {
        const stripeHandled = await handleURLCallback(url);
        if (stripeHandled) {
          // This was a Stripe URL - you can add extra handling here
          console.log('Handled Stripe URL return');
        } else {
          // This was NOT a Stripe URL – handle other deep links
          console.log('Not a Stripe URL:', url);
        }
      }
    },
    [handleURLCallback]
  );

  useEffect(() => {
    const getUrlAsync = async () => {
      const initialUrl = await Linking.getInitialURL();
      handleDeepLink(initialUrl);
    };

    getUrlAsync();

    const deepLinkListener = Linking.addEventListener(
      'url',
      (event: { url: string }) => {
        handleDeepLink(event.url);
      }
    );

    return () => deepLinkListener.remove();
  }, [handleDeepLink]);

>>>>>>> LoginRedesign
  return (
    <View style={{ flex: 1 }}>
      <LandingScreen />
    </View>
  );
}