import { View } from 'react-native';
import LandingScreen from './(public)/LandingScreen';
import * as Linking from 'expo-linking';

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
  return (
    <View style={{ flex: 1 }}>
      <LandingScreen />
    </View>
  );
}