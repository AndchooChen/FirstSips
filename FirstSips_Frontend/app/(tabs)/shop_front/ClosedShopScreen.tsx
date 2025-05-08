import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../utils/supabase';
import { Ionicons } from '@expo/vector-icons';

interface ShopItem {
    id: string;
    name: string;
    price: number;
    description?: string;
    images?: string[];
}

interface Shop {
    id: string;
    shop_name: string;
    description?: string;
    profile_image?: string;
    owner_id?: string;
    street_address?: string;
    city?: string;
    state?: string;
    zip?: string;
}

export default function ClosedShopScreen() {
    const { shopId } = useLocalSearchParams();
    const [shop, setShop] = useState<Shop | null>(null);
    const [items, setItems] = useState<ShopItem[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchShopAndItems = async () => {
            if (!shopId) {
                setLoading(false);
                return;
            }
            setLoading(true);
            try {
                const { data: shopData, error: shopError } = await supabase
                    .from("shops")
                    .select("*")
                    .eq("id", shopId)
                    .single();

                if (shopError) throw shopError;
                setShop(shopData);

                const { data: itemsData, error: itemsError } = await supabase
                    .from("items")
                    .select("*")
                    .eq("shop_id", shopId);

                if (itemsError) throw itemsError;

                const itemsList: ShopItem[] = itemsData.map((item) => ({
                    ...item,
                    id: item.id,
                }));

                setItems(itemsList);
            } catch (error) {
                console.error("Error fetching shop or items:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchShopAndItems();
    }, [shopId]);


    const handleOwnerInfo = () => {
        if (shop?.owner_id) {
            router.push({
                pathname: "/(tabs)/shop_front/OwnerInfoScreen",
                params: { owner_id: shop.owner_id }
            });
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#6F4E37" />
                </View>
            </SafeAreaView>
        );
    }

    if (!shop) {
        return (
            <SafeAreaView style={styles.safeArea}>
                 <View style={styles.header}>
                    <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color="#555555" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Shop Not Found</Text>
                    <View style={styles.headerButton} />
                </View>
                <View style={styles.loadingContainer}>
                    <Text style={styles.emptyText}>Could not load shop details.</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#555555" />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>{shop.shop_name}</Text>
                <TouchableOpacity style={styles.headerButton} onPress={handleOwnerInfo}>
                    <Ionicons name="information-circle-outline" size={24} color="#555555" />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                <View style={styles.shopInfo}>
                    <Image
                        source={shop.profile_image ? { uri: shop.profile_image } : require('../../assets/images/no_shop_image.png')}
                        style={styles.shopImage}
                    />
                    <Text style={styles.shopName}>{shop.shop_name}</Text>
                    {shop.description && (
                        <Text style={styles.shopDescription}>{shop.description}</Text>
                    )}
                    <View style={styles.closedBanner}>
                        <Ionicons name="time-outline" size={20} color="#D32F2F" /> {/* Error color */}
                        <Text style={styles.closedText}>Currently Closed</Text>
                    </View>
                </View>

                <View style={styles.itemsContainer}>
                    <Text style={styles.itemsTitle}>Menu Items</Text>
                    {items.length === 0 ? (
                        <Text style={styles.emptyText}>No items available for this shop.</Text>
                    ) : (
                        items.map((item) => (
                            <View key={item.id} style={[styles.itemCard, styles.itemCardClosed]}>
                                <Image
                                    source={item.images?.[0] ? { uri: item.images[0] } : require('../../assets/images/no_item_image.png')}
                                    style={styles.itemImage}
                                />
                                <View style={styles.itemInfo}>
                                    <Text style={styles.itemName}>{item.name}</Text>
                                    {item.description && (
                                        <Text style={styles.itemDescription} numberOfLines={2}>
                                            {item.description}
                                        </Text>
                                    )}
                                    <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
                                </View>
                            </View>
                        ))
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#FFFFFF', // White background
    },
    container: { // Redundant with safeArea, can be removed if safeArea is root
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12, // Adjusted padding
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#EEEEEE', // Light border
    },
    headerButton: {
        padding: 8, // Touch area
        width: 40, // Ensure consistent width for spacing
        alignItems: 'center',
    },
    headerTitle: {
        flex: 1, // Allow title to take space
        fontSize: 20,
        fontWeight: '600', // Semi-bold
        color: '#333333', // Dark grey
        textAlign: 'center',
        marginHorizontal: 8, // Space around title
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF', // Match background
    },
    scrollView: {
        flex: 1,
    },
    shopInfo: {
        alignItems: "center",
        paddingVertical: 24, // Increased vertical padding
        paddingHorizontal: 16,
        backgroundColor: "#FFFFFF", // White background
        borderBottomWidth: 1,
        borderBottomColor: '#EEEEEE', // Light border
    },
    shopImage: {
        width: 100, // Larger image
        height: 100,
        borderRadius: 50, // Circular image
        marginBottom: 16,
        backgroundColor: '#F0F0F0', // Placeholder background
    },
    shopName: {
        fontSize: 24, // Larger shop name
        fontWeight: "bold",
        color: "#333333",
        marginBottom: 8,
    },
    shopDescription: {
        fontSize: 15, // Slightly larger description
        color: "#555555", // Medium grey
        textAlign: "center",
        marginBottom: 16,
        lineHeight: 22, // Improve readability
    },
    closedBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFEBEE', // Light red background
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20, // Pill shape
        marginTop: 8,
    },
    closedText: {
        color: '#D32F2F', // Darker red text
        marginLeft: 8,
        fontWeight: '600', // Semi-bold
        fontSize: 14,
    },
    itemsContainer: {
        padding: 16,
    },
    itemsTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333333',
        marginBottom: 16,
    },
    itemCard: { // Base card style
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        marginBottom: 16,
        flexDirection: 'row',
        padding: 12, // Slightly reduced padding
        borderWidth: 1,
        borderColor: '#EEEEEE', // Light border for definition
    },
    itemCardClosed: { // Style for closed state
        opacity: 0.6, // Dim the card
    },
    itemImage: {
        width: 70, // Adjusted size
        height: 70,
        borderRadius: 8,
        marginRight: 12,
        backgroundColor: '#F0F0F0', // Placeholder background
    },
    itemInfo: {
        flex: 1,
        justifyContent: 'center', // Center content vertically
    },
    itemName: {
        fontSize: 16,
        fontWeight: '600', // Semi-bold
        color: '#333333',
        marginBottom: 4,
    },
    itemDescription: {
        fontSize: 14,
        color: '#666666',
        marginBottom: 6, // Adjusted spacing
    },
    itemPrice: {
        fontSize: 15, // Slightly adjusted size
        fontWeight: 'bold',
        color: '#6F4E37', // Accent color
    },
    emptyText: {
        textAlign: 'center',
        color: '#888888', // Lighter grey for empty text
        marginTop: 16,
        fontSize: 16,
    },
});
