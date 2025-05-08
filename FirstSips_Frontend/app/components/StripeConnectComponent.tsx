import { View, Alert, StyleSheet } from 'react-native';
import { useState, useEffect } from 'react';
import { Button } from 'react-native-paper';
import { supabase } from "../utils/supabase";
import React from 'react';
import * as WebBrowser from 'expo-web-browser';
// import { makeRedirectUri } from 'expo-auth-session'; // Not using this anymore
import { API_URL } from '../config/api';

interface StripeConnectComponentProps {
  onSuccess: () => void;
  setIsProcessing: (isProcessing: boolean) => void;
}

const StripeConnectComponent = ({ onSuccess, setIsProcessing }: StripeConnectComponentProps) => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [shopId, setShopId] = useState('');

  // We no longer need the deep link handling here since we're using WebBrowser

  // Get user data when component mounts
  useEffect(() => {
    const getUserData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get user email
        const { data: userData } = await supabase
          .from("users")
          .select("email, shop_id")
          .eq("id", user.id)
          .single();

        if (userData) {
          setEmail(userData.email || '');
          setShopId(userData.shop_id || '');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    getUserData();
  }, []);

  const handleStripeConnect = async () => {
    try {
      setIsProcessing(true);
      setLoading(true);

      if (!shopId) {
        throw new Error("Shop ID not found. Please create a shop first.");
      }

      if (!email) {
        throw new Error("Email not found. Please update your profile.");
      }

      // For Stripe Connect, we'll use a custom redirect approach
      // Instead of using the Expo development server URL which Stripe doesn't accept
      const redirectUri = 'firstsips://stripe-callback';

      console.log('Using redirect URI:', redirectUri);

      // Step 1: Create Stripe Account
      const accountResponse = await fetch(`${API_URL}/stripe/create-account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      if (!accountResponse.ok) {
        const error = await accountResponse.json();
        throw new Error(error.error || 'Failed to create Stripe account');
      }

      const accountData = await accountResponse.json();
      console.log('Created Stripe account:', accountData.accountId);

      // Step 2: Get Onboarding Link with our redirect URI
      const linkResponse = await fetch(`${API_URL}/stripe/create-onboarding-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: accountData.accountId,
          shopId: shopId,
          redirectUri // Pass this to backend
        })
      });

      if (!linkResponse.ok) {
        const error = await linkResponse.json();
        throw new Error(error.error || 'Failed to create onboarding link');
      }

      const linkData = await linkResponse.json();
      console.log('Got onboarding link:', linkData.url);

      // Step 3: Open the onboarding link in a browser
      console.log('Opening WebBrowser...');

      // We're using a simpler approach now - just open the URL
      // The backend will handle the redirect back to our app
      const result = await WebBrowser.openAuthSessionAsync(
        linkData.url,
        redirectUri
      );
      console.log('WebBrowser result:', result);

      // Check if we got a successful result
      if (result.type === 'success') {
        try {
          // Parse the returned URL
          const returnedUrl = result.url;
          console.log('Returned URL:', returnedUrl);

          // Extract parameters from the URL
          const params = new URLSearchParams(returnedUrl.split('?')[1]);
          const success = params.get('success');
          const accountId = params.get('account_id');
          const shopId = params.get('shop_id');
          const stripeEnabled = params.get('stripe_enabled') === 'true';
          const payoutsEnabled = params.get('payouts_enabled') === 'true';
          const detailsSubmitted = params.get('details_submitted') === 'true';

          console.log('Received params:', {
            success, accountId, shopId,
            stripeEnabled, payoutsEnabled, detailsSubmitted
          });

          if (success === 'true' && accountId) {
            console.log('Stripe onboarding successful for account:', accountId);

            // Update the user's stripe_connected flag
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              await supabase
                .from("users")
                .update({ stripe_connected: true })
                .eq("id", user.id);
            }

            // The backend has already updated the shop's Stripe account information
            // We can use the parameters passed back to determine the status
            if (stripeEnabled) {
              // Show success message
              Alert.alert("Success", "Stripe account connected successfully!");
              onSuccess();
            } else {
              // Account created but not fully set up
              Alert.alert(
                "Almost Done",
                "Your Stripe account has been created, but you need to complete the setup to enable payments."
              );
            }
          } else {
            // Handle error case
            const errorMsg = params.get('error') || 'Unknown error';
            Alert.alert("Error", `There was an error connecting your Stripe account: ${errorMsg}`);
          }
        } catch (error) {
          console.error('Error processing WebBrowser result:', error);
          Alert.alert("Error", "There was a problem processing the Stripe response. Please try again.");
        }
      } else if (result.type === 'cancel') {
        // User canceled the process
        Alert.alert("Canceled", "Stripe account setup was canceled.");
      } else {
        // Some other error occurred
        Alert.alert("Error", "There was a problem with the Stripe connection process. Please try again.");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message);
      console.error("Stripe Connect Error:", error);
    } finally {
      setLoading(false);
      setIsProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      <Button
        mode="contained"
        onPress={handleStripeConnect}
        loading={loading}
        disabled={loading}
        style={styles.button}
      >
        Connect Stripe Account
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  button: {
    padding: 8,
    backgroundColor: '#6F4E37',
  }
});

export default StripeConnectComponent;