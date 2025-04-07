import { View, Alert, StyleSheet } from 'react-native';
import { useState } from 'react';
import { useStripe } from '@stripe/stripe-react-native';
import { Button } from 'react-native-paper';
import { orderService } from '../services/orderService';
import { API_URL } from '../config/api';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  options?: {
    size?: string;
    extras?: string[];
  };
  notes?: string;
}

interface PaymentComponentProps {
  amount: number;
  onSuccess: (result: { orderId: string; clientSecret: string }) => void;
  cartItems: CartItem[];
  shopId: string;
  customerInfo: {
    name: string;
    phoneNumber: string;
    userId: string;
    address?: string;
  };
  pickupTime: string;
  setIsProcessing: (isProcessing: boolean) => void;
}

const PaymentComponent = ({ 
  amount, 
  onSuccess, 
  cartItems, 
  shopId, 
  customerInfo,
  pickupTime,
  setIsProcessing 
}: PaymentComponentProps) => {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [loading, setLoading] = useState(false);

  const createOrder = async (paymentIntentId: string) => {
    try {
      const order = await orderService.createOrder({
        shopId,
        items: cartItems,
        totalAmount: amount / 100,
        pickupTime,
        paymentIntentId
      });
      return order.id;
    } catch (error) {
      console.error('Error creating order:', error);
      throw new Error('Failed to create order');
    }
  };

  const handlePayment = async () => {
    if (loading) return;

    try {
      setLoading(true);
      setIsProcessing(true);
      
      // Create Payment Intent using payment-sheet endpoint
      const response = await fetch(`${API_URL}/payments/payment-sheet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Math.round(amount),
          currency: 'usd',
          customerId: customerInfo.userId,
          shopId,
          metadata: {
            customerName: customerInfo.name,
            customerPhone: customerInfo.phoneNumber,
            pickupTime
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create payment');
      }

      const { paymentIntent, ephemeralKey, customer } = await response.json();

      // Initialize Payment Sheet
      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: 'FirstSips',
        paymentIntentClientSecret: paymentIntent,
        customerEphemeralKeySecret: ephemeralKey,
        customerId: customer,
        defaultBillingDetails: {
          name: customerInfo.name,
          phone: customerInfo.phoneNumber,
        },
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

      // Create order in the backend
      const orderId = await createOrder(paymentIntent);
      
      Alert.alert(
        'Payment Successful',
        'Your order has been placed successfully!',
        [{ text: 'OK', onPress: () => onSuccess({ orderId, clientSecret: paymentIntent }) }]
      );

    } catch (error: any) {
      Alert.alert(
        'Payment Failed',
        error.message || 'An error occurred while processing your payment. Please try again.',
        [{ text: 'OK' }]
      );
      console.error('Payment Error:', error);
    } finally {
      setLoading(false);
      setIsProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      <Button
        mode="contained"
        onPress={handlePayment}
        loading={loading}
        disabled={loading}
        style={[styles.button, loading && styles.buttonDisabled]}
        labelStyle={styles.buttonLabel}
      >
        {loading ? 'Processing...' : `Pay $${(amount / 100).toFixed(2)}`}
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

export default PaymentComponent;