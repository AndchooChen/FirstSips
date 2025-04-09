import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { FIREBASE_AUTH, FIREBASE_DB } from '../../auth/FirebaseConfig';
import { collection, query, getDocs, doc, getDoc } from 'firebase/firestore';
import ShopCard from '../../components/ShopCard';
import { useRouter } from 'expo-router';
import { Menu, IconButton } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

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
    const [menuVisible, setMenuVisible] = useState(false);
    const [userShopId, setUserShopId] = useState<string | null>(null);
    const [hasShop, setHasShop] = useState<boolean>(false);
    const router = useRouter();

    // Check if user has a shop
    const checkUserShop = async () => {
        try {
            const userId = FIREBASE_AUTH.currentUser?.uid;
            if (!userId) return;

            const userDoc = await getDoc(doc(FIREBASE_DB, 'users', userId));
            if (userDoc.exists() && userDoc.data().shopId) {
                setUserShopId(userDoc.data().shopId);
                setHasShop(true);
            } else {
                setUserShopId(null);
                setHasShop(false);
            }
        } catch (error) {
            console.error('Error checking user shop:', error);
        }
    };

    const fetchShops = async () => {
        try {
            await checkUserShop();

            const shopsQuery = query(collection(FIREBASE_DB, 'shops'));
            const querySnapshot = await getDocs(shopsQuery);

            const openShopsList: Shop[] = [];
            const closedShopsList: Shop[] = [];

            querySnapshot.forEach((doc) => {
                const shopData = { id: doc.id, ...doc.data() } as Shop;

                // Skip user's own shop
                if (shopData.id === userShopId) return;

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
        if (hasShop) {
            router.push("../shop_owner/EditShopScreen");
        } else {
            router.push("../shop_owner/CreateShopScreen");
        }
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
            <View style={styles.headerContainer}>
                <Text style={styles.header}>FirstSips</Text>
                <Menu
                    visible={menuVisible}
                    onDismiss={() => setMenuVisible(false)}
                    anchor={
                        <IconButton
                            icon={({ size }) => (
                                <Ionicons name="menu" size={size} color="#6F4E37" />
                            )}
                            size={24}
                            onPress={() => setMenuVisible(true)}
                            style={styles.menuButton}
                        />
                    }
                >
                    <Menu.Item
                        onPress={() => {
                            setMenuVisible(false);
                            handleShopAction();
                        }}
                        title={hasShop ? "Edit Shop" : "Create Shop"}
                        leadingIcon={hasShop ? "pencil" : "plus"}
                    />
                    <Menu.Item
                        onPress={() => {
                            setMenuVisible(false);
                            handleOrderHistory();
                        }}
                        title="Order History"
                        leadingIcon="history"
                    />
                    <Menu.Item
                        onPress={() => {
                            setMenuVisible(false);
                            handleLogout();
                        }}
                        title="Logout"
                        leadingIcon="logout"
                    />
                </Menu>
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
        width: "100%",
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginTop: 40,
        marginBottom: 20,
    },
    header: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#D4A373',
        fontFamily: 'System',
        letterSpacing: 0.5,
    },
    menuButton: {
        margin: 0,
    },
    section: {
        padding: 16,
        width: "100%",
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
