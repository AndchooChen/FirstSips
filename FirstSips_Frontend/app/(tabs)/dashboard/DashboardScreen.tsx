import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import ShopCard from '../../components/ShopCard';
import { useRouter } from 'expo-router';
import { Menu, IconButton } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { signOut } from "../../auth/auth";
import { supabase } from "../../utils/supabase";

// Define the interface for shop data
interface Shop {
    id: string;
    shopName: string;
    profileImage?: string;
    status: boolean;
    address?: string;
    description?: string;
    [key: string]: any;
}

const DashboardScreen = () => {
    const [openShops, setOpenShops] = useState<Shop[]>([]);
    const [closedShops, setClosedShops] = useState<Shop[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [menuVisible, setMenuVisible] = useState(false);
    const [userShopId, setUserShopId] = useState<string | null>(null);
    const [hasShop, setHasShop] = useState<boolean>(false);
    const router = useRouter();

    // Check if user has a shop and fetch shops
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            await checkUserShop();
            await fetchShops();
            setLoading(false);
        };
        loadData();
    }, []);

    // Check if the current user is a shop owner and get their shop ID
    const checkUserShop = async () => {
        console.log('Checking user shop status...');
        try {
            const { data: { user }, error: authError } = await supabase.auth.getUser();

            if (!user || authError) {
                console.error('Auth error:', authError);
                return;
            }

            const userId = user.id;

            // Query the users table to check if the user has a shop
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('shop_id')
                .eq('id', userId)
                .single();

            if (userError) {
                console.error('Error fetching user data for shop check:', userError);
                return;
            }

            if (userData && userData.shop_id) {
                console.log('User has a shop:', userData.shop_id);
                setUserShopId(userData.shop_id);
                setHasShop(true);
            } else {
                console.log('User does not have a shop.');
                setUserShopId(null);
                setHasShop(false);
            }
        } catch (error) {
            console.error('Error checking user shop:', error);
             Alert.alert('Error', 'Failed to check your shop status.');
        }
    };

    // Fetch all shops and categorize them
    const fetchShops = async () => {
        console.log('Fetching all shops...');
        try {
            const { data: shopsData, error: shopsError } = await supabase
                .from('shops')
                .select('*');

            if (shopsError) {
                console.error('Error fetching shops:', shopsError);
                 Alert.alert('Error', 'Failed to load shops.');
                return;
            }

            const openShopsList: Shop[] = [];
            const closedShopsList: Shop[] = [];

            shopsData.forEach((shop) => {
                const shopData: Shop = {
                    id: shop.id,
                    shopName: shop.shop_name,
                    address: shop.street_address,
                    profileImage: shop.profile_image,
                    status: shop.status,
                    description: shop.description,
                };

                if (userShopId && shopData.id === userShopId) {
                    console.log(`Excluding user's shop from list: ${shopData.shopName}`);
                    return;
                }

                if (shopData.status) {
                    openShopsList.push(shopData);
                } else {
                    closedShopsList.push(shopData);
                }
            });

            setOpenShops(openShopsList);
            setClosedShops(closedShopsList);
            console.log(`Fetched ${openShopsList.length} open shops and ${closedShopsList.length} closed shops.`);
        } catch (error) {
            console.error('Error fetching shops:', error);
             Alert.alert('Error', 'Failed to fetch shops.');
        }
    };

    // Handle pull-to-refresh
    const onRefresh = async () => {
        setRefreshing(true);
        await fetchShops();
        setRefreshing(false);
    };

    // Navigate to Create Shop or Edit Shop screen
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
        console.log('Attempting to sign out...');
        try {
            const { error } = await signOut();
            if (error) {
                console.error('Sign out error:', error);
                Alert.alert('Sign Out Error', error.message);
                return;
            }
            console.log('Sign out successful, navigating to LandingScreen.');
            router.replace('../../(public)/LandingScreen');
        } catch (error) {
            console.error('Unexpected error during sign out:', error);
            Alert.alert('Error', 'An unexpected error occurred during sign out.');
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView
                style={styles.scrollViewContainer}
                contentContainerStyle={styles.scrollViewContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#6F4E37']}
                        tintColor="#6F4E37"
                    />
                }
            >
                <View style={styles.headerContainer}>
                    <Text style={styles.appTitle}>FirstSips</Text>
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
                                accessibilityLabel="Open menu"
                            />
                        }
                    >
                        <Menu.Item
                            onPress={handleShopAction}
                            title={hasShop ? "Edit My Shop" : "Create My Shop"}
                            leadingIcon={hasShop ? "pencil" : "plus"}
                        />
                        <Menu.Item
                            onPress={handleOrderHistory}
                            title="Order History"
                            leadingIcon="history"
                        />
                        <Menu.Item
                            onPress={handleSignOut}
                            title="Sign Out"
                            leadingIcon="logout"
                        />
                    </Menu>
                </View>
                {loading ? (
                    <ActivityIndicator size="large" color="#6F4E37" style={styles.loadingIndicator} />
                ) : (
                    <>
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Open Shops</Text>
                            {openShops.length === 0 ? (
                                <Text style={styles.emptyText}>No open shops available at the moment.</Text>
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
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Closed Shops</Text>
                            {closedShops.length === 0 ? (
                                <Text style={styles.emptyText}>No closed shops at this time.</Text>
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
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#FFFFFF",
    },
    scrollViewContainer: {
        flex: 1,
        width: "100%",
    },
    scrollViewContent: {
        flexGrow: 1,
        paddingBottom: 40,
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 20,
        marginBottom: 20,
    },
    appTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#6F4E37',
        letterSpacing: 0.5,
    },
    menuButton: {
        margin: 0,
    },
    section: {
        paddingHorizontal: 24,
        marginBottom: 24,
        width: "100%",
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
        color: '#333333',
    },
    emptyText: {
        textAlign: 'center',
        color: '#555555',
        marginTop: 8,
    },
    loadingIndicator: {
        marginVertical: 40,
    },
});

export default DashboardScreen;
