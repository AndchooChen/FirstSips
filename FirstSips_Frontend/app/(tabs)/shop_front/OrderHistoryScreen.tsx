import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, StyleSheet, SafeAreaView, RefreshControl } from 'react-native';
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
    const [refreshing, setRefreshing] = useState(false); // For pull-to-refresh
    const router = useRouter();

    const fetchOrders = useCallback(async () => {
        try {
            // Get current user
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            if (authError || !user) { throw authError || new Error('User not authenticated'); }

            // Fetch all orders for this user
            const { data: ordersData, error: ordersError } = await supabase
                .from("orders")
                .select("*, shops(shop_name, street_address, phone_number)") // Join with shops table
                .eq("user_id", user.id)
                .order('created_at', { ascending: false });

            if (ordersError) throw ordersError;

            if (!ordersData || ordersData.length === 0) {
                setOrderDetails([]);
                return; // Exit early if no orders
            }

            // Process fetched data
            const fetchedOrderDetails: Order[] = ordersData.map(order => {
                const shopInfo = order.shops as any; // Type assertion for joined data
                return {
                    id: order.id,
                    status: order.status || 'pending',
                    pickupTime: order.pickup_time || 'Not specified',
                    totalAmount: order.total_amount || order.total || 0,
                    shopName: shopInfo?.shop_name || "Unknown Shop",
                    address: shopInfo?.street_address || "No address available",
                    phoneNumber: shopInfo?.phone_number || "No phone number available",
                    createdAt: order.created_at,
                };
            });

            setOrderDetails(fetchedOrderDetails);
        } catch (error: any) {
            console.error("Error fetching orders:", error.message);
            Alert.alert("Error", "Could not fetch order history."); // Show user feedback
        }
    }, []); // No dependencies, fetch is self-contained

    // Initial fetch
    useEffect(() => {
        setLoading(true);
        fetchOrders().finally(() => setLoading(false));
    }, [fetchOrders]);

    // Pull to refresh handler
    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchOrders();
        setRefreshing(false);
    }, [fetchOrders]);

    // Loading state
    if (loading && !refreshing) { // Don't show full screen loading during refresh
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#6F4E37" />
                </View>
            </SafeAreaView>
        );
    }

    // Helper Functions
    const formatDate = (dateString?: string) => {
        if (!dateString) return 'Unknown date';
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const getStatusStyle = (status: string): { backgroundColor: string; color: string } => {
        switch (status.toLowerCase()) {
            case 'completed': return { backgroundColor: '#E8F5E9', color: '#388E3C' }; // Light Green BG, Dark Green Text
            case 'preparing': return { backgroundColor: '#FFF8E1', color: '#FFA000' }; // Light Yellow BG, Orange Text
            case 'accepted': return { backgroundColor: '#E3F2FD', color: '#1976D2' }; // Light Blue BG, Blue Text
            case 'pending': return { backgroundColor: '#FFF3E0', color: '#F57C00' }; // Light Orange BG, Dark Orange Text
            case 'cancelled': return { backgroundColor: '#FFEBEE', color: '#D32F2F' }; // Light Red BG, Red Text
            default: return { backgroundColor: '#F5F5F5', color: '#616161' }; // Light Grey BG, Grey Text
        }
    };

    const renderOrderItem = ({ item }: { item: Order }) => {
        const statusStyle = getStatusStyle(item.status);
        return (
            <View style={styles.orderItem}>
                {/* Order Header */}
                <View style={styles.orderHeader}>
                    <View style={styles.orderHeaderText}>
                        <Text style={styles.shopName}>{item.shopName}</Text>
                        <Text style={styles.orderDate}>{formatDate(item.createdAt)}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusStyle.backgroundColor }]}>
                        <Text style={[styles.statusText, { color: statusStyle.color }]}>{item.status.toUpperCase()}</Text>
                    </View>
                </View>

                {/* Divider */}
                <View style={styles.divider} />

                {/* Order Details */}
                <View style={styles.orderDetails}>
                    <View style={styles.detailRow}>
                        <Ionicons name="time-outline" size={18} color="#555555" />
                        <Text style={styles.detailText}>Pickup: {item.pickupTime}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Ionicons name="location-outline" size={18} color="#555555" />
                        <Text style={styles.detailText} numberOfLines={1}>{item.address}</Text>
                    </View>
                    {item.phoneNumber !== "No phone number available" && ( // Only show if available
                        <View style={styles.detailRow}>
                            <Ionicons name="call-outline" size={18} color="#555555" />
                            <Text style={styles.detailText}>{item.phoneNumber}</Text>
                        </View>
                    )}
                </View>

                {/* Order Footer */}
                <View style={styles.orderFooter}>
                    <Text style={styles.totalAmount}>Total: ${parseFloat(item.totalAmount.toString()).toFixed(2)}</Text>
                    {/* Optional: Add a "View Details" or "Reorder" button here */}
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#555555" />
                </TouchableOpacity>
                <Text style={styles.headerText}>Order History</Text>
                <View style={styles.headerSpacer} /> {/* For centering title */}
            </View>

            {/* Order List or Empty State */}
            <FlatList
                data={orderDetails}
                renderItem={renderOrderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={ // Add pull-to-refresh
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#6F4E37"]} tintColor={"#6F4E37"} />
                }
                ListEmptyComponent={ // Show when list is empty
                    <View style={styles.emptyContainer}>
                        <Ionicons name="receipt-outline" size={64} color="#AAAAAA" />
                        <Text style={styles.emptyText}>No Orders Yet</Text>
                        <Text style={styles.emptySubtext}>Your past orders will appear here.</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F8F8F8', // Slightly off-white background for contrast
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8F8F8',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF', // White header
        borderBottomWidth: 1,
        borderBottomColor: '#EEEEEE',
    },
    backButton: {
        padding: 8,
    },
    headerText: {
        fontSize: 20, // Slightly smaller header text
        fontWeight: '600', // Semi-bold
        color: '#333333', // Dark grey
    },
    headerSpacer: {
        width: 40, // Match back button touch area
    },
    listContent: {
        padding: 16,
        paddingBottom: 24, // Ensure space at the bottom
        flexGrow: 1, // Needed for ListEmptyComponent to center
    },
    orderItem: {
        backgroundColor: '#FFFFFF', // White card background
        borderRadius: 12,
        marginBottom: 16,
        padding: 16,
        // Use border instead of shadow for a flatter look
        borderWidth: 1,
        borderColor: '#EEEEEE',
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start', // Align items to top
        marginBottom: 12,
    },
    orderHeaderText: {
        flex: 1, // Allow text to take available space
        marginRight: 8, // Space before badge
    },
    shopName: {
        fontSize: 17, // Slightly adjusted size
        fontWeight: '600', // Semi-bold
        color: '#333333', // Darker text
        marginBottom: 4,
    },
    orderDate: {
        fontSize: 13, // Smaller date
        color: '#888888', // Lighter grey
    },
    statusBadge: {
        paddingHorizontal: 10, // Adjusted padding
        paddingVertical: 5,
        borderRadius: 16, // Pill shape
        alignSelf: 'flex-start', // Align badge to its own top
    },
    statusText: {
        fontWeight: 'bold', // Bold status
        fontSize: 11, // Smaller status text
        textTransform: 'uppercase', // Uppercase status
    },
    divider: {
        height: 1,
        backgroundColor: '#F0F0F0', // Lighter divider
        marginVertical: 12,
    },
    orderDetails: {
        marginBottom: 12,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10, // Increased spacing
    },
    detailText: {
        marginLeft: 10, // Increased icon spacing
        fontSize: 14,
        color: '#555555', // Medium grey
        flexShrink: 1, // Allow text to wrap
    },
    orderFooter: {
        alignItems: 'flex-end',
        marginTop: 8,
    },
    totalAmount: {
        fontSize: 16, // Slightly smaller total
        fontWeight: 'bold',
        color: '#333333', // Dark grey total
    },
    emptyContainer: {
        flex: 1, // Take remaining space
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        marginTop: -50, // Adjust position if needed
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#888888', // Grey text
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#AAAAAA', // Lighter grey
        marginTop: 8,
        textAlign: 'center',
    },
});

export default OrderHistoryScreen;
