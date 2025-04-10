import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
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
    shopName: string;
    description?: string;
    profileImage?: string;
    ownerId?: string;
}

export default function ClosedShopScreen() {
    const { shopId } = useLocalSearchParams();
    const [shop, setShop] = useState<Shop | null>(null);
    const [items, setItems] = useState<ShopItem[]>([]);
    const router = useRouter();

    useEffect(() => {
        const fetchShopAndItems = async () => {
          if (!shopId) return;
      
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
          }
        };
      
        fetchShopAndItems();
      }, [shopId]);
      

    const handleOwnerInfo = () => {
        if (shop?.ownerId) {
            router.push({
                pathname: "/(tabs)/shop_front/OwnerInfoScreen",
                params: { ownerId: shop.ownerId }
            });
        }
    };

    if (!shop) {
        return (
            <View style={styles.loadingContainer}>
                <Text>Loading...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.headerButton}
                    onPress={() => router.back()}
                >
                    <Ionicons name="arrow-back" size={24} color="#6F4E37" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{shop.shopName}</Text>
                <TouchableOpacity
                    style={styles.headerButton}
                    onPress={handleOwnerInfo}
                >
                    <Ionicons name="information-circle" size={24} color="#6F4E37" />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollView}>
                <View style={styles.shopInfo}>
                    <Image
                        source={
                            shop.profileImage
                                ? { uri: shop.profileImage }
                                : require('../../assets/images/stock_coffee.png')
                        }
                        style={styles.shopImage}
                    />
                    <Text style={styles.shopName}>{shop.shopName}</Text>
                    {shop.description && (
                        <Text style={styles.shopDescription}>{shop.description}</Text>
                    )}
                    <View style={styles.closedBanner}>
                        <Ionicons name="time" size={20} color="#F44336" />
                        <Text style={styles.closedText}>Currently Closed</Text>
                    </View>
                </View>

                <View style={styles.itemsContainer}>
                    {items.map((item) => (
                        <View key={item.id} style={styles.itemCard}>
                            <Image
                                source={
                                    item.images?.[0]
                                        ? { uri: item.images[0] }
                                        : require('../../assets/images/no_item_image.png')
                                }
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
                    ))}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
        marginTop: 40,
    },
    headerButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#6F4E37',
        flex: 1,
        textAlign: 'center',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollView: {
        flex: 1,
    },
    shopInfo: {
        alignItems: "center",
        padding: 20,
        backgroundColor: "#FFFFFF",
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    shopImage: {
        width: 80,
        height: 80,
        borderRadius: 40,
        marginBottom: 12,
    },
    shopName: {
        fontSize: 20,
        fontWeight: "600",
        color: "#333333",
        marginBottom: 4,
    },
    shopDescription: {
        fontSize: 14,
        color: "#666666",
        textAlign: "center",
        marginBottom: 12,
    },
    closedBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFEBEE',
        padding: 8,
        borderRadius: 8,
        marginTop: 8,
    },
    closedText: {
        color: '#F44336',
        marginLeft: 8,
        fontWeight: '500',
    },
    itemsContainer: {
        padding: 16,
    },
    itemCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        marginBottom: 16,
        overflow: 'hidden',
        opacity: 0.8,
        flexDirection: 'row',
        padding: 16,
    },
    itemImage: {
        width: 80,
        height: 80,
        borderRadius: 8,
    },
    itemInfo: {
        flex: 1,
        marginLeft: 12,
        justifyContent: 'space-between',
    },
    itemName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333333',
    },
    itemDescription: {
        fontSize: 14,
        color: '#666666',
        marginVertical: 4,
    },
    itemPrice: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6F4E37',
    },
});
