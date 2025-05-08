import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from "@expo/vector-icons";
import { supabase } from '../../utils/supabase';
import { Alert } from 'react-native';
import { Button } from 'react-native-paper'; // Assuming react-native-paper Button is available

// --- Interface Definitions ---

interface Order {
    id: string;
    status: string;
    pickup_time: string; // Use pickup_time to match DB column
    total: number;
    shop_id: string; // Keep shop_id for fetching items
    shopName?: string;
    shopStreetAddress?: string; // Added for full address
    shopCity?: string; // Added for full address
    shopState?: string; // Added for full address
    shopZip?: string; // Added for full address
    shopOwnerPhoneNumber?: string; // Renamed to be specific to shop owner's phone
    createdAt?: string;
}

// Interface for the nested shop data returned by the join (without nested users)
interface JoinedShopData {
    shop_name: string;
    street_address: string;
    city: string;
    state: string;
    zip: string;
    owner_id: string; // Now selecting shop_owner_id here
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

const OrderHistoryScreen = () => {
    const [orders, setOrders] = useState<Order[]>([]); // Renamed for clarity
    const [loading, setLoading] = useState(true);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedOrderItems, setSelectedOrderItems] = useState<OrderItem[]>([]);
    const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null); // To show order details in modal

    const router = useRouter();

    // --- Data Fetching ---

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                setLoading(true);
                const { data: { user }, error: authError } = await supabase.auth.getUser();

                if (authError || !user) {
                    console.error('Auth error:', authError);
                    Alert.alert("Authentication Error", "Please log in to view your order history.");
                    setLoading(false);
                    return;
                }

                // 1. Fetch orders and join with shops table to get shop details and shop_owner_id
                const { data: ordersData, error: ordersError } = await supabase
                    .from("orders")
                    .select(`
                        id,
                        status,
                        pickup_time,
                        total,
                        shop_id,
                        created_at,
                        shops (
                            shop_name,
                            street_address,
                            city,
                            state,
                            zip,
                            owner_id
                        )
                    `)
                    .eq("user_id", user.id)
                    .order('created_at', { ascending: false });

                if (ordersError) {
                    console.error("Error fetching orders:", ordersError.message);
                    Alert.alert("Error", "Failed to load order history.");
                    setLoading(false);
                    return;
                }

                if (!ordersData || ordersData.length === 0) {
                    console.log("No orders found for this user.");
                    setOrders([]);
                    setLoading(false);
                    return;
                }

                // 2. Process the fetched orders and fetch shop owner phone numbers separately
                const ordersWithPhonePromises = ordersData.map(async (order) => {
                    const shopDetails = order.shops as JoinedShopData | null; // Type assertion for the shop details

                    let shopOwnerPhone = "No phone number available";
                    const shopOwnerId = shopDetails?.owner_id;

                    // If shop_owner_id exists, fetch the user's phone number
                    if (shopOwnerId) {
                        const { data: userData, error: userError } = await supabase
                            .from("users")
                            .select("phone_number")
                            .eq("id", shopOwnerId)
                            .single();

                        if (userError) {
                            console.error(`Error fetching user phone for owner ${shopOwnerId}:`, userError);
                            // Keep default "No phone number available" or set a specific error message
                        } else if (userData?.phone_number) {
                            shopOwnerPhone = userData.phone_number;
                        }
                    }

                    // Construct the final Order object with the fetched phone number
                    return {
                        id: order.id,
                        status: order.status || 'pending',
                        pickup_time: order.pickup_time || 'Not specified',
                        total: order.total || 0,
                        shop_id: order.shop_id,
                        shopName: shopDetails?.shop_name || "Unknown Shop",
                        shopStreetAddress: shopDetails?.street_address || "No address available",
                        shopCity: shopDetails?.city || "",
                        shopState: shopDetails?.state || "",
                        shopZip: shopDetails?.zip || "",
                        shopOwnerPhoneNumber: shopOwnerPhone, // Add the fetched phone number
                        createdAt: order.created_at,
                    } as Order; // Type assertion for the final object
                });

                // Wait for all individual phone number fetches to complete
                const processedOrders = await Promise.all(ordersWithPhonePromises);

                setOrders(processedOrders); // Update the orders state
            } catch (error) {
                console.error("Error fetching orders:", error);
                Alert.alert("Error", "An unexpected error occurred while fetching order history.");
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, []); // Empty dependency array to fetch orders only once on mount

    // Function to fetch order items for a specific order ID
    const fetchOrderItemsForModal = async (orderId: string) => {
        // You might want to show a loading indicator in the modal here
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
            .eq('order_id', orderId);

        if (!orderItemsError && orderItemsData) {
            const processedItems = orderItemsData.map(item => {
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
            setSelectedOrderItems(processedItems);
        } else {
            console.error('Error fetching order items for modal:', orderItemsError);
            setSelectedOrderItems([]); // Clear items on error
            Alert.alert("Error", "Failed to load order items.");
        }
    };

    // --- Handlers ---

    const handleOrderPress = (order: Order) => {
        setSelectedOrderDetails(order); // Set the order details for the modal header
        fetchOrderItemsForModal(order.id); // Fetch the items for the selected order
        setIsModalVisible(true); // Open the modal
    };

    const closeModal = () => {
        setIsModalVisible(false);
        setSelectedOrderItems([]); // Clear items when closing modal
        setSelectedOrderDetails(null); // Clear selected order details
    };

    // --- Formatting and Styling ---

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'Unknown date';
        const date = new Date(dateString);
        // Format date and time
        const datePart = date.toLocaleDateString();
        const timePart = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return `${datePart} ${timePart}`;
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'completed': return '#4CAF50'; // Green
            case 'preparing': return '#FFC107'; // Amber
            case 'accepted': return '#2196F3'; // Blue
            case 'pending': return '#FF9800'; // Orange
            case 'cancelled': return '#F44336'; // Red
            default: return '#757575'; // Gray
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6F4E37" />
                <Text style={styles.loadingText}>Loading order history...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton} accessibilityLabel="Go back">
                    <Ionicons name="arrow-back" size={24} color="#6F4E37" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Order History</Text>
                <View style={styles.headerSpacer} />
            </View>

            {orders.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="receipt-outline" size={64} color="#6F4E37" />
                    <Text style={styles.emptyText}>No orders found</Text>
                    <Text style={styles.emptySubtext}>Your order history will appear here after you place an order.</Text>
                </View>
            ) : (
                <FlatList
                    data={orders}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <TouchableOpacity onPress={() => handleOrderPress(item)} style={styles.orderItem}>
                             <View style={styles.orderHeader}>
                                <View>
                                    <Text style={styles.shopName}>{item.shopName}</Text>
                                    <Text style={styles.orderDate}>{formatDate(item.createdAt)}</Text>
                                </View>
                                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                                    <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
                                </View>
                            </View>

                            <View style={styles.divider} />

                            <View style={styles.orderDetails}>
                                <View style={styles.detailRow}>
                                    <Ionicons name="time-outline" size={18} color="#6F4E37" />
                                    <Text style={styles.detailText}>Pickup: {item.pickup_time}</Text>
                                </View>

                                <View style={styles.detailRow}>
                                    <Ionicons name="location-outline" size={18} color="#6F4E37" />
                                    <Text style={styles.detailText}>
                                        {`${item.shopStreetAddress}, ${item.shopCity}, ${item.shopState} ${item.shopZip}`}
                                    </Text>
                                </View>

                                <View style={styles.detailRow}>
                                    <Ionicons name="call-outline" size={18} color="#6F4E37" />
                                    <Text style={styles.detailText}>{item.shopOwnerPhoneNumber}</Text>
                                </View>
                            </View>

                            <View style={styles.orderFooter}>
                                <Text style={styles.totalAmount}>Total: ${parseFloat(item.total.toString()).toFixed(2)}</Text>
                            </View>
                        </TouchableOpacity>
                    )}
                    contentContainerStyle={styles.listContent}
                />
            )}

            <Modal
                animationType="slide"
                transparent={true}
                visible={isModalVisible}
                onRequestClose={closeModal}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Order Details</Text>
                            <TouchableOpacity onPress={closeModal} accessibilityLabel="Close modal">
                                <Ionicons name="close" size={24} color="#333333" />
                            </TouchableOpacity>
                        </View>

                        {selectedOrderDetails && (
                           <View style={styles.modalOrderSummary}>
                                <Text style={styles.modalShopName}>{selectedOrderDetails.shopName}</Text>
                                <Text style={styles.modalPickupTime}>Pickup: {selectedOrderDetails.pickup_time}</Text>
                                <Text style={styles.modalTotal}>Total: ${parseFloat(selectedOrderDetails.total.toString()).toFixed(2)}</Text>
                           </View>
                        )}


                        <Text style={styles.modalItemsTitle}>Items:</Text>
                        <FlatList
                            data={selectedOrderItems}
                            keyExtractor={(item) => item.id}
                            renderItem={({ item }) => (
                                <View style={styles.modalOrderItemRow}>
                                    <Text style={styles.modalOrderItemQuantity}>{item.quantity}x</Text>
                                    <View style={styles.modalOrderItemInfo}>
                                        <Text style={styles.modalOrderItemName}>{item.name}</Text>
                                        {item.description ? <Text style={styles.modalOrderItemDescription}>{item.description}</Text> : null}
                                    </View>
                                    <Text style={styles.modalOrderItemPrice}>${(item.price * item.quantity).toFixed(2)}</Text>
                                </View>
                            )}
                            contentContainerStyle={styles.modalItemsList}
                        />

                        <Button mode="contained" onPress={closeModal} style={styles.modalCloseButton}>
                            Close
                        </Button>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F8F8',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8F8F8',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#6F4E37',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 50,
        paddingBottom: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#EEEEEE',
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333333',
        flex: 1,
        textAlign: 'center',
        marginHorizontal: 8,
    },
    headerSpacer: {
        width: 40,
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 16,
        paddingTop: 16,
    },
    orderItem: {
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        marginBottom: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
        elevation: 2,
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    shopName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333333',
    },
    orderDate: {
        fontSize: 12,
        color: '#555555',
        marginTop: 4,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 14,
    },
    statusText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 10,
        textTransform: 'uppercase',
    },
    divider: {
        height: 1,
        backgroundColor: '#EEEEEE',
        marginVertical: 12,
    },
    orderDetails: {
        marginBottom: 12,
        gap: 8,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    detailText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#333333',
        flexShrink: 1,
    },
    orderFooter: {
        alignItems: 'flex-end',
        marginTop: 8,
    },
    totalAmount: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#6F4E37',
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
        color: '#333333',
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#555555',
        marginTop: 8,
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 20,
        width: '90%',
        maxHeight: '80%', 
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#EEEEEE',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333333',
    },
    modalOrderSummary: {
        marginBottom: 15,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#EEEEEE',
    },
     modalShopName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#6F4E37',
        marginBottom: 5,
     },
     modalPickupTime: {
        fontSize: 14,
        color: '#555555',
        marginBottom: 5,
     },
     modalTotal: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333333',
     },
    modalItemsTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333333',
        marginBottom: 10,
    },
    modalItemsList: {
        flexGrow: 1,
    },
    modalOrderItemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    modalOrderItemQuantity: {
        fontSize: 14,
        color: '#666666',
        marginRight: 10,
    },
    modalOrderItemInfo: {
        flex: 1,
        marginRight: 10,
    },
    modalOrderItemName: {
        fontSize: 14,
        color: '#333333',
    },
    modalOrderItemDescription: {
        fontSize: 12,
        color: '#888888',
        marginTop: 2,
    },
    modalOrderItemPrice: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333333',
    },
    modalCloseButton: {
        marginTop: 20,
        backgroundColor: '#6F4E37',
    },
});

export default OrderHistoryScreen;
