import React from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Image,
  FlatList,
  TouchableOpacity,
  TextInput,
} from "react-native";
import ItemCard from "../../components/item_card";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";

const mockItems = [
  {
    id: "1",
    name: "Cold brew",
    description: "This cold brew is made from beans from Columbia",
    price: 5.99,
    image: require("../../assets/images/cold_brew.jpg"),
  },
  {
    id: "2",
    name: "Cold brew",
    description: "This cold brew is made from beans from Columbia",
    price: 5.99,
    image: require("../../assets/images/cold_brew.jpg"),
  },
  {
    id: "3",
    name: "Cold brew",
    description: "This cold brew is made from beans from Columbia",
    price: 5.99,
    image: require("../../assets/images/cold_brew.jpg"),
  },
];

export default function PurchaseScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { shopId, shopName, shopDescription } = params;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#6F4E37" />
        </TouchableOpacity>
      </View>

      <View style={styles.profile}>
        <Image
          source={require("../../assets/images/stock_coffee.png")}
          style={styles.avatar}
        />
        <Text style={styles.storeName}>{shopName}</Text>
        <Text style={styles.description}>{shopDescription}</Text>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#aaa" />
        <TextInput
          placeholder="Search Store"
          style={styles.searchInput}
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.toggleContainer}>
        <TouchableOpacity style={styles.toggleButton}>
          <Text>Pickup</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toggleButton}>
          <Text>Delivery</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={mockItems}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ItemCard
            name={item.name}
            description={item.description}
            price={item.price}
            image={item.image}
          />
        )}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.checkoutContainer}>
        <TouchableOpacity style={styles.checkoutButton}>
          <Text style={styles.checkoutText}>Proceed to Checkout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    padding: 16,
  },
  profile: {
    alignItems: "center",
    backgroundColor: "#D3EDEB",
    paddingBottom: 24,
    paddingTop: 8,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: 8,
  },
  storeName: {
    fontSize: 20,
    fontWeight: "600",
    color: "#3E2F1C",
  },
  distance: {
    fontSize: 14,
    color: "#666",
  },
  searchContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 30,
    paddingHorizontal: 12,
    alignItems: "center",
    height: 40,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
  },
  toggleContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 12,
    gap: 16,
  },
  toggleButton: {
    backgroundColor: "#eee",
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: 20,
  },
  description: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    paddingHorizontal: 16,
    marginTop: 4,
  },
  checkoutContainer: {
    position: "absolute",
    bottom: 20,
    left: 16,
    right: 16,
  },
  checkoutButton: {
    backgroundColor: "#6F4E37",
    paddingVertical: 14,
    borderRadius: 20,
    alignItems: "center",
  },
  checkoutText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
