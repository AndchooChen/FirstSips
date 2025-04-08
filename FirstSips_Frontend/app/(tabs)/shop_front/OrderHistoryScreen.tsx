import React, { useEffect, useState } from 'react';
import {
    View, Text, FlatList, ActivityIndicator,
    TouchableOpacity, StyleSheet, ScrollView
} from 'react-native';
import { FIREBASE_DB, FIREBASE_AUTH } from '../../auth/FirebaseConfig';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { useRouter } from 'expo-router';
import { Ionicons } from "@expo/vector-icons";

interface Order {
    id: string;
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

            <FlatList
                data={orderDetails}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
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
            />
        </View>
    );
};

const styles = StyleSheet.create({
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
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
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
});

export default OrderHistoryScreen;
