import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Button } from 'react-native-paper';
import { orderService } from '../services/orderService';
import { Order } from '../types/order';

const OrderQueue = ({ shopId }: { shopId: string }) => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchOrders = async () => {
        try {
            const fetchedOrders = await orderService.getShopOrders(shopId);
            setOrders(fetchedOrders);
        } catch (error) {
            console.error("Error fetching orders:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
        try {
            await orderService.updateOrderStatus(orderId, newStatus);
            // Refresh orders after updating status
            fetchOrders();
        } catch (error) {
            console.error("Error updating order status:", error);
            alert("Error: Failed to update order status.");
        }
    };

    useEffect(() => {
        fetchOrders();
    }, [shopId]);

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

    const renderOrderCard = (order: Order) => (
        <View key={order.id} style={styles.orderCard}>
            <View style={styles.orderHeader}>
                <Text style={styles.orderId}>Order #{order.id.slice(-6)}</Text>
                <Text style={styles.orderStatus}>{order.status}</Text>
            </View>
            
            <View style={styles.orderDetails}>
                <Text style={styles.pickupTime}>
                    Pickup: {new Date(order.pickupTime).toLocaleString()}
                </Text>
                <Text style={styles.total}>
                    Total: ${order.totalAmount.toFixed(2)}
                </Text>
            </View>

            <View style={styles.itemsList}>
                {order.items.map((item, index) => (
                    <Text key={index} style={styles.itemText}>
                        {item.quantity}x {item.name}
                        {item.options?.size && ` (${item.options.size})`}
                        {item.options?.extras && item.options.extras.length > 0 && 
                            ` + ${item.options.extras.join(', ')}`}
                        {item.notes && ` - Note: ${item.notes}`}
                    </Text>
                ))}
            </View>

            <View style={styles.actionButtons}>
                {order.status === 'pending' && (
                    <Button 
                        mode="contained" 
                        onPress={() => updateOrderStatus(order.id, 'accepted')}
                        style={[styles.button, { backgroundColor: '#4CAF50' }]}
                    >
                        Accept
                    </Button>
                )}
                {order.status === 'accepted' && (
                    <Button 
                        mode="contained" 
                        onPress={() => updateOrderStatus(order.id, 'preparing')}
                        style={[styles.button, { backgroundColor: '#2196F3' }]}
                    >
                        Start Preparing
                    </Button>
                )}
                {order.status === 'preparing' && (
                    <Button 
                        mode="contained" 
                        onPress={() => updateOrderStatus(order.id, 'ready')}
                        style={[styles.button, { backgroundColor: '#FFC107' }]}
                    >
                        Mark Ready
                    </Button>
                )}
                {order.status === 'ready' && (
                    <Button 
                        mode="contained" 
                        onPress={() => updateOrderStatus(order.id, 'completed')}
                        style={[styles.button, { backgroundColor: '#9C27B0' }]}
                    >
                        Complete Order
                    </Button>
                )}
                {['pending', 'accepted', 'preparing'].includes(order.status) && (
                    <Button 
                        mode="contained" 
                        onPress={() => updateOrderStatus(order.id, 'cancelled')}
                        style={[styles.button, { backgroundColor: '#F44336' }]}
                    >
                        Cancel
                    </Button>
                )}
            </View>
        </View>
    );

    return (
        <ScrollView 
            style={styles.container}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                />
            }
        >
            {orders.length === 0 ? (
                <Text style={styles.noOrders}>No active orders</Text>
            ) : (
                orders.map(order => renderOrderCard(order))
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FEFAE0',
        padding: 16,
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
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    orderId: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#6F4E37',
    },
    orderStatus: {
        fontSize: 16,
        color: '#666',
    },
    orderDetails: {
        marginBottom: 12,
    },
    pickupTime: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    total: {
        fontSize: 16,
        fontWeight: '600',
    },
    itemsList: {
        borderTopWidth: 1,
        borderTopColor: '#eee',
        paddingTop: 12,
        marginBottom: 12,
    },
    itemText: {
        fontSize: 14,
        color: '#333',
        marginBottom: 4,
    },
    actionButtons: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    button: {
        flex: 1,
        minWidth: '45%',
    },
    noOrders: {
        textAlign: 'center',
        fontSize: 16,
        color: '#666',
        marginTop: 24,
    },
});

export default OrderQueue;