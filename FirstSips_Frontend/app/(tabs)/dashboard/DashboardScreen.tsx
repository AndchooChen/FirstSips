import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useAuth } from '../../auth/AuthContext';
import { shopService } from '../../services/shopService';
import { Shop } from '../../types/shop';
import ShopCard from '../../components/ShopCard';
import { useRouter } from 'expo-router';
import ScreenWideButton from "../../components/ScreenWideButton";

const DashboardScreen = () => {
    const [shops, setShops] = useState<Shop[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const { user } = useAuth();
    const router = useRouter();

    const fetchShops = async () => {
        try {
            const fetchedShops = await shopService.getAllShops();
            setShops(fetchedShops);
        } catch (error) {
            console.error("Error fetching shops:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchShops();
        }
    }, [user]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchShops();
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <Text>Loading shops...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                    />
                }
            >
                <Text style={styles.title}>Coffee Shops</Text>
                {shops.length === 0 ? (
                    <Text style={styles.noShops}>No coffee shops found</Text>
                ) : (
                    shops.map((shop) => (
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
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FEFAE0',
    },
    scrollContent: {
        padding: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#6F4E37',
        marginBottom: 16,
    },
    noShops: {
        textAlign: 'center',
        fontSize: 16,
        color: '#666',
        marginTop: 24,
    }
});

export default DashboardScreen;