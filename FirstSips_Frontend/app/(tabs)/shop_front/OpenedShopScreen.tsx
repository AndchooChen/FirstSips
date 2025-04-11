import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Image, FlatList, TouchableOpacity, ScrollView } from "react-native";
import ItemCard from "../../components/ItemCard";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { supabase } from "../../utils/supabase";

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

const OpenedShopScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { shopId } = params;
  const [shopName, setShopName] = useState<string>("");
  const [shopDescription, setShopDescription] = useState<string>("");
  const [shopData, setShopData] = useState(null);
  const [items, setItems] = useState<ShopItem[]>([]);

  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const fetchShopData = async () => {
      try {
        const { data: shopData, error: shopError } = await supabase
          .from("shops")
          .select("*")
          .eq("id", shopId)
          .single();
  
        if (shopError) throw shopError;
  
        setShopData(shopData);
        setShopName(shopData.shop_name || "");
        setShopDescription(shopData.description || "");
      } catch (error) {
        console.error("Error fetching shop:", error);
      }
    };
  
    const fetchShopItems = async () => {
      try {
        const { data: itemsData, error: itemsError } = await supabase
          .from("items")
          .select("*")
          .eq("shop_id", shopId);
  
        if (itemsError) throw itemsError;
  
        const formattedItems: ShopItem[] = itemsData.map((item) => ({
          ...item,
          id: item.id,
        }));
  
        setItems(formattedItems);
      } catch (error) {
        console.error("Error fetching items:", error);
      }
    };
  
    fetchShopData();
    fetchShopItems();
  }, [shopId]);  

  // Add to cart function
  const handleAddToCart = (item: ShopItem, quantityChange: number) => {
    // If trying to remove from cart
    if (quantityChange < 0) {
      const existingItem = cartItems.find(cartItem => cartItem.id === item.id);
      if (existingItem) {
        // Calculate new quantity
        const newQuantity = existingItem.quantity + quantityChange;

        if (newQuantity <= 0) {
          // Remove item from cart if quantity is 0 or less
          setCartItems(cartItems.filter(cartItem => cartItem.id !== item.id));
        } else {
          // Update quantity
          setCartItems(cartItems.map(cartItem =>
            cartItem.id === item.id
              ? {...cartItem, quantity: newQuantity}
              : cartItem
          ));
        }
      }
      return;
    }

    // If trying to add to cart
    // Check if item is hidden
    if (item.quantity === -2) {
      alert('This item is not available for purchase.');
      return;
    }

    // Check if there's enough stock
    if (item.quantity !== -1 && item.quantity !== undefined) { // Not unlimited
      const existingItem = cartItems.find(cartItem => cartItem.id === item.id);
      const currentInCart = existingItem ? existingItem.quantity : 0;
      const newTotal = currentInCart + quantityChange;

      if (newTotal > item.quantity) {
        alert(`Sorry, only ${item.quantity} items available in stock. You already have ${currentInCart} in your cart.`);
        return;
      }
    }

    // If we get here, we can add to cart
    const existingItem = cartItems.find(cartItem => cartItem.id === item.id);

    if (existingItem) {
      // Update quantity
      setCartItems(cartItems.map(cartItem =>
        cartItem.id === item.id
          ? {...cartItem, quantity: existingItem.quantity + quantityChange}
          : cartItem
      ));
    } else {
      // Add new item to cart
      setCartItems([...cartItems, {...item, quantity: quantityChange}]);
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
    console.log(shopData?.owner_id);
    if (shopData?.owner_id) {
      router.push({
        pathname: "/(tabs)/shop_front/OwnerInfoScreen",
        params: { owner_id: shopData.owner_id }
      });
    }
  };

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
              shopData?.profile_image
                ? { uri: shopData.profile_image }
                : require("../../assets/images/no_shop_image.png")
            }
            style={styles.shopImage}
          />
          <Text style={styles.shopName}>{shopName}</Text>
          <Text style={styles.shopDescription}>{shopDescription}</Text>
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

export default OpenedShopScreen; 
