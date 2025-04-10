/*
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, SafeAreaView, Image, FlatList, TouchableOpacity, TextInput, } from "react-native";
import ItemCard from "../../components/ItemCard";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { FIREBASE_DB } from "../../auth/FirebaseConfig";
import { collection, query, onSnapshot, doc, getDoc } from 'firebase/firestore';

const ShopScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { shopId, shopName, shopDescription } = params;
  const [shopData, setShopData] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cartItems, setCartItems] = useState([]);

  useEffect(() => {
    // Fetch shop details
    const fetchShopData = async () => {
      try {
        const shopDoc = await getDoc(doc(FIREBASE_DB, "shops", shopId));
        if (shopDoc.exists()) {
          setShopData(shopDoc.data());
        }
      } catch (error) {
        console.error("Error fetching shop:", error);
      }
    };

    // Fetch shop items
    const itemsQuery = query(collection(FIREBASE_DB, `shops/${shopId}/items`));
    const unsubscribe = onSnapshot(itemsQuery, (snapshot) => {
      const itemsList = [];
      snapshot.forEach((doc) => {
        itemsList.push({ id: doc.id, ...doc.data() });
      });
      setItems(itemsList);
      setLoading(false);
    });

    fetchShopData();
    return () => unsubscribe();
  }, [shopId]);

  // Add to cart function
  const handleAddToCart = (item) => {
    const existingItem = cartItems.find(cartItem => cartItem.id === item.id);
    if (existingItem) {
      setCartItems(cartItems.map(cartItem => 
        cartItem.id === item.id 
          ? {...cartItem, quantity: cartItem.quantity + 1}
          : cartItem
      ));
    } else {
      setCartItems([...cartItems, {...item, quantity: 1}]);
    }
  };

  // Update handleCheckout to pass cart items
  const handleCheckout = () => {
    if (cartItems.length === 0) {
      alert('Please add items to your cart');
      return;
    }
    
    router.push({
      pathname: "../../(checkout)/CheckoutScreen",
      params: { 
        items: JSON.stringify(cartItems),
        shopId: shopId
      }
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#6F4E37" />
        </TouchableOpacity>
      </View>

      <View style={styles.profile}>
        <Image
          source={
            shopData?.profileImage 
              ? { uri: shopData.profileImage }
              : require("../../assets/images/no_shop_image.png")
          }
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
      data={items}
      renderItem={({ item }) => (
        <ItemCard
          name={item.name}
          description={item.description}
          price={item.price}
          image={item.images?.[0] 
            ? { uri: item.images[0] }
            : require("../../assets/images/no_item_image.png")}
          onAddToCart={() => handleAddToCart(item)}
        />
      )}
    />

      <View style={styles.checkoutContainer}>
        <TouchableOpacity 
          style={styles.checkoutButton}
          onPress={handleCheckout}  // Remove the arrow function
        >
          <Text style={styles.checkoutText}>
            Proceed to Checkout ({cartItems.length} items)
          </Text>
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

export default ShopScreen;
*/