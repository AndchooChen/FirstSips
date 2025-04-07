import { View, Alert, StyleSheet } from 'react-native';
import { useState } from 'react';
import { useStripe } from '@stripe/stripe-react-native';
import { Button } from 'react-native-paper';
import { useAuth } from '../auth/AuthContext';
import { userService } from '../services/userService';
import React from 'react';

interface StripeConnectComponentProps {
  onSuccess: () => void;
  setIsProcessing: (isProcessing: boolean) => void;
}

const StripeConnectComponent = ({ onSuccess, setIsProcessing }: StripeConnectComponentProps) => {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const handleStripeConnect = async () => {
    if (!user) {
      Alert.alert('Error', 'Please log in to connect your Stripe account');
      return;
    }

    if (loading) return;

    try {
      setIsProcessing(true);
      setLoading(true);
      
      // Initiate Stripe Connect process
      const { clientSecret, accountId } = await userService.initiateStripeConnect();

      // Initialize Payment Sheet
      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: 'FirstSips',
        paymentIntentClientSecret: clientSecret,
        allowsDelayedPaymentMethods: true,
        style: 'automatic',
        appearance: {
          colors: {
            primary: '#6F4E37',
            background: '#FEFAE0',
            componentBackground: '#FFFFFF',
            componentBorder: '#D4A373',
            componentDivider: '#E9EDC9',
            primaryText: '#6F4E37',
            secondaryText: '#666666',
            componentText: '#000000',
            icon: '#6F4E37',
          },
        },
      });

      if (initError) {
        throw new Error(initError.message);
      }

      // Present Payment Sheet
      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        throw new Error(presentError.message);
      }

      // Complete Stripe Connect process
      await userService.completeStripeConnect();

      Alert.alert(
        'Success',
        'Your Stripe account has been connected successfully! You can now start receiving payments.',
        [{ text: 'OK', onPress: onSuccess }]
      );

    } catch (error: any) {
      Alert.alert(
        'Connection Failed',
        error.message || 'Failed to connect your Stripe account. Please try again.',
        [{ text: 'OK' }]
      );
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
        style={[styles.button, loading && styles.buttonDisabled]}
        labelStyle={styles.buttonLabel}
      >
        {loading ? 'Connecting...' : 'Connect Stripe Account'}
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  button: {
    padding: 8,
    backgroundColor: '#6F4E37',
    borderRadius: 8,
  },
  buttonDisabled: {
    backgroundColor: '#A89B91',
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
    paddingVertical: 4,
  }
});

export default StripeConnectComponent; 