import { View, StyleSheet, FlatList, ActivityIndicator, ScrollView } from 'react-native';
import { Text, Card, Button, Portal, Dialog, RadioButton } from 'react-native-paper';
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../utils/supabase';
import { Order, OrderStatus } from '../types/order';

const OrderQueue = ({ shopId }: { shopId: string }) => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [showStatusDialog, setShowStatusDialog] = useState(false);
    const [newStatus, setNewStatus] = useState<OrderStatus>('pending');
    const [showDetailsDialog, setShowDetailsDialog] = useState(false);

    const handleViewDetails = (order: Order) => {
        setSelectedOrder(order);
        setShowDetailsDialog(true);
    };

    const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
        try {
            const { data: orderData, error: fetchError } = await supabase
                .from("orders")
                .select("*")
                .eq("id", orderId)
                .single();
      
            if (fetchError || !orderData) {
                console.error("Order not found in Supabase.");
                alert("Error: Order does not exist.");
                return;
            }
      
            if (!orderData.shop_id) {
                console.error("Order is missing shop_id.");
                alert("Error: Order is missing shop_id.");
                return;
            }
      
            if (orderData.shop_id !== shopId) {
                console.error("Mismatch: Order's shopId does not match the user's shopId.");
                alert("Error: You do not have permission to update this order.");
                return;
            }
      
            const { error: updateError } = await supabase
                .from("orders")
                .update({
                    status: newStatus,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", orderId);
      
            if (updateError) {
                throw updateError;
            }
      
            console.log("Order status successfully updated to:", newStatus);
        } catch (error) {
            console.error("Error updating order:", error);
            alert("Error: Failed to update order status.");
        }
    };
      

    const handleStatusUpdate = async () => {
        if (!selectedOrder) return;
        await updateOrderStatus(selectedOrder.orderId, newStatus);
        setShowStatusDialog(false);
        setSelectedOrder(null);
    };

    const renderStatusDialog = () => (
        <Portal>
            <Dialog visible={showStatusDialog} onDismiss={() => setShowStatusDialog(false)}>
                <Dialog.Title>Update Order Status</Dialog.Title>
                <Dialog.Content>
                    <RadioButton.Group onValueChange={value => setNewStatus(value as OrderStatus)} value={newStatus}>
                        <RadioButton.Item label="Pending" value="pending" />
                        <RadioButton.Item label="Accepted" value="accepted" />
                        <RadioButton.Item label="Preparing" value="preparing" />
                        <RadioButton.Item label="Ready" value="ready" />
                        <RadioButton.Item label="Completed" value="completed" />
                        <RadioButton.Item label="Cancelled" value="cancelled" />
                    </RadioButton.Group>
                </Dialog.Content>
                <Dialog.Actions>
                    <Button onPress={() => setShowStatusDialog(false)}>Cancel</Button>
                    <Button onPress={handleStatusUpdate}>Update</Button>
                </Dialog.Actions>
            </Dialog>
        </Portal>
    );

    const renderDetailsDialog = () => (
        <Portal>
            <Dialog visible={showDetailsDialog} onDismiss={() => setShowDetailsDialog(false)}>
                <Dialog.Title>Order Details</Dialog.Title>
                <Dialog.Content>
                    <Text variant="titleMedium">Order #{selectedOrder?.orderId.slice(-6)}</Text>
                    <Text variant="bodyMedium">Customer: {selectedOrder?.customerName}</Text>
                    <Text variant="bodyMedium">Phone: {selectedOrder?.customerPhone}</Text>
                    <Text variant="bodyMedium">Pickup: {selectedOrder?.pickupTime}</Text>
                    
                    <Text variant="titleMedium" style={{ marginTop: 16 }}>Items:</Text>
                    {selectedOrder?.items.map((item, index) => (
                        <View key={index} style={{ marginLeft: 8, marginTop: 4 }}>
                            <Text>{item.quantity}x {item.name}</Text>
                            <Text style={{ color: '#666' }}>{item.specialInstructions}</Text>
                        </View>
                    ))}

                    <Text variant="titleMedium" style={{ marginTop: 16 }}>Total: ${selectedOrder?.totalAmount.toFixed(2)}</Text>
                </Dialog.Content>
                <Dialog.Actions>
                    <Button onPress={() => setShowDetailsDialog(false)}>Close</Button>
                    <Button 
                        onPress={() => {
                            setShowDetailsDialog(false);
                            setShowStatusDialog(true);
                        }}
                    >
                        Update Status
                    </Button>
                </Dialog.Actions>
            </Dialog>
        </Portal>
    );

    const renderOrderCard = ({ item: order }: { item: Order }) => (
        <Card style={styles.card}>
            <Card.Content>
                <Text variant="titleMedium">Order #{order.orderId.slice(-6)}</Text>
                <Text variant="bodyMedium">Customer: {order.customerName}</Text>
                <Text variant="bodyMedium" style={getStatusStyle(order.status)}>
                    Status: {order.status}
                </Text>
                <Text variant="bodyMedium">
                    Pickup: {order.pickupTime}
                </Text>
            </Card.Content>
            <Card.Actions>
                <Button onPress={() => handleViewDetails(order)}>
                    View Details
                </Button>
                <Button 
                    onPress={() => {
                        setSelectedOrder(order);
                        setNewStatus(order.status);
                        setShowStatusDialog(true);
                    }}
                >
                    Update Status
                </Button>
            </Card.Actions>
        </Card>
    );

    const groupedOrders = useMemo(() => {
        return orders.reduce((acc, order) => {
            if (!acc[order.status]) {
                acc[order.status] = [];
            }
            acc[order.status].push(order);
            return acc;
        }, {} as Record<OrderStatus, Order[]>);
    }, [orders]);

    useEffect(() => {
        let intervalId: any;
    
        const fetchOrders = async () => {
          const { data, error } = await supabase
            .from("orders")
            // --- MODIFIED SELECT STATEMENT ---
            .select("*, order_items(*)")
            // ---------------------------------
            .eq("shop_id", shopId)
            .in("status", ["pending", "accepted", "preparing", "completed"])
            .order("created_at", { ascending: true });
    
          if (!error && data) {
            const formattedOrders = data.map((order) => ({
              ...order,
              orderId: order.id, // Assuming orderId property matches Supabase 'id' column
              createdAt: new Date(order.created_at),
              pickupTime: order.pickup_time,
              // --- MAP order_items TO items ---
              // Supabase fetches related data into a property named after the foreign table
              items: order.order_items || [], // Ensure it's an array, even if no items
              // Make sure other properties expected by your Order type are present/mapped
              // e.g., customerName, customerPhone, totalAmount - assuming these are on the 'orders' table
              customerName: order.customer_name, // Adjust column names if needed
              customerPhone: order.customer_phone,
              totalAmount: order.total, // Adjust column names if needed
            })) as Order[];
    
            setOrders(formattedOrders);
            setLoading(false);
          } else if (error) {
            console.error("Error fetching orders:", error);
            // Handle error, maybe show a message
            setLoading(false); // Stop loading even on error
          }
        };
    
        fetchOrders();
        intervalId = setInterval(fetchOrders, 10000); // Poll every 10 seconds
    
        return () => clearInterval(intervalId); // Cleanup on unmount
    }, [shopId]); // Dependency array includes shopId
      

    // Add to existing styles
    const getStatusStyle = (status: OrderStatus) => ({
        color: {
            pending: '#FFA500',
            accepted: '#4169E1',
            preparing: '#9370DB',
            ready: '#32CD32',
            completed: '#2E8B57',
            cancelled: '#DC143C'
        }[status]
    });

    return (
        <View style={styles.container}>
            {renderStatusDialog()}
            {renderDetailsDialog()}
            <Text variant="headlineMedium" style={styles.title}>
                Active Orders
            </Text>
            
            {loading ? (
                <ActivityIndicator size="large" color="#6F4E37" />
            ) : (
                <ScrollView>
                    {['pending', 'accepted', 'preparing', 'completed'].map((status) => (
                        <View key={status} style={styles.section}>
                            <Text variant="titleMedium" style={styles.sectionTitle}>
                                {status.toUpperCase()} ({groupedOrders[status]?.length || 0})
                            </Text>
                            <FlatList
                                data={groupedOrders[status] || []}
                                renderItem={renderOrderCard}
                                keyExtractor={(order) => order.orderId}
                                contentContainerStyle={styles.list}
                                scrollEnabled={false}
                            />
                        </View>
                    ))}
                </ScrollView>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#FFFFFF',
    },
    title: {
        marginBottom: 16,
        color: '#6F4E37',
    },
    card: {
        marginBottom: 16,
        backgroundColor: '#FFFFFF',
    },
    list: {
        padding: 8,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        color: '#6F4E37',
        fontWeight: 'bold',
        marginBottom: 8,
        paddingHorizontal: 8,
    }
});

export default OrderQueue;