import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { FIREBASE_AUTH, FIREBASE_DB } from '../../auth/FirebaseConfig';
import { collection, query, getDocs } from 'firebase/firestore';
import ShopCard from '../../components/ShopCard';
import { useRouter } from 'expo-router';
import ScreenWideButton from "../../components/ScreenWideButton";

interface Shop {
    id: string;
    shopName: string;
    profileImage?: string;
    isOpen: boolean;
    [key: string]: any;
}

const DashboardScreen = () => {
    const [openShops, setOpenShops] = useState<Shop[]>([]);
    const [closedShops, setClosedShops] = useState<Shop[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const router = useRouter();

    const fetchShops = async () => {
        try {
            const shopsQuery = query(collection(FIREBASE_DB, 'shops'));
            const querySnapshot = await getDocs(shopsQuery);
            
            const openShopsList: Shop[] = [];
            const closedShopsList: Shop[] = [];

            querySnapshot.forEach((doc) => {
                const shopData = { id: doc.id, ...doc.data() } as Shop;
                if (shopData.isOpen) {
                    openShopsList.push(shopData);
                } else {
                    closedShopsList.push(shopData);
                }
            });

            setOpenShops(openShopsList);
            setClosedShops(closedShopsList);
        } catch (error) {
            console.error('Error fetching shops:', error);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchShops();
        setRefreshing(false);
    };

    useEffect(() => {
        fetchShops();
    }, []);

    const handleShopAction = () => {
        router.push("../shop_owner/EditShopScreen");
    };

    const handleOrderHistory = () => {
        router.push('/(tabs)/shop_front/OrderHistoryScreen');
    };

    const handleLogout = async () => {
        try {
            await FIREBASE_AUTH.signOut();
            router.replace('../../(public)/LandingScreen');
        } catch (error) {
            console.log(error);
        }
    };

    return (
        <ScrollView 
            style={styles.container}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
        >
            <Text style={styles.header}>FirstSips</Text>
            <View style={styles.buttonContainer}>
                <ScreenWideButton
                    text="Edit Shop"
                    textColor="#FFFFFF"
                    color="#D4A373"
                    onPress={handleShopAction}
                />
                <ScreenWideButton
                    text="Order History"
                    textColor="#FFFFFF"
                    color="#6A8CAF"
                    onPress={handleOrderHistory}
                />
                <ScreenWideButton
                    text="Logout"
                    textColor="#FFFFFF"
                    color="#654942"
                    onPress={handleLogout}
                />
            </View>
            {/* Open Shops Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Open Shops</Text>
                {openShops.length === 0 ? (
                    <Text style={styles.emptyText}>No open shops available</Text>
                ) : (
                    openShops.map((shop) => (
                        <ShopCard
                            key={shop.id}
                            shop={shop}
                            onPress={() => router.push({
                                pathname: "/(tabs)/shop_front/OpenedShopScreen",
                                params: { shopId: shop.id }
                            })}
                        />
                    ))
                )}
            </View>

            {/* Closed Shops Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Closed Shops</Text>
                {closedShops.length === 0 ? (
                    <Text style={styles.emptyText}>No closed shops</Text>
                ) : (
                    closedShops.map((shop) => (
                        <ShopCard
                            key={shop.id}
                            shop={shop}
                            onPress={() => router.push({
                                pathname: "/(tabs)/shop_front/ClosedShopScreen",
                                params: { shopId: shop.id }
                            })}
                        />
                    ))
                )}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5EDD8',
    },
    header: {
        marginTop: 40,
        marginBottom: 20,
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    buttonContainer: {
        gap: 10,
        paddingHorizontal: 16,
        marginBottom: 20,
    },
    section: {
        padding: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
        color: '#6F4E37',
    },
    emptyText: {
        textAlign: 'center',
        color: '#666666',
        marginTop: 8,
    },
});

export default DashboardScreen;