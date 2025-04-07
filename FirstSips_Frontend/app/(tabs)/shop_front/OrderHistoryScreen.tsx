import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, RefreshControl } from "react-native";
import { orderService } from "../../services/orderService";
import { shopService } from "../../services/shopService";
import { useAuth } from "../../auth/AuthContext";
import { Order } from "../../types/order";
import { Shop } from "../../types/shop";

interface OrderWithShop extends Order {
    shop?: Shop;
}

const OrderHistoryScreen = () => {
    const [orders, setOrders] = useState<OrderWithShop[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const { user } = useAuth();

    const fetchOrders = async () => {
        try {
            const fetchedOrders = await orderService.getUserOrders();
            
            // Fetch shop details for each order
            const ordersWithShops = await Promise.all(
                fetchedOrders.map(async (order) => {
                    const shop = await shopService.getShop(order.shopId);
                    return { ...order, shop };
                })
            );

            setOrders(ordersWithShops);
        } catch (error) {
            console.error("Error fetching orders:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchOrders();
        }
    }, [user]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchOrders();
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <Text>Loading orders...</Text>
            </View>
        );
    }

    if (orders.length === 0) {
        return (
            <View style={styles.container}>
                <Text>No orders found</Text>
            </View>
        );
    }

    const renderOrderItem = ({ item }: { item: OrderWithShop }) => (
        <View style={styles.orderCard}>
            <Text style={styles.shopName}>{item.shop?.shopName || 'Unknown Shop'}</Text>
            <Text style={styles.orderStatus}>Status: {item.status}</Text>
            <Text style={styles.orderTotal}>Total: ${item.totalAmount.toFixed(2)}</Text>
            <Text style={styles.pickupTime}>Pickup Time: {new Date(item.pickupTime).toLocaleString()}</Text>
            <View style={styles.itemsList}>
                {item.items.map((orderItem, index) => (
                    <Text key={index} style={styles.itemText}>
                        {orderItem.quantity}x {orderItem.name} - ${(orderItem.price * orderItem.quantity).toFixed(2)}
                    </Text>
                ))}
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <FlatList
                data={orders}
                renderItem={renderOrderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContainer}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                    />
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FEFAE0',
        padding: 16,
    },
    listContainer: {
        paddingBottom: 16,
    },
    orderCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    shopName: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#6F4E37',
    },
    orderStatus: {
        fontSize: 16,
        color: '#666',
        marginBottom: 4,
    },
    orderTotal: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    pickupTime: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    itemsList: {
        marginTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        paddingTop: 8,
    },
    itemText: {
        fontSize: 14,
        color: '#333',
        marginBottom: 4,
    },
});

export default OrderHistoryScreen;
