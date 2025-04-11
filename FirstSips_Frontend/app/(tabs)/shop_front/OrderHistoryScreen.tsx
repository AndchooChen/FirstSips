import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from "@expo/vector-icons";
import { supabase } from '../../utils/supabase';

interface Order {
    id: string;
    status: string;
    pickupTime: string;
    totalAmount: number;
    shopName?: string;
    address?: string;
    phoneNumber?: string;
    createdAt?: string;
}

const OrderHistoryScreen = () => {
  const [orderDetails, setOrderDetails] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
          console.error('Auth error:', authError);
          setLoading(false);
          return;
        }

        // Fetch all orders for this user
        const { data: ordersData, error: ordersError } = await supabase
          .from("orders")
          .select("*")
          .eq("user_id", user.id)
          .order('created_at', { ascending: false });

        if (ordersError) {
          console.error("Error fetching orders:", ordersError.message);
          setLoading(false);
          return;
        }

        if (!ordersData || ordersData.length === 0) {
          console.log("No orders found for this user.");
          setOrderDetails([]);
          setLoading(false);
          return;
        }

        // Fetch shop details for each order
        const fetchedOrderDetails: Order[] = [];

        for (const order of ordersData) {
          const { data: shopData } = await supabase
            .from("shops")
            .select("shop_name, street_address, phone_number")
            .eq("id", order.shop_id)
            .single();

          fetchedOrderDetails.push({
            id: order.id,
            status: order.status || 'pending',
            pickupTime: order.pickup_time || 'Not specified',
            totalAmount: order.total_amount || order.total || 0,
            shopName: shopData?.shop_name || "Unknown Shop",
            address: shopData?.street_address || "No address available",
            phoneNumber: shopData?.phone_number || "No phone number available",
            createdAt: order.created_at,
          });
        }

        setOrderDetails(fetchedOrderDetails);
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);



  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D4A373" />
      </View>
    );
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return '#4CAF50';
      case 'preparing': return '#FFC107';
      case 'accepted': return '#2196F3';
      case 'pending': return '#FF9800';
      default: return '#757575';
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header with Back Button */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#6F4E37" />
          </TouchableOpacity>
          <Text style={styles.headerText}>Order History</Text>
          <View style={styles.headerSpacer} />
        </View>

        {orderDetails.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color="#D4A373" />
            <Text style={styles.emptyText}>No orders found</Text>
            <Text style={styles.emptySubtext}>Your order history will appear here</Text>
          </View>
        ) : (
          <FlatList
            data={orderDetails}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.orderItem}>
                <View style={styles.orderHeader}>
                  <View>
                    <Text style={styles.shopName}>{item.shopName}</Text>
                    <Text style={styles.orderDate}>{formatDate(item.createdAt)}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                    <Text style={styles.statusText}>{item.status}</Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.orderDetails}>
                  <View style={styles.detailRow}>
                    <Ionicons name="time-outline" size={18} color="#6F4E37" />
                    <Text style={styles.detailText}>Pickup: {item.pickupTime}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Ionicons name="location-outline" size={18} color="#6F4E37" />
                    <Text style={styles.detailText}>{item.address}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Ionicons name="call-outline" size={18} color="#6F4E37" />
                    <Text style={styles.detailText}>{item.phoneNumber}</Text>
                  </View>
                </View>

                <View style={styles.orderFooter}>
                  <Text style={styles.totalAmount}>Total: ${parseFloat(item.totalAmount.toString()).toFixed(2)}</Text>
                </View>
              </View>
            )}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F5EDD8',
    },
    container: {
        flex: 1,
        backgroundColor: '#F5EDD8',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5EDD8',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 40,
        paddingBottom: 16,
    },
    backButton: {
        padding: 8,
    },
    headerText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#6F4E37',
    },
    headerSpacer: {
        width: 40, // Same width as back button for centering title
    },
    listContent: {
        padding: 16,
        paddingBottom: 24,
    },
    orderItem: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        marginBottom: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    shopName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#6F4E37',
    },
    orderDate: {
        fontSize: 14,
        color: '#666666',
        marginTop: 4,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    statusText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 12,
    },
    divider: {
        height: 1,
        backgroundColor: '#E0E0E0',
        marginVertical: 12,
    },
    orderDetails: {
        marginBottom: 12,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    detailText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#333333',
    },
    orderFooter: {
        alignItems: 'flex-end',
        marginTop: 8,
    },
    totalAmount: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#D4A373',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#6F4E37',
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#666666',
        marginTop: 8,
        textAlign: 'center',
    },
});

export default OrderHistoryScreen;
