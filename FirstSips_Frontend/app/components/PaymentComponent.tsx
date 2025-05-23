import { View, Alert, StyleSheet } from 'react-native';
import { useState } from 'react';
import { useStripe } from '@stripe/stripe-react-native';
import { Button } from 'react-native-paper';
import { supabase } from '../utils/supabase';

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
      const { data, error } = await supabase
        .from("orders")
        .insert({
          shop_id: shopId,
          customer_id: customerInfo.userId,
          customer_name: customerInfo.name,
          customer_phone: customerInfo.phoneNumber,
          items: cartItems,
          total_amount: (amount / 100).toFixed(2),
          payment_intent_id: paymentIntentId,
          status: "pending",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          pickup_time: pickupTime,
        })
        .select("id")
        .single();
  
      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error("Error creating order:", error);
      throw new Error("Failed to create order");
    }
  };

  const handlePayment = async () => {
    try {
      setIsProcessing(true);
      
      // Create Payment Intent
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

      const { clientSecret, paymentIntentId } = await response.json();

      // Initialize Payment Sheet
      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: 'FirstSips',
        paymentIntentClientSecret: clientSecret,
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
      const orderId = await createOrder(paymentIntentId);
      
      Alert.alert('Success', 'Payment completed!');
      onSuccess({ orderId, clientSecret });

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