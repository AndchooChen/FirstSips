import { View, Alert, StyleSheet, Platform } from 'react-native';
import { useState } from 'react';
import { useStripe } from '@stripe/stripe-react-native';
import { Button } from 'react-native-paper';

interface PaymentComponentProps {
  amount: number;
  onSuccess: (paymentIntent: any) => void;
}

const PaymentComponent = ({ amount, onSuccess }: PaymentComponentProps) => {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [loading, setLoading] = useState(false);

  // Update API URL with your actual IP address
  const API_URL = Platform.select({
    android: 'http://192.168.50.84:5000',  // Updated for Android
    ios: 'http://192.168.50.84:5000',      // Updated for iOS
    default: 'http://192.168.50.84:5000'   // Updated default
  });

  const handlePayment = async () => {
    try {
      setLoading(true);
      console.log('Making request to:', `${API_URL}/payments/create-payment-intent`); // Debug log

      // 1. Create Payment Intent - Use API_URL instead of localhost
      const response = await fetch(`${API_URL}/payments/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amount,
          currency: 'usd',
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Response data:', data); // Debug log

      const { clientSecret } = data;

      // 2. Initialize Payment Sheet
      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: 'FirstSips',
        paymentIntentClientSecret: clientSecret,
        defaultBillingDetails: {
          name: '', // Can be populated if you have user data
        }
      });

      if (initError) {
        throw new Error(initError.message);
      }

      // 3. Present Payment Sheet
      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        throw new Error(presentError.message);
      }

      Alert.alert('Success', 'Payment completed!');
      onSuccess(clientSecret);

    } catch (error: any) {
      Alert.alert('Error', error.message);
      console.error('Payment Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Button
        mode="contained"
        onPress={handlePayment}
        loading={loading}
        disabled={loading}
        style={styles.button}
      >
        Pay ${(amount / 100).toFixed(2)}
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

export default PaymentComponent;