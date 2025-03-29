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
    console.log('Making request to:', `http://192.168.50.84:5000/payments/create-payment-intent`);
    console.log('Amount being sent:', amount);

    const response = await fetch(`http://192.168.50.84:5000/payments/create-payment-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Math.round(amount),
        currency: 'usd',
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const { clientSecret, paymentIntentId } = await response.json();
    console.log('Response data:', { clientSecret, paymentIntentId });

    if (!clientSecret) {
      throw new Error('No client secret received from server');
    }

    const { error: initError } = await initPaymentSheet({
      merchantDisplayName: 'FirstSips',
      paymentIntentClientSecret: clientSecret,  // This should be the exact string from the backend
      defaultBillingDetails: {
        name: '',
      },
    });
    
    console.log('Init Payment Sheet Response:', { initError });  // Add this log
    
    if (initError) {
      console.log('Init Error Details:', initError);  // Add this log
      throw new Error(initError.message);
    }
    
    // Present Payment Sheet
    console.log('Presenting payment sheet...');  // Add this log
    const { error: presentError } = await presentPaymentSheet();
    console.log('Present Sheet Response:', { presentError });  // Add this log

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