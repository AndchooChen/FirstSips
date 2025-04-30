import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, Image, FlatList, TouchableOpacity, ScrollView, SafeAreaView, ActivityIndicator, Alert } from "react-native";
import ItemCard from "../../components/ItemCard"; // Assuming ItemCard component exists and is styled
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { supabase } from "../../utils/supabase";

interface ShopItem {
    id: string;
    name: string;
    description: string;
    price: number;
    images?: string[];
    quantity?: number; // Stock quantity (-1 for unlimited, -2 for hidden)
}

interface CartItem extends ShopItem {
    quantity: number; // Quantity in cart
}

interface Shop {
    id: string;
    shop_name: string;
    description?: string;
    profile_image?: string;
    owner_id?: string;
}

const OpenedShopScreen = () => {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { shopId } = params;
    const [shopData, setShopData] = useState<Shop | null>(null);
    const [items, setItems] = useState<ShopItem[]>([]);
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(true); // Loading state

    // Fetch Shop Data and Items
    useEffect(() => {
        const fetchData = async () => {
            if (!shopId) { setLoading(false); return; }
            setLoading(true);
            try {
                // Fetch Shop
                const { data: shopResult, error: shopError } = await supabase
                    .from("shops")
                    .select("*")
                    .eq("id", shopId)
                    .single();
                if (shopError) throw shopError;
                setShopData(shopResult);

                // Fetch Items (only those not hidden, quantity != -2)
                const { data: itemsResult, error: itemsError } = await supabase
                    .from("items")
                    .select("*")
                    .eq("shop_id", shopId)
                    .neq('quantity', -2); // Exclude hidden items
                if (itemsError) throw itemsError;

                const formattedItems: ShopItem[] = itemsResult.map((item) => ({
                    ...item,
                    id: item.id,
                }));
                setItems(formattedItems);

            } catch (error) {
                console.error("Error fetching shop data or items:", error);
                Alert.alert("Error", "Could not load shop details.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [shopId]);

    // Add/Remove from Cart Logic (using useCallback for potential optimization)
    const handleCartChange = useCallback((item: ShopItem, quantityChange: number) => {
        setCartItems(currentCart => {
            const existingItemIndex = currentCart.findIndex(cartItem => cartItem.id === item.id);
            const existingItem = existingItemIndex !== -1 ? currentCart[existingItemIndex] : null;
            const currentInCart = existingItem ? existingItem.quantity : 0;
            const newQuantity = currentInCart + quantityChange;

            // Check stock if adding
            if (quantityChange > 0 && item.quantity !== -1 && item.quantity !== undefined) { // Not unlimited stock
                if (newQuantity > item.quantity) {
                    Alert.alert(`Stock Limit`, `Only ${item.quantity} available. You have ${currentInCart} in cart.`);
                    return currentCart; // No change
                }
            }

            // Update cart
            if (newQuantity <= 0) {
                // Remove item
                return currentCart.filter(cartItem => cartItem.id !== item.id);
            } else if (existingItem) {
                // Update quantity
                const updatedCart = [...currentCart];
                updatedCart[existingItemIndex] = { ...existingItem, quantity: newQuantity };
                return updatedCart;
            } else {
                // Add new item
                return [...currentCart, { ...item, quantity: newQuantity }];
            }
        });
    }, []); // No dependencies needed if it only uses item and quantityChange args

    // Navigate to Checkout
    const handleCheckout = () => {
        if (cartItems.length === 0) {
            Alert.alert('Empty Cart', 'Please add items to your cart before checking out.');
            return;
        }
        console.log("Navigating to Checkout with Shop ID:", shopId);
        router.push({
            pathname: "../../(checkout)/CheckoutScreen",
            params: { items: JSON.stringify(cartItems), shopId: String(shopId) } // Ensure shopId is string
        });
    };

    // Navigate to Owner Info
    const handleOwnerInfo = () => {
        if (shopData?.owner_id) {
            router.push({
                pathname: "/(tabs)/shop_front/OwnerInfoScreen",
                params: { owner_id: shopData.owner_id }
            });
        } else {
            Alert.alert("Info Unavailable", "Owner information is not available for this shop.");
        }
    };

    // Calculate Cart Totals
    const cartTotalQuantity = useMemo(() => cartItems.reduce((total, item) => total + item.quantity, 0), [cartItems]);
    const cartTotalPrice = useMemo(() => cartItems.reduce((total, item) => total + (item.price * item.quantity), 0), [cartItems]);

    // Loading State
    if (loading) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#6F4E37" />
                </View>
            </SafeAreaView>
        );
    }

    // No Shop Data State
    if (!shopData) {
        return (
             <SafeAreaView style={styles.safeArea}>
                 <View style={styles.header}>
                    <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color="#555555" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Shop Not Found</Text>
                    <View style={styles.headerButton} /> {/* Spacer */}
                </View>
                <View style={styles.loadingContainer}>
                    <Text style={styles.emptyText}>Could not load shop details.</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#555555" />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>{shopData.shop_name}</Text>
                <TouchableOpacity style={styles.headerButton} onPress={handleOwnerInfo}>
                    <Ionicons name="information-circle-outline" size={24} color="#555555" />
                </TouchableOpacity>
            </View>

            <FlatList
                data={items}
                ListHeaderComponent={ // Shop Info as List Header
                    <View style={styles.shopInfo}>
                        <Image
                            source={shopData.profile_image ? { uri: shopData.profile_image } : require("../../assets/images/no_shop_image.png")}
                            style={styles.shopImage}
                        />
                        <Text style={styles.shopName}>{shopData.shop_name}</Text>
                        {shopData.description && (
                            <Text style={styles.shopDescription}>{shopData.description}</Text>
                        )}
                    </View>
                }
                renderItem={({ item }) => (
                    <ItemCard
                        name={item.name}
                        description={item.description}
                        price={item.price}
                        image={item.images?.[0] ? { uri: item.images[0] } : require("../../assets/images/no_item_image.png")}
                        onAddToCart={(quantityChange) => handleCartChange(item, quantityChange)} // Use unified handler
                        cartQuantity={cartItems.find(cartItem => cartItem.id === item.id)?.quantity || 0}
                        stock={item.quantity} // Pass stock quantity to ItemCard
                    />
                )}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.itemsList}
                ListEmptyComponent={<Text style={styles.emptyText}>No items available right now.</Text>}
                showsVerticalScrollIndicator={false}
            />

            {/* Checkout Button */}
            {cartTotalQuantity > 0 && (
                <View style={styles.checkoutContainer}>
                    <TouchableOpacity style={styles.checkoutButton} onPress={handleCheckout}>
                        <View style={styles.checkoutTextContainer}>
                            <Text style={styles.checkoutText}>Checkout ({cartTotalQuantity} items)</Text>
                            <Text style={styles.checkoutPrice}>${cartTotalPrice.toFixed(2)}</Text>
                        </View>
                        <Ionicons name="arrow-forward" size={22} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#FFFFFF', // White background
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#EEEEEE',
    },
    headerButton: {
        padding: 8,
        width: 40,
        alignItems: 'center',
    },
    headerTitle: {
        flex: 1,
        fontSize: 20,
        fontWeight: '600',
        color: '#333333',
        textAlign: 'center',
        marginHorizontal: 8,
    },
    shopInfo: {
        alignItems: "center",
        paddingVertical: 24,
        paddingHorizontal: 16,
        backgroundColor: "#FFFFFF",
        borderBottomWidth: 1,
        borderBottomColor: '#EEEEEE',
        marginBottom: 8, // Space before item list
    },
    shopImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: 16,
        backgroundColor: '#F0F0F0',
    },
    shopName: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#333333",
        marginBottom: 8,
    },
    shopDescription: {
        fontSize: 15,
        color: "#555555",
        textAlign: "center",
        lineHeight: 22,
    },
    itemsList: {
        paddingHorizontal: 16, // Padding for the list items
        paddingBottom: 100, // Space for checkout button
    },
    checkoutContainer: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "#FFFFFF", // White background
        paddingVertical: 12, // Adjusted padding
        paddingHorizontal: 16,
        paddingBottom: Platform.OS === 'ios' ? 24 : 12, // Extra padding for home indicator on iOS
        borderTopWidth: 1,
        borderTopColor: "#EEEEEE", // Light border
        elevation: 5, // Shadow for Android
        shadowColor: '#000', // Shadow for iOS
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    checkoutButton: {
        backgroundColor: "#6F4E37", // Primary accent color
        borderRadius: 12, // Rounded corners
        paddingVertical: 14, // Vertical padding
        paddingHorizontal: 20, // Horizontal padding
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    checkoutTextContainer: {
        // Container for text elements if needed
    },
    checkoutText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "bold", // Bold text
    },
    checkoutPrice: {
        color: "#FFFFFF",
        fontSize: 14,
        fontWeight: '500', // Medium weight
        marginTop: 2, // Space between lines
    },
    emptyText: {
        textAlign: 'center',
        color: '#888888',
        marginTop: 32,
        fontSize: 16,
    },
});

export default OpenedShopScreen;
