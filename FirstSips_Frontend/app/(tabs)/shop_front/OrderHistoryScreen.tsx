import React, { useEffect, useState } from 'react';
<<<<<<< HEAD
import {
    View, Text, FlatList, ActivityIndicator,
    TouchableOpacity, StyleSheet, ScrollView
} from 'react-native';
=======
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native';
>>>>>>> 68fb1e5fa391f1bdac2f665bb27bc781ec148f7d
import { FIREBASE_DB, FIREBASE_AUTH } from '../../auth/FirebaseConfig';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { useRouter } from 'expo-router';
import { Ionicons } from "@expo/vector-icons";

interface Order {
    id: string;
<<<<<<< HEAD
    status: string;
    pickupTime: string;
    totalAmount: number;
    shopId: string;
    shopName?: string;
    address?: string;
    phoneNumber?: string;
}

const OrderHistoryScreen = () => {
    const [orderDetails, setOrderDetails] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const user = FIREBASE_AUTH.currentUser;
    const router = useRouter();

    useEffect(() => {
        const fetchOrderData = async () => {
            if (!user) return;

            try {
                const userOrdersRef = collection(FIREBASE_DB, `users/${user.uid}/orders`);
                const orderDocs = await getDocs(userOrdersRef);
                const orderIds = orderDocs.docs.map(doc => doc.id);

                const detailedOrders: Order[] = [];

                for (const orderId of orderIds) {
                    const orderSnap = await getDoc(doc(FIREBASE_DB, 'orders', orderId));
                    if (!orderSnap.exists()) continue;

                    const { status, pickupTime, totalAmount, shopId } = orderSnap.data();
                    const shopSnap = await getDoc(doc(FIREBASE_DB, 'shops', shopId));

                    detailedOrders.push({
                        id: orderId,
                        status,
                        pickupTime,
                        totalAmount,
                        shopId,
                        shopName: shopSnap.exists() ? shopSnap.data().shopName : 'Unknown',
                        address: shopSnap.exists() ? shopSnap.data().streetAddress : 'N/A',
                        phoneNumber: shopSnap.exists() ? shopSnap.data().phoneNumber : 'N/A',
                    });
                }

                setOrderDetails(detailedOrders);
            } catch (error) {
                console.error("Error fetching orders:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchOrderData();
    }, [user]);

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#6F4E37" />
            </View>
        );
    }

    return (
        <View style={styles.background}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={28} color="#6F4E37" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Order History</Text>
            </View>

=======
    status: string;       // Order status
    pickupTime: string;   // Pickup time (could be a string or Date depending on your data structure)
    totalAmount: number;  // Total amount for the order
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
  const user = FIREBASE_AUTH.currentUser;
  const router = useRouter();

  useEffect(() => {
    const fetchOrderIds = async () => {
        if (!user) {
            console.log("No user found, exiting fetchOrders.");
            return;
        }
    
        try {
            console.log("Fetching orders for user:", user.uid);
    
            const ordersRef = collection(FIREBASE_DB, `users/${user.uid}/orders`);
            console.log("Orders collection reference:", ordersRef.path);
    
            console.log("Before order snapshots");
            const orderSnapshots = await getDocs(ordersRef);
            console.log("Fetched order snapshots:", orderSnapshots);
    
            const fetchedOrders: Order[] = [];
    
            if (orderSnapshots.empty) {
                console.log("No orders found for this user.");
            }
    
            // Extract order IDs
            for (const orderDoc of orderSnapshots.docs) {
                console.log("Processing order document:", orderDoc.id);
                
                // For now, we only push the ID into the fetchedOrders array.
                fetchedOrders.push({ id: orderDoc.id } as Order);
            }
    
            console.log("Final fetched orders:", fetchedOrders);
            setOrders(fetchedOrders);
    
            // Now that we have the orders, pass them to fetchShopDetails.
            fetchOrderDetails(fetchedOrders);
        } catch (error) {
            console.error("Error fetching orders:", error);
        } finally {
            setLoading(false);
            console.log("Order fetching completed.");
        }
    };

    const fetchOrderDetails = async (orders: Order[]) => {
        const ordersRef = collection(FIREBASE_DB, 'orders');
        const shopRef = collection(FIREBASE_DB, 'shops');  // Reference to the shops collection
        const orderIds = orders.map(order => order.id);
        
        try {
            const fetchedOrderDetails: any[] = [];
    
            // Loop through the orderIds and fetch details for each order ID
            for (const orderId of orderIds) {
                const orderQuery = query(ordersRef, where('__name__', '==', orderId));
    
                const orderSnapshot = await getDocs(orderQuery);
    
                if (!orderSnapshot.empty) {
                    orderSnapshot.forEach(async (orderDoc) => {
                        const orderData = orderDoc.data();
                        const { status, pickupTime, totalAmount, shopId } = orderData;
                        console.log(shopId);
    
                        // Now, fetch shop details using the shopId
                        const shopDoc = await getDoc(doc(shopRef, shopId));
    
                        if (shopDoc.exists()) {
                            const shopData = shopDoc.data();
                            console.log(shopData);
                            // Combine order and shop details
                            fetchedOrderDetails.push({
                                id: orderId,
                                status,
                                pickupTime,
                                totalAmount,
                                shopId,
                                shopName: shopData?.shopName || 'Loading...',
                                address: shopData?.streetAddress || 'Loading...',
                                phoneNumber: shopData?.phoneNumber || 'Loading...',
                            });
    
                            // Optionally log the details
                            console.log(`Order ID: ${orderId}`);
                            console.log(`Status: ${status}`);
                            console.log(`Pickup Time: ${pickupTime}`);
                            console.log(`Total: $${totalAmount.toFixed(2)}`);
                            console.log(`Shop Name: ${shopData?.name || 'Loading...'}`);
                            console.log(`Address: ${shopData?.address || 'Loading...'}`);
                            console.log(`Phone: ${shopData?.phoneNumber || 'Loading...'}`);
                        } else {
                            console.log(`No shop found with ID: ${shopId}`);
                        }
                    });
                } else {
                    console.log(`No order found with ID: ${orderId}`);
                }
            }
    
            // Update the state with the combined order and shop details
            setOrderDetails(fetchedOrderDetails);
    
        } catch (error) {
            console.error("Error fetching order and shop details:", error);
        }
    };
    

    fetchOrderIds();
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
>>>>>>> 68fb1e5fa391f1bdac2f665bb27bc781ec148f7d
            <FlatList
                data={orderDetails}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
<<<<<<< HEAD
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Order #{item.id.slice(0, 6)}...</Text>
                        <Text>Status: <Text style={styles.infoText}>{item.status}</Text></Text>
                        <Text>Pickup Time: <Text style={styles.infoText}>{item.pickupTime}</Text></Text>
                        <Text>Shop: <Text style={styles.infoText}>{item.shopName}</Text></Text>
                        <Text>Address: <Text style={styles.infoText}>{item.address}</Text></Text>
                        <Text>Phone: <Text style={styles.infoText}>{item.phoneNumber}</Text></Text>
                        <Text>Total: <Text style={styles.infoText}>${item.totalAmount}</Text></Text>
                    </View>
                )}
                contentContainerStyle={{ paddingBottom: 40 }}
=======
                    <View style={styles.orderItem}>
                        <Text>Order Id: {item.id}</Text>
                        <Text>Status: {item.status}</Text>
                        <Text>Pickup Time: {item.pickupTime}</Text>
                        <Text>Shop Name: {item.shopName}</Text>
                        <Text>Address: {item.address}</Text>
                        {/* Add Phone Number Later */}
                        <Text>Phone: {item.phoneNumber}</Text>
                        <Text>Total: ${item.totalAmount}</Text>
                    </View>
                )}
                style={styles.flatList}
>>>>>>> 68fb1e5fa391f1bdac2f665bb27bc781ec148f7d
            />
        </View>
    );
};

const styles = StyleSheet.create({
<<<<<<< HEAD
    background: {
        flex: 1,
        backgroundColor: "#F5EDD8",
        paddingHorizontal: 16,
    },
    centered: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#F5EDD8",
=======
    container: {
        flex: 1, // Take up full screen height
        padding: 20,
>>>>>>> 68fb1e5fa391f1bdac2f665bb27bc781ec148f7d
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
<<<<<<< HEAD
        marginTop: 60,
        marginBottom: 20,
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#6F4E37',
        marginLeft: 12,
    },
    card: {
        backgroundColor: "#FFF",
        padding: 16,
        borderRadius: 16,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        elevation: 3,
    },
    cardTitle: {
        fontWeight: "600",
        fontSize: 16,
        marginBottom: 8,
        color: "#6F4E37",
    },
    infoText: {
        fontWeight: "500",
        color: "#333",
    }
=======
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
>>>>>>> 68fb1e5fa391f1bdac2f665bb27bc781ec148f7d
});

export default OrderHistoryScreen;
