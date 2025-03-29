import { View, StyleSheet, SafeAreaView } from 'react-native';
import { Text, Button, Surface } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { FIREBASE_DB } from "../auth/FirebaseConfig";
import { doc, getDoc } from 'firebase/firestore';

interface OrderDetails {
  pickupTime: string;
  orderNumber: string;
  shopId: string;
}

const SuccessScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [shopData, setShopData] = useState<any>(null);
  const orderDetails: OrderDetails = {
    pickupTime: params.pickupTime as string,
    orderNumber: `FS-${Date.now().toString().slice(-6)}`,
    shopId: params.shopId as string,
  };

  useEffect(() => {
    const fetchShopData = async () => {
      if (orderDetails.shopId) {
        const shopDoc = await getDoc(doc(FIREBASE_DB, "shops", orderDetails.shopId));
        if (shopDoc.exists()) {
          setShopData(shopDoc.data());
        }
      }
    };
    fetchShopData();
  }, [orderDetails.shopId]);

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
            value={orderDetails.pickupTime} 
          />
          <DetailRow 
            icon="location" 
            label="Pickup Location" 
            value={shopData?.shopName} 
          />
          <DetailRow 
            icon="map" 
            label="Address" 
            value={`${shopData?.streetAddress}, ${shopData?.city}`} 
          />
          <DetailRow 
            icon="call" 
            label="Shop Phone" 
            value={shopData?.phoneNumber} 
          />
          <DetailRow 
            icon="receipt" 
            label="Order Number" 
            value={orderDetails.orderNumber} 
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

const DetailRow = ({ icon, label, value }: { icon: string; label: string; value?: string }) => (
  <View style={styles.detailRow}>
    <Ionicons name={icon} size={24} color="#6F4E37" style={styles.detailIcon} />
    <View style={styles.detailText}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value || 'Loading...'}</Text>
    </View>
  </View>
);

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