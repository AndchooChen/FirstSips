import { View, StyleSheet } from 'react-native';
import { Card, Text, Button, Chip } from 'react-native-paper';
import { Order, OrderStatus } from '../types/order';

interface OrderCardProps {
    order: Order;
    onStatusUpdate: (orderId: string, status: OrderStatus) => void;
}

const OrderCard = ({ order, onStatusUpdate }: OrderCardProps) => {
    const nextStatus = {
        pending: 'accepted',
        accepted: 'preparing',
        preparing: 'ready',
        ready: 'completed'
    } as const;

    const getStatusColor = (status: OrderStatus) => {
        const colors = {
            pending: '#FFA500',    // Orange
            accepted: '#4169E1',   // Royal Blue
            preparing: '#9370DB',  // Medium Purple
            ready: '#32CD32',     // Lime Green
            completed: '#2E8B57',  // Sea Green
            cancelled: '#DC143C'   // Crimson
        };
        return colors[status] || '#666666';
    };

    return (
        <Card style={styles.card}>
            <Card.Content>
                <View style={styles.header}>
                    <Text variant="titleMedium">Order #{order.orderId.slice(-6)}</Text>
                    <Chip 
                        mode="outlined" 
                        style={[styles.statusChip, { borderColor: getStatusColor(order.status) }]}
                        textStyle={{ color: getStatusColor(order.status) }}
                    >
                        {order.status.toUpperCase()}
                    </Chip>
                </View>

                <View style={styles.customerInfo}>
                    <Text variant="bodyMedium">Customer: {order.customerName}</Text>
                    <Text variant="bodyMedium">Phone: {order.customerPhone}</Text>
                    <Text variant="bodyMedium" style={styles.pickupTime}>
                        Pickup: {order.pickupTime.toLocaleTimeString()}
                    </Text>
                </View>

                <View style={styles.itemsContainer}>
                    {order.items.map((item, index) => (
                        <View key={index} style={styles.itemRow}>
                            <Text style={styles.quantity}>{item.quantity}x</Text>
                            <Text style={styles.itemName}>{item.name}</Text>
                            <Text style={styles.itemPrice}>
                                ${(item.price * item.quantity / 100).toFixed(2)}
                            </Text>
                        </View>
                    ))}
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Total:</Text>
                        <Text style={styles.totalAmount}>
                            ${(order.totalAmount / 100).toFixed(2)}
                        </Text>
                    </View>
                </View>
            </Card.Content>

            <Card.Actions>
                {nextStatus[order.status] && (
                    <Button 
                        mode="contained"
                        onPress={() => onStatusUpdate(order.orderId, nextStatus[order.status])}
                        style={[styles.actionButton, { backgroundColor: getStatusColor(nextStatus[order.status]) }]}
                    >
                        Mark as {nextStatus[order.status]}
                    </Button>
                )}
            </Card.Actions>
        </Card>
    );
};

const styles = StyleSheet.create({
    card: {
        marginVertical: 8,
        marginHorizontal: 16,
        elevation: 4,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    statusChip: {
        height: 28,
    },
    customerInfo: {
        marginBottom: 16,
    },
    pickupTime: {
        fontWeight: '500',
        marginTop: 4,
    },
    itemsContainer: {
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
        paddingTop: 12,
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    quantity: {
        width: 40,
        color: '#666666',
    },
    itemName: {
        flex: 1,
    },
    itemPrice: {
        width: 80,
        textAlign: 'right',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
        marginTop: 8,
        paddingTop: 8,
    },
    totalLabel: {
        fontWeight: 'bold',
    },
    totalAmount: {
        fontWeight: 'bold',
    },
    actionButton: {
        marginLeft: 'auto',
    },
});

export default OrderCard;