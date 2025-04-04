import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FIREBASE_DB } from '../../auth/FirebaseConfig';
import { doc, getDoc, collection, query, getDocs } from 'firebase/firestore';
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
                // Fetch shop details
                const shopDoc = await getDoc(doc(FIREBASE_DB, 'shops', shopId as string));
                if (shopDoc.exists()) {
                    setShop(shopDoc.data() as Shop);
                }

                // Fetch shop items
                const itemsQuery = query(collection(FIREBASE_DB, `shops/${shopId}/items`));
                const itemsSnapshot = await getDocs(itemsQuery);
                const itemsList: ShopItem[] = [];
                itemsSnapshot.forEach((doc) => {
                    itemsList.push({ id: doc.id, ...doc.data() } as ShopItem);
                });
                setItems(itemsList);
            } catch (error) {
                console.error('Error fetching shop data:', error);
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
            {/* Header with navigation buttons */}
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

            <ScrollView>
                {/* Shop Info */}
                <View style={styles.shopHeader}>
                    <Image
                        source={
                            shop.profileImage
                                ? { uri: shop.profileImage }
                                : require('../../assets/images/stock_coffee.png')
                        }
                        style={styles.shopImage}
                    />
                    <View style={styles.shopInfo}>
                        {shop.description && (
                            <Text style={styles.shopDescription}>{shop.description}</Text>
                        )}
                        <View style={styles.closedBanner}>
                            <Ionicons name="time" size={20} color="#F44336" />
                            <Text style={styles.closedText}>Currently Closed</Text>
                        </View>
                    </View>
                </View>

                {/* Items List */}
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
        backgroundColor: '#F5EDD8',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: '#FFFFFF',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
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
    shopHeader: {
        padding: 16,
        backgroundColor: '#FFFFFF',
        flexDirection: 'row',
        alignItems: 'center',
    },
    shopImage: {
        width: 80,
        height: 80,
        borderRadius: 40,
        marginRight: 16,
    },
    shopInfo: {
        flex: 1,
    },
    shopDescription: {
        fontSize: 14,
        color: '#666666',
        marginBottom: 8,
    },
    closedBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFEBEE',
        padding: 8,
        borderRadius: 4,
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
    },
    itemImage: {
        width: '100%',
        height: 200,
        resizeMode: 'cover',
    },
    itemInfo: {
        padding: 16,
    },
    itemName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#6F4E37',
        marginBottom: 4,
    },
    itemDescription: {
        fontSize: 14,
        color: '#666666',
        marginBottom: 8,
    },
    itemPrice: {
        fontSize: 16,
        fontWeight: '500',
        color: '#6F4E37',
    },
});
