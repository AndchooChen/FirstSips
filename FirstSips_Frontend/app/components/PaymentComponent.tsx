import { View, Alert, StyleSheet } from 'react-native';
import { useState } from 'react';
import { useStripe } from '@stripe/stripe-react-native';
import { Button } from 'react-native-paper';
import { addDoc, collection } from 'firebase/firestore';
import { FIREBASE_DB } from '../auth/FirebaseConfig';
import { OrderStatus } from '../types/order';
<<<<<<< HEAD
import { API_URL } from '../config/api';
=======
>>>>>>> 68fb1e5fa391f1bdac2f665bb27bc781ec148f7d

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
      const orderRef = collection(FIREBASE_DB, 'orders');
      const newOrder = {
        shopId,
        customerId: customerInfo.userId,
        customerName: customerInfo.name,
        customerPhone: customerInfo.phoneNumber,
        items: cartItems,
        totalAmount: (amount / 100).toFixed(2),
        paymentIntentId,
        status: 'pending' as OrderStatus,
        createdAt: new Date(),
        updatedAt: new Date(),
        pickupTime: pickupTime,
      };

      const docRef = await addDoc(orderRef, newOrder);
      return docRef.id;
    } catch (error) {
      console.error('Error creating order:', error);
      throw new Error('Failed to create order');
    }
  };

  const handlePayment = async () => {
    try {
      setIsProcessing(true);
      
<<<<<<< HEAD
      // Create Payment Intent using payment-sheet endpoint
      console.log(`${API_URL}/payments/payment-sheet`);
      const response = await fetch(`${API_URL}/payments/payment-sheet`, {
=======
      // Create Payment Intent
      const response = await fetch(`http://192.168.50.84:5000/payments/create-payment-intent`, {
>>>>>>> 68fb1e5fa391f1bdac2f665bb27bc781ec148f7d
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Math.round(amount),
          currency: 'usd',
<<<<<<< HEAD
          customerId: customerInfo.userId,
          shopId
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create payment');
      }

      const { paymentIntent, ephemeralKey, customer } = await response.json();
=======
        }),
      });

      const { clientSecret, paymentIntentId } = await response.json();
>>>>>>> 68fb1e5fa391f1bdac2f665bb27bc781ec148f7d

      // Initialize Payment Sheet
      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: 'FirstSips',
<<<<<<< HEAD
        paymentIntentClientSecret: paymentIntent,
        customerEphemeralKeySecret: ephemeralKey,
        customerId: customer,
=======
        paymentIntentClientSecret: clientSecret,
>>>>>>> 68fb1e5fa391f1bdac2f665bb27bc781ec148f7d
        defaultBillingDetails: {
          name: customerInfo.name,
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

      // Create order in Firestore
<<<<<<< HEAD
      const orderId = await createOrder(paymentIntent);
      
      Alert.alert('Success', 'Payment completed!');
      onSuccess({ orderId, clientSecret: paymentIntent });
=======
      const orderId = await createOrder(paymentIntentId);
      
      Alert.alert('Success', 'Payment completed!');
      onSuccess({ orderId, clientSecret });
>>>>>>> 68fb1e5fa391f1bdac2f665bb27bc781ec148f7d

    } catch (error: any) {
      Alert.alert('Error', error.message);
      console.error('Payment Error:', error);
    } finally {
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