import { View, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { Text, Button, Surface, ActivityIndicator } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';

// Interfaces remain the same...
interface OrderDetails { /* ... */ }
interface OrderItem { /* ... */ }
interface ShopData { /* ... */ }

const SuccessScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [orderData, setOrderData] = useState<OrderDetails | null>(null);
  const [shopData, setShopData] = useState<ShopData | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true); // Added loading state

  // getOrderDetails function remains largely the same...
  const getOrderDetails = async () => {
    setLoading(true);
    if (!params.orderId) { setLoading(false); return; }
    try {
        // Fetch order
        const { data: orderData, error: orderError } = await supabase.from('orders').select('*').eq('id', params.orderId).single();
        if (orderError || !orderData) { throw orderError || new Error('Order not found'); }
        setOrderData({ ...orderData, order_id: orderData.id, pickup_time: orderData.pickup_time });

        // Fetch order items
        const { data: orderItemsData, error: orderItemsError } = await supabase.from('order_items').select('*, items(name, description)').eq('order_id', orderData.id);
        if (!orderItemsError && orderItemsData) {
            const processedItems = orderItemsData.map(item => ({
                id: item.id, order_id: item.order_id, item_id: item.item_id, quantity: item.quantity, price: item.price,
                name: (item.items as any)?.name || 'Unknown Item', description: (item.items as any)?.description || ''
            }));
            setOrderItems(processedItems);
        } else { console.error('Error fetching order items:', orderItemsError); }

        // Fetch shop
        const { data: shopData, error: shopError } = await supabase.from("shops").select("*").eq("id", orderData.shop_id).single();
        if (shopError || !shopData) { throw shopError || new Error('Shop not found'); }
        setShopData(shopData);

    } catch (error: any) {
        console.error('Error fetching success details:', error.message);
        // Optionally show an error message to the user
    } finally {
        setLoading(false);
    }
  }

  useEffect(() => {
    getOrderDetails();
  }, [params.orderId]);

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#6F4E37" />
      </SafeAreaView>
    );
  }

  // Error or no data state
  if (!orderData || !shopData) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Could not load order details.</Text>
        <Button mode="outlined" onPress={() => router.push("/(tabs)/dashboard/DashboardScreen")} style={styles.errorButton}>
          Return to Home
        </Button>
      </SafeAreaView>
    );
  }

  // Calculate total function remains the same...
  const calculateTotal = () => { /* ... */ };

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
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Use View instead of Surface for simpler background control */}
        <View style={styles.contentCard}>
          <View style={styles.iconContainer}>
            <Ionicons name="checkmark-circle" size={80} color="#4CAF50" />
          </View>

          <Text style={styles.title}>Order Confirmed!</Text>
          <Text style={styles.subtitle}>Thank you for ordering with FirstSips.</Text>

          <View style={styles.detailsContainer}>
            <DetailRow icon="time-outline" label="Pickup Time" value={orderData.pickup_time} />
            <DetailRow icon="storefront-outline" label="Pickup Location" value={shopData.shop_name} />
            <DetailRow icon="location-outline" label="Address" value={`${shopData.street_address}, ${shopData.city}, ${shopData.state} ${shopData.zip}`} />
            <DetailRow icon="call-outline" label="Phone" value={shopData.phone_number || 'N/A'} />
            <DetailRow icon="receipt-outline" label="Order Number" value={`FS-${orderData.order_id.slice(-6).toUpperCase()}`} />
            <DetailRow icon="cash-outline" label="Total Amount" value={`$${calculateTotal()}`} />
          </View>

          {/* Order Items Section */}
          {orderItems.length > 0 && (
            <View style={styles.orderItemsContainer}>
              <Text style={styles.orderItemsTitle}>Your Order</Text>
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

          {/* Use ScreenWideButton for consistency */}
          <Button
            mode="contained"
            onPress={() => router.replace("/(tabs)/dashboard/DashboardScreen")} // Use replace
            style={styles.primaryButton} // Apply primary button style
            labelStyle={styles.primaryButtonText} // Style text inside button
          >
            Return to Home
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // White background
    paddingHorizontal: 16, // Horizontal padding for the screen
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentCard: { // Replaces Surface for better control
    padding: 20,
    borderRadius: 12,
    backgroundColor: '#FFFFFF', // Ensure card is white
    marginVertical: 20, // Vertical margin for the card
    // Add subtle shadow
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2.22,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 26, // Slightly adjusted size
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333333', // Dark grey title
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#555555', // Medium grey subtitle
    marginBottom: 32, // Increased space
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
    marginRight: 16, // Increased icon spacing
    color: '#6F4E37', // Accent color for icons
  },
  detailText: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: '#888888', // Lighter grey label
    marginBottom: 2, // Space between label and value
  },
  detailValue: {
    fontSize: 16,
    color: '#333333', // Dark grey value
    fontWeight: '500',
  },
  primaryButton: { // Primary button style
    marginTop: 24, // Space above button
    backgroundColor: '#6F4E37',
    borderRadius: 12,
    paddingVertical: 8, // Adjust padding for react-native-paper Button
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  primaryButtonText: {
      fontSize: 16,
      color: '#FFFFFF', // White text
      fontWeight: 'bold',
  },
  orderItemsContainer: {
    marginTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE', // Lighter separator
    paddingTop: 16,
  },
  orderItemsTitle: {
    fontSize: 18,
    fontWeight: '600', // Semi-bold
    color: '#333333', // Dark grey title
    marginBottom: 12,
  },
  orderItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10, // Adjusted padding
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5', // Very light separator
  },
  orderItemInfo: {
    flex: 1,
    marginRight: 10, // Space before price
  },
  orderItemName: {
    fontSize: 16,
    color: '#333333',
  },
  orderItemQuantity: {
    fontSize: 14,
    color: '#888888',
    marginTop: 2,
  },
  orderItemPrice: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
  },
  errorText: {
      textAlign: 'center',
      fontSize: 16,
      color: '#D32F2F', // Error color
      marginBottom: 16,
  },
  errorButton: {
      borderColor: '#6F4E37', // Accent color border
  },
});

export default SuccessScreen;
