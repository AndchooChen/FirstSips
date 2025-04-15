import { View, StyleSheet, SafeAreaView } from 'react-native';
import { Text, Button, Surface, ActivityIndicator } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';

interface OrderDetails {
  order_id: string;
  customer_name: string;
  pickup_time: string;
  order_number: string;
  shop_id: string;
  status: 'pending' | 'accepted' | 'preparing' | 'ready' | 'completed';
  total_amount: number;
  total?: number; // Some orders might use total instead of total_amount
}

interface OrderItem {
  id: string;
  order_id: string;
  item_id: string;
  quantity: number;
  price: number;
  name?: string; // Added after joining with items table
  description?: string; // Added after joining with items table
}

interface ShopData {
  id: string;
  shop_name: string;
  street_address: string;
  city: string;
  state: string;
  zip: string;
  phone_number: string;
}

const SuccessScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [orderData, setOrderData] = useState<OrderDetails | null>(null);
  const [shopData, setShopData] = useState<ShopData | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);

  const getOrderDetails = async () => {
    if (!params.orderId) {
      return;
    }

    // Fetch order by ID
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', params.orderId)
      .single();

    if (orderError || !orderData) {
      console.error('Error fetching order:', orderError);
      return;
    }

    setOrderData({
      ...orderData,
      order_id: orderData.id,
      pickup_time: orderData.pickup_time,
    });

    // Fetch order items
    const { data: orderItemsData, error: orderItemsError } = await supabase
      .from('order_items')
      .select(`
        id,
        order_id,
        item_id,
        quantity,
        price,
        items(name, description)
      `)
      .eq('order_id', orderData.id);

    if (!orderItemsError && orderItemsData) {
      // Process the joined data to flatten the structure
      const processedItems = orderItemsData.map(item => {
        // Handle the nested items object from the join
        const itemDetails = item.items as any;
        return {
          id: item.id,
          order_id: item.order_id,
          item_id: item.item_id,
          quantity: item.quantity,
          price: item.price,
          name: itemDetails?.name || 'Unknown Item',
          description: itemDetails?.description || ''
        };
      });

      setOrderItems(processedItems);
    } else {
      console.error('Error fetching order items:', orderItemsError);
    }

    // Fetch related shop using shop_id from the order
    const { data: shopData, error: shopError } = await supabase
      .from("shops")
      .select("*")
      .eq("id", orderData.shop_id)
      .single();

    if (shopError || !shopData) {
      console.error('Error fetching shop:', shopError);
      return;
    }

    setShopData(shopData);
  }


  useEffect(() => {
    getOrderDetails();
  }, [params.orderId]);

  if (!orderData || !shopData) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#6F4E37" />
      </SafeAreaView>
    );
  }

  // Calculate total from order items if needed
  const calculateTotal = () => {
    if (orderData.total_amount || orderData.total) {
      return ((orderData.total_amount || orderData.total || 0) / 100).toFixed(2);
    }

    // Calculate from order items if no total is available
    return orderItems
      .reduce((sum, item) => sum + (item.price * item.quantity), 0)
      .toFixed(2);
  };

  const DetailRow = ({ icon, label, value }: { icon: any; label: string; value?: string }) => (
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
            value={orderData.pickup_time}
          />
          <DetailRow
            icon="business"
            label="Pickup Location"
            value={shopData.shop_name}
          />
          <DetailRow
            icon="location"
            label="Address"
            value={`${shopData.street_address}, ${shopData.city}, ${shopData.state} ${shopData.zip}`}
          />
          <DetailRow
            icon="call"
            label="Phone"
            value={shopData.phone_number}
          />
          <DetailRow
            icon="receipt"
            label="Order Number"
            value={`FS-${orderData.order_id.slice(-6)}`}
          />
          <DetailRow
            icon="cash"
            label="Total Amount"
            value={`$${calculateTotal()}`}
          />
        </View>

        {/* Order Items Section */}
        {orderItems.length > 0 && (
          <View style={styles.orderItemsContainer}>
            <Text style={styles.orderItemsTitle}>Order Items</Text>
            {orderItems.map((item) => (
              <View key={item.id} style={styles.orderItemRow}>
                <View style={styles.orderItemInfo}>
                  <Text style={styles.orderItemName}>{item.name}</Text>
                  <Text style={styles.orderItemQuantity}>Qty: {item.quantity}</Text>
                </View>
                <Text style={styles.orderItemPrice}>${(item.price * item.quantity).toFixed(2)}</Text>
              </View>
            ))}
          </View>
        )}

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
    backgroundColor: '#FFFFFF',
    marginVertical: 16,
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
  orderItemsContainer: {
    marginTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 16,
  },
  orderItemsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6F4E37',
    marginBottom: 12,
  },
  orderItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  orderItemInfo: {
    flex: 1,
  },
  orderItemName: {
    fontSize: 16,
    color: '#333333',
  },
  orderItemQuantity: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  orderItemPrice: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6F4E37',
  },
});

export default SuccessScreen;