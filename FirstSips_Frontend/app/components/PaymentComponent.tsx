import { View, Alert, StyleSheet, Platform } from 'react-native';
import { useState, useEffect } from 'react';
import { useStripe } from '@stripe/stripe-react-native';
import { Button } from 'react-native-paper';

interface PaymentComponentProps {
  amount: number;
  onSuccess: () => void;
}

const PaymentComponent = ({ amount, onSuccess }: PaymentComponentProps) => {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [loading, setLoading] = useState(false);
  const [paymentSheetReady, setPaymentSheetReady] = useState(false);

  // Use your computer's IP address instead of localhost for device testing
  const API_URL = Platform.select({
    android: 'http://10.0.2.2:5000',  // Android Emulator
    ios: 'http://localhost:5000',     // iOS Simulator
    default: 'http://localhost:5000'  // Web
  });

  useEffect(() => {
    initializePayment();
  }, [amount]);

  const initializePayment = async () => {
    try {
      setLoading(true);
      setPaymentSheetReady(false);

      const response = await fetch(`${API_URL}/payments/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Math.round(amount), // Ensure amount is rounded
          currency: 'usd',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

      const { clientSecret } = await response.json();

      const { error } = await initPaymentSheet({
        merchantDisplayName: 'FirstSips',
        paymentIntentClientSecret: clientSecret,
        applePay: {
          merchantCountryCode: 'US',
        },
        googlePay: true,
        style: 'automatic',
        returnURL: 'firstsips://payment-result', // Add your app's URL scheme
      });

      if (error) {
        throw new Error(error.message);
      }

      setPaymentSheetReady(true);
    } catch (error: any) {
      Alert.alert(
        'Payment Setup Error',
        error.message || 'Failed to initialize payment'
      );
      console.error('Payment Setup Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!paymentSheetReady) {
      Alert.alert('Error', 'Payment not ready');
      return;
    }

    try {
      const { error } = await presentPaymentSheet();

      if (error) {
        throw new Error(error.message);
      }

      onSuccess();
    } catch (error: any) {
      Alert.alert(
        'Payment Error',
        error.message || 'Payment failed'
      );
      console.error('Payment Error:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Button
        mode="contained"
        onPress={handlePayment}
        loading={loading}
        disabled={loading || !paymentSheetReady}
        style={styles.button}
      >
        Place Order ${(amount / 100).toFixed(2)}
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  button: {
    marginTop: 20,
    paddingVertical: 8,
  },
});

export default PaymentComponent;