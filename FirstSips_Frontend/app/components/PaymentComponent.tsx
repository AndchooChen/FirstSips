import { View, Alert, StyleSheet } from 'react-native';
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

  const handlePayment = async () => {
    try {
      setLoading(true);

      // 1. Create Payment Intent
      const response = await fetch('http://localhost:5000/payments/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amount,
          currency: 'usd',
        }),
      });

      const { clientSecret } = await response.json();

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