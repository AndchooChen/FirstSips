import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, SafeAreaView } from 'react-native';
import ShopCard from '../../components/ShopCard'; // Assuming ShopCard component exists
import { useRouter } from 'expo-router';
import { Menu, IconButton } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { signOut } from "../../auth/auth";
import { supabase } from "../../utils/supabase";

interface Shop {
    id: string;
    shopName: string; // Renamed from shop_name for consistency
    profileImage?: string;
    status: boolean;
    address?: string; // Added address for ShopCard
    description?: string; // Added description for ShopCard
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

    const checkUserShop = useCallback(async () => {
        try {
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            if (!user || authError) { console.error('Auth error:', authError); return; }
            const userId = user.id;
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('shop_id')
                .eq('id', userId)
                .single();
            if (userError) { console.error('Error fetching user data:', userError); return; }
            if (userData && userData.shop_id) {
                setUserShopId(userData.shop_id);
                setHasShop(true);
            } else {
                setUserShopId(null);
                setHasShop(false);
            }
        } catch (error) { console.error('Error checking user shop:', error); }
    }, []);

    const fetchShops = useCallback(async () => {
        try {
            await checkUserShop();
            const { data: shopsData, error: shopsError } = await supabase
                .from('shops')
                .select('*');
            if (shopsError) { console.error('Error fetching shops:', shopsError); return; }

            const openShopsList: Shop[] = [];
            const closedShopsList: Shop[] = [];

            shopsData.forEach((shop) => {
                // Skip user's own shop
                if (shop.id === userShopId) return;

                const shopData: Shop = {
                    id: shop.id,
                    shopName: shop.shop_name, // Map from DB field
                    address: shop.street_address, // Map from DB field
                    profileImage: shop.profile_image,
                    status: shop.status,
                    description: shop.description,
                };

                if (shopData.status) {
                    openShopsList.push(shopData);
                } else {
                    closedShopsList.push(shopData);
                }
            });

            setOpenShops(openShopsList);
            setClosedShops(closedShopsList);
        } catch (error) { console.error('Error fetching shops:', error); }
    }, [userShopId, checkUserShop]); // Depend on userShopId and checkUserShop

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchShops();
        setRefreshing(false);
    }, [fetchShops]); // Depend on fetchShops

    useEffect(() => {
        fetchShops();
    }, [fetchShops]); // Fetch shops when the component mounts or fetchShops changes

    const handleShopAction = () => {
        setMenuVisible(false);
        if (hasShop) {
            router.push("../shop_owner/EditShopScreen");
        } else {
            router.push("../../(auth)/CreateShopScreen");
        }
    };

    const handleOrderHistory = () => {
        setMenuVisible(false);
        router.push('/(tabs)/shop_front/OrderHistoryScreen');
    };

    const handleSignOut = async () => {
        setMenuVisible(false);
        try {
            const { error } = await signOut();
            if (error) { console.log('Sign out error:', error); return; }
            router.replace('../../(public)/LandingScreen');
        } catch (error) { console.log('Unexpected error during sign out:', error); }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView
                style={styles.container}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#6F4E37"]} tintColor={"#6F4E37"}/>
                }
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.headerContainer}>
                    <Text style={styles.header}>FirstSips</Text>
                    <Menu
                        visible={menuVisible}
                        onDismiss={() => setMenuVisible(false)}
                        anchor={
                            <IconButton
                                icon={({ size }) => (
                                    <Ionicons name="menu" size={size} color="#555555" /> // Consistent icon color
                                )}
                                size={28} // Slightly larger icon
                                onPress={() => setMenuVisible(true)}
                                style={styles.menuButton}
                            />
                        }
                        contentStyle={styles.menuContent} // Style the menu dropdown
                    >
                        <Menu.Item
                            onPress={handleShopAction}
                            title={hasShop ? "Edit Shop" : "Create Shop"}
                            leadingIcon={hasShop ? "store-edit-outline" : "store-plus-outline"} // Material Community Icons
                            titleStyle={styles.menuItemTitle}
                        />
                        <Menu.Item
                            onPress={handleOrderHistory}
                            title="Order History"
                            leadingIcon="history"
                            titleStyle={styles.menuItemTitle}
                        />
                        <Menu.Item
                            onPress={handleSignOut}
                            title="Sign Out"
                            leadingIcon="logout"
                            titleStyle={styles.menuItemTitle}
                        />
                    </Menu>
                </View>

                {/* Open Shops Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Open Now</Text>
                    {openShops.length === 0 && !refreshing ? (
                        <Text style={styles.emptyText}>No shops currently open.</Text>
                    ) : (
                        openShops.map((shop) => (
                            <ShopCard
                                key={shop.id}
                                shop={shop}
                                onPress={() => router.push({
                                    pathname: "/(tabs)/shop_front/OpenedShopScreen",
                                    params: { shopId: shop.id }
                                })}
                                style={styles.shopCard} // Apply card styling
                            />
                        ))
                    )}
                </View>

                {/* Closed Shops Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Currently Closed</Text>
                    {closedShops.length === 0 && !refreshing ? (
                        <Text style={styles.emptyText}>No closed shops found.</Text>
                    ) : (
                        closedShops.map((shop) => (
                            <ShopCard
                                key={shop.id}
                                shop={shop}
                                onPress={() => router.push({
                                    pathname: "/(tabs)/shop_front/ClosedShopScreen",
                                    params: { shopId: shop.id }
                                })}
                                style={styles.shopCard} // Apply card styling
                            />
                        ))
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#FFFFFF', // White background
    },
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF', // White background
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20, // Increased padding
        paddingTop: 10, // Adjusted top padding
        paddingBottom: 10, // Added bottom padding
        borderBottomWidth: 1, // Subtle separator
        borderBottomColor: '#EEEEEE', // Light grey separator
    },
    header: {
        fontSize: 28, // Slightly smaller header
        fontWeight: 'bold',
        color: '#333333', // Dark grey header text
    },
    menuButton: {
        margin: 0, // Remove default margin
    },
    menuContent: {
        backgroundColor: '#FFFFFF', // White background for menu
        borderRadius: 8,
    },
    menuItemTitle: {
        color: '#333333', // Dark text for menu items
    },
    section: {
        paddingHorizontal: 20, // Consistent horizontal padding
        paddingVertical: 16, // Vertical padding for sections
    },
    sectionTitle: {
        fontSize: 20, // Slightly larger section title
        fontWeight: '600', // Semi-bold
        marginBottom: 16,
        color: '#333333', // Dark grey title
    },
    shopCard: { // Basic styling for ShopCard (can be moved to ShopCard component)
        marginBottom: 16,
        borderRadius: 12,
        backgroundColor: '#FFFFFF', // Ensure card background is white
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15, // Softer shadow
        shadowRadius: 2.22,
    },
    emptyText: {
        textAlign: 'center',
        color: '#888888', // Lighter grey for empty text
        marginTop: 16,
        fontSize: 16,
    },
});

export default DashboardScreen;
