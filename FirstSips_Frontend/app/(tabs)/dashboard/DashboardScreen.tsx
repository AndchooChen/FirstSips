import { View, Text, StyleSheet, FlatList } from "react-native";
import { useState, useEffect } from "react";
import { FIREBASE_AUTH, FIREBASE_DB } from "../../auth/FirebaseConfig";
import { collection, query, onSnapshot, doc, getDoc } from 'firebase/firestore';
import ShopCard from "../../components/ShopCard";
import { useRouter } from "expo-router";
import ScreenWideButton from "../../components/ScreenWideButton";

export default function DashboardScreen() {
    const [hasShop, setHasShop] = useState(false);
    const [shops, setShops] = useState([]);
    const [userShopId, setUserShopId] = useState(null);
    const router = useRouter();

    useEffect(() => {
        const checkUserShop = async () => {
            const userId = FIREBASE_AUTH.currentUser?.uid;
            if (!userId) return;

            const userDoc = await getDoc(doc(FIREBASE_DB, "users", userId));
            const shopId = userDoc.data()?.shopId;
            setHasShop(!!shopId);
            setUserShopId(shopId); // Store the user's shop ID
        };

        checkUserShop();
    }, []);

    useEffect(() => {
        const shopsQuery = query(collection(FIREBASE_DB, 'shops'));
        
        const unsubscribe = onSnapshot(shopsQuery, (snapshot) => {
            let shopsList = [];
            snapshot.forEach((doc) => {
                shopsList.push({ id: doc.id, ...doc.data() });
            });

            // Filter out the user's own shop
            const filteredShops = shopsList.filter(shop => shop.shopId !== userShopId);
            setShops(filteredShops);
        });

        return () => unsubscribe();
    }, [userShopId]); // Re-run when userShopId is set

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

    const renderItem = ({ item }) => (
        <ShopCard
            name={item.shopName}
            description={item.description}
            onPress={() => router.push({
                pathname: "../shop_front/ShopScreen",
                params: { 
                    shopId: item.shopId,
                    shopName: item.shopName,
                    shopDescription: item.description
                }
            })}
        />
    );

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
        width: '100%',
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
        width: '100%',
        alignItems: 'center',
        marginTop: 10,
    },
});