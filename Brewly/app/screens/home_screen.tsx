import { View, Text, StyleSheet, FlatList } from "react-native";
import ShopCard from "../components/shop_card";
import { useRouter } from "expo-router";

const shopData = [
    {
        id: 1,
        name: "Starbucks",
        description: "Coffee shop chain known for its signature roasts, light bites and WiFi availability.",
    },
    {
        id: 2,
        name: "Dunkin Donuts",
        description: "Long-running chain serving signature donuts, breakfast sandwiches and a variety of coffee drinks.",
    },
    {
        id: 3,
        name: "Kaldis Coffee",
        description: "Andrew's favorite coffee shop.",
    },
];

export default function Home() {
    const router = useRouter();

    const renderItem = ({ item }) => (
        <ShopCard
            name={item.name}
            description={item.description}
            onPress={() => router.push({
                pathname: "/screens/purchase_screen",
                params: { 
                    shopId: item.id,
                    shopName: item.name,
                    shopDescription: item.description
                }
            })}
        />
    )

    return (
        <View style={styles.background}>
            <Text style={styles.header}>FirstSips</Text>
            <FlatList
                data={shopData}
                renderItem={renderItem}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={styles.flatListContainer}
                showsVerticalScrollIndicator={false}
                horizontal={false} 
            />
        </View>
    )
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
    flatListContainer: {
        flexGrow: 1,
        width: '100%', // Add this to ensure full width
        alignItems: 'center',
    },
})