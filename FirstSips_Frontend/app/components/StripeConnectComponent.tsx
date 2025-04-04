import { View, Alert, StyleSheet } from 'react-native';
import { useState } from 'react';
import { useStripe } from '@stripe/stripe-react-native';
import { Button } from 'react-native-paper';
import { doc, updateDoc } from 'firebase/firestore';
import { FIREBASE_DB, FIREBASE_AUTH } from '../auth/FirebaseConfig';
import React from 'react';

interface StripeConnectComponentProps {
  onSuccess: () => void;
  setIsProcessing: (isProcessing: boolean) => void;
}

const StripeConnectComponent = ({ onSuccess, setIsProcessing }: StripeConnectComponentProps) => {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [loading, setLoading] = useState(false);

  const handleStripeConnect = async () => {
    try {
      setIsProcessing(true);
      setLoading(true);
      
      const userId = FIREBASE_AUTH.currentUser?.uid;
      if (!userId) {
        throw new Error('User not found');
      }

      // Create Payment Intent for setup
      const response = await fetch('http://192.168.50.84:5000/stripe/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          setup: true
        }),
      });

      const { clientSecret } = await response.json();

      // Initialize Payment Sheet
      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: 'FirstSips',
        paymentIntentClientSecret: clientSecret,
        allowsDelayedPaymentMethods: true,
      });

      if (initError) {
        throw new Error(initError.message);
      }

      // Present Payment Sheet
      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        throw new Error(presentError.message);
      }

      // Update user's Stripe status
      await updateDoc(doc(FIREBASE_DB, 'users', userId), {
        stripeConnected: true
      });

      Alert.alert('Success', 'Stripe account connected successfully!');
      onSuccess();

    } catch (error: any) {
      Alert.alert('Error', error.message);
      console.error('Stripe Connect Error:', error);
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