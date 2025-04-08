<<<<<<< HEAD
import { View, Text, StyleSheet, FlatList } from "react-native";
import { useState, useEffect } from "react";
import { FIREBASE_AUTH, FIREBASE_DB } from "../../auth/FirebaseConfig";
import { collection, query, onSnapshot } from 'firebase/firestore';
import { doc, getDoc } from 'firebase/firestore';
import ShopCard from "../../components/ShopCard"
import { useRouter } from "expo-router";
import ScreenWideButton from "../../components/ScreenWideButton";

export default function DashboardScreen() {
    const [hasShop, setHasShop] = useState(false);
    const [shops, setShops] = useState([]);
    const router = useRouter();

    useEffect(() => {
        const checkUserShop = async () => {
            const userId = FIREBASE_AUTH.currentUser?.uid;
            if (!userId) return;

            const userDoc = await getDoc(doc(FIREBASE_DB, "users", userId));
            const shopId = userDoc.data()?.shopId;
            setHasShop(!!shopId);
        };

        checkUserShop();
    }, []);

    // Fetch all shops
    useEffect(() => {
        const shopsQuery = query(collection(FIREBASE_DB, 'shops'));
        
        const unsubscribe = onSnapshot(shopsQuery, (snapshot) => {
            const shopsList = [];
            snapshot.forEach((doc) => {
                shopsList.push({ id: doc.id, ...doc.data() });
            });
            setShops(shopsList);
        });

        return () => unsubscribe();
    }, []);

    const handleShopAction = () => {
        if (hasShop) {
            router.push("../shop/EditShopScreen");
        } else {
            router.push("../shop/CreateShopScreen");
        }
=======
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { FIREBASE_AUTH, FIREBASE_DB } from '../../auth/FirebaseConfig';
import { collection, query, getDocs } from 'firebase/firestore';
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
>>>>>>> LoginRedesign
    };

    const handleLogout = async () => {
        try {
            await FIREBASE_AUTH.signOut();
            router.replace('../../(public)/LandingScreen');
        } catch (error) {
            console.log(error);
        }
<<<<<<< HEAD
    }

    const renderItem = ({ item }) => (
        <ShopCard
            name={item.shopName}
            description={item.description}
            onPress={() => router.push({
                pathname: "../shop/ShopScreen",
                params: { 
                    shopId: item.shopId,
                    shopName: item.shopName,
                    shopDescription: item.description
                }
            })}
        />
    )

    return (
        <View style={styles.background}>
            <Text style={styles.header}>FirstSips</Text>
            <View style={styles.buttonContainer}>
                <ScreenWideButton
                    text={hasShop ? "Edit Shop" : "Create Shop"}
                    textColor="#FFFFFF"
                    color="#D4A373"
                    onPress={handleShopAction}
                />
                <ScreenWideButton
                    text="Logout"
                    textColor="#FFFFFF"
                    color="#654942"
                    onPress={handleLogout}
                />
            </View>
            <FlatList
                data={shops}
                renderItem={renderItem}
                keyExtractor={item => item.shopId}
                contentContainerStyle={styles.flatListContainer}
                showsVerticalScrollIndicator={false}
                horizontal={false}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    background: {
        backgroundColor: "#F5EDD8",
        flex: 1,
        width: '100%', // Add this to ensure full width
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
    flatListContainer: {
        flexGrow: 1,
        width: '100%', // Add this to ensure full width
        alignItems: 'center',
        marginTop: 10,
    },
})
=======
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
                        title="Edit Shop"
                        leadingIcon="pencil"
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
>>>>>>> LoginRedesign
