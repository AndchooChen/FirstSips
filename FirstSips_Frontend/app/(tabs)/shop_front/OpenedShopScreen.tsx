import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, SafeAreaView, Image, FlatList, TouchableOpacity, TextInput, ScrollView } from "react-native";
import ItemCard from "../../components/ItemCard";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { FIREBASE_DB } from "../../auth/FirebaseConfig";
import { collection, query, onSnapshot, doc, getDoc, DocumentData } from 'firebase/firestore';

interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  images?: string[];
  quantity?: number;
}

interface CartItem extends ShopItem {
  quantity: number;
}

interface Shop {
  id: string;
  name: string;
  description: string;
  price: number;
  images?: string[];
  quantity?: number;
  ownerId?: string;
}

const ShopScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { shopId, shopName, shopDescription } = params;
  const [shopData, setShopData] = useState<DocumentData | null>(null);
  const [items, setItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    // Fetch shop details
    const fetchShopData = async () => {
      try {
        const shopDoc = await getDoc(doc(FIREBASE_DB, "shops", shopId as string));
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
      const itemsList: ShopItem[] = [];
      snapshot.forEach((doc) => {
        itemsList.push({ id: doc.id, ...doc.data() } as ShopItem);
      });
      setItems(itemsList);
      setLoading(false);
    });

    fetchShopData();
    return () => unsubscribe();
  }, [shopId]);

  // Add to cart function
  const handleAddToCart = (item: ShopItem, quantity: number) => {
    const existingItem = cartItems.find(cartItem => cartItem.id === item.id);
    if (existingItem) {
      setCartItems(cartItems.map(cartItem => 
        cartItem.id === item.id 
          ? {...cartItem, quantity: cartItem.quantity + quantity}
          : cartItem
      ));
    } else {
      setCartItems([...cartItems, {...item, quantity}]);
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

  const handleOwnerInfo = () => {
    if (shopData?.ownerId) {
      router.push({
        pathname: "/(tabs)/shop_front/OwnerInfoScreen",
        params: { ownerId: shopData.ownerId }
      });
    }
  };

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#6F4E37" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{shopName}</Text>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleOwnerInfo}
        >
          <Ionicons name="information-circle" size={24} color="#6F4E37" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.shopInfo}>
          <Image
            source={
              shopData?.profileImage 
                ? { uri: shopData.profileImage }
                : require("../../assets/images/no_shop_image.png")
            }
            style={styles.shopImage}
          />
          <Text style={styles.shopName}>{shopName}</Text>
          <Text style={styles.shopDescription}>{shopDescription}</Text>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            placeholder="Search items..."
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.deliveryOptions}>
          <TouchableOpacity style={[styles.deliveryOption, styles.activeOption]}>
            <Text style={styles.optionText}>Pickup</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deliveryOption}>
            <Text style={styles.optionText}>Delivery</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={filteredItems}
          renderItem={({ item }) => (
            <ItemCard
              name={item.name}
              description={item.description}
              price={item.price}
              image={item.images?.[0] 
                ? { uri: item.images[0] }
                : require("../../assets/images/no_item_image.png")}
              onAddToCart={(quantity) => handleAddToCart(item, quantity)}
              cartQuantity={cartItems.find(cartItem => cartItem.id === item.id)?.quantity || 0}
            />
          )}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          contentContainerStyle={styles.itemsList}
        />
      </ScrollView>

      {cartItems.length > 0 && (
        <View style={styles.checkoutContainer}>
          <TouchableOpacity 
            style={styles.checkoutButton}
            onPress={handleCheckout}
          >
            <Text style={styles.checkoutText}>
              Checkout ({cartItems.reduce((total, item) => total + item.quantity, 0)} items)
            </Text>
            <Text style={styles.checkoutPrice}>
              ${cartItems.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2)}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    marginTop: 40,
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6F4E37',
    flex: 1,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  shopInfo: {
    alignItems: "center",
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  shopImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
  },
  shopName: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 4,
  },
  shopDescription: {
    fontSize: 14,
    color: "#666666",
    textAlign: "center",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    margin: 16,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: "#333333",
  },
  deliveryOptions: {
    flexDirection: "row",
    justifyContent: "center",
    marginHorizontal: 16,
    marginBottom: 16,
  },
  deliveryOption: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 8,
    backgroundColor: "#F5F5F5",
  },
  activeOption: {
    backgroundColor: "#6F4E37",
  },
  optionText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666666",
  },
  itemsList: {
    paddingBottom: 100,
  },
  checkoutContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  checkoutButton: {
    backgroundColor: "#6F4E37",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
  },
  checkoutText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  checkoutPrice: {
    color: "#FFFFFF",
    fontSize: 14,
    marginTop: 4,
  },
});

export default ShopScreen;