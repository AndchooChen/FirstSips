import { View, StyleSheet, SafeAreaView } from 'react-native';
import { Text, Button, Surface, ActivityIndicator } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { FIREBASE_DB } from "../auth/FirebaseConfig";
import { doc, getDoc } from 'firebase/firestore';

interface OrderDetails {
  orderId: string;
  customerName: string;
  pickupTime: string;
  orderNumber: string;
  shopId: string;
  status: 'pending' | 'accepted' | 'preparing' | 'ready' | 'completed';
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
}

const SuccessScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [orderData, setOrderData] = useState<OrderDetails | null>(null);
  const [shopData, setShopData] = useState<any>(null);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (params.orderId) {
        const orderDoc = await getDoc(doc(FIREBASE_DB, "orders", params.orderId as string));
        if (orderDoc.exists()) {
          const data = orderDoc.data();
          setOrderData({
            ...data,
            orderId: orderDoc.id,
            pickupTime: data.pickupTime,
          } as OrderDetails);

          // Fetch shop data after getting order
          const shopDoc = await getDoc(doc(FIREBASE_DB, "shops", data.shopId));
          if (shopDoc.exists()) {
            setShopData(shopDoc.data());
          }
        }
      }
    };
    fetchOrderDetails();
  }, [params.orderId]);

  if (!orderData || !shopData) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#6F4E37" />
      </SafeAreaView>
    );
  }

  const DetailRow = ({ icon, label, value }: { icon: string; label: string; value?: string }) => (
    <View style={styles.detailRow}>
      <Ionicons name={icon} size={24} color="#6F4E37" style={styles.detailIcon} />
      <View style={styles.detailText}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value || 'Loading...'}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Surface style={styles.surface}>
        <View style={styles.iconContainer}>
          <Ionicons name="checkmark-circle" size={80} color="#4CAF50" />
        </View>
        
        <Text style={styles.title}>Order Confirmed!</Text>
        <Text style={styles.subtitle}>Thank you for ordering with FirstSips</Text>

        <View style={styles.detailsContainer}>
          <DetailRow 
            icon="time" 
            label="Pickup Time" 
            value={orderData.pickupTime} 
          />
          <DetailRow 
            icon="location" 
            label="Pickup Location" 
            value={shopData.shopName} 
          />
          <DetailRow 
            icon="receipt" 
            label="Order Number" 
            value={`FS-${orderData.orderId.slice(-6)}`} 
          />
          <DetailRow 
            icon="cash" 
            label="Total Amount" 
            value={`$${(orderData.totalAmount / 100).toFixed(2)}`} 
          />
        </View>

        <Button 
          mode="contained" 
          onPress={() => router.push("/(tabs)/dashboard/DashboardScreen")}
          style={styles.button}
        >
          Return to Home
        </Button>
      </Surface>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5EDD8',
    padding: 16,
  },
  surface: {
    padding: 20,
    borderRadius: 12,
    elevation: 4,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#6F4E37',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666666',
    marginBottom: 24,
  },
  detailsContainer: {
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailIcon: {
    marginRight: 12,
  },
  detailText: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666666',
  },
  detailValue: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '500',
  },
  button: {
    marginTop: 16,
    backgroundColor: '#6F4E37',
  },
});

export default SuccessScreen;