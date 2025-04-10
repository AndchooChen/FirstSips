import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native';
import { FIREBASE_DB, FIREBASE_AUTH } from '../../auth/FirebaseConfig';
import { useRouter } from 'expo-router';
import { Ionicons } from "@expo/vector-icons";
import { supabase } from '../../utils/supabase';

interface Order {
    id: string;
    status: string;
    pickupTime: string;
    totalAmount: number;
}
  
interface Shop {
    id: string;
    name: string;
    address: string;
    phoneNumber: string;
}

const OrderHistoryScreen = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderDetails, setOrderDetails] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const user = supabase.auth.user();

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) {
        console.log("No user found, exiting fetchOrders.");
        return;
      }
  
      try {
        console.log("Fetching orders for user:", user.id);
  
        // Fetch all orders for this user
        const { data: ordersData, error: ordersError } = await supabase
          .from("orders")
          .select("*")
          .eq("user_id", user.id);
  
        if (ordersError) {
          console.error("Error fetching orders:", ordersError.message);
          return;
        }
  
        if (!ordersData || ordersData.length === 0) {
          console.log("No orders found for this user.");
          setOrders([]);
          return;
        }
  
        // Map basic order objects with just ID (if needed)
        const fetchedOrders: Order[] = ordersData.map((order) => ({ id: order.id }));
        setOrders(fetchedOrders);
  
        // Fetch shop details for each order
        await fetchOrderDetails(ordersData);
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoading(false);
        console.log("Order fetching completed.");
      }
    };
  
    const fetchOrderDetails = async (ordersData: any[]) => {
      try {
        const fetchedOrderDetails: any[] = [];
  
        for (const order of ordersData) {
          const { data: shopData, error: shopError } = await supabase
            .from("shops")
            .select("shop_name, street_address, phone_number")
            .eq("id", order.shop_id)
            .single();
  
          if (shopError) {
            console.warn(`No shop found with ID: ${order.shop_id}`);
          }
  
          fetchedOrderDetails.push({
            id: order.id,
            status: order.status,
            pickupTime: order.pickup_time,
            totalAmount: order.total_amount,
            shopId: order.shop_id,
            shopName: shopData?.shop_name || "Unknown Shop",
            address: shopData?.street_address || "No address available",
            phoneNumber: shopData?.phone_number || "No phone number available",
          });
        }
  
        setOrderDetails(fetchedOrderDetails);
      } catch (error) {
        console.error("Error fetching order and shop details:", error);
      }
    };
  
    fetchOrders();
  }, [user]);
  


  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  return (
        <View style={styles.container}>
            {/* Header with Back Button */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={30} color="black" />
                </TouchableOpacity>
                <Text style={styles.headerText}>Order History</Text>
            </View>

            {/* Order History List */}
            <FlatList
                data={orderDetails}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={styles.orderItem}>
                        <Text>Order Id: {item.id}</Text>
                        <Text>Status: {item.status}</Text>
                        <Text>Pickup Time: {item.pickupTime}</Text>
                        <Text>Shop Name: {item.shopName}</Text>
                        <Text>Address: {item.address}</Text>
                        <Text>Phone: {item.phoneNumber}</Text>
                        <Text>Total: ${item.totalAmount}</Text>
                    </View>
                )}
                style={styles.flatList}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1, // Take up full screen height
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        marginTop: 40,
    },
    backButton: {
        marginRight: 10,
    },
    headerText: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    flatList: {
        flex: 1, // This makes the FlatList take the remaining space
    },
    orderItem: {
        padding: 15,
        marginBottom: 10,
        borderWidth: 1,
        borderRadius: 8,
    },
});

export default OrderHistoryScreen;
