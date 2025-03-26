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
    };

    const handleLogout = async () => {
        try {
            await FIREBASE_AUTH.signOut();
            router.replace('../../(public)/LandingScreen');
        } catch (error) {
            console.log(error);
        }
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