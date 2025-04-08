<<<<<<< HEAD
import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
=======
import React, { useState } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
>>>>>>> LoginRedesign

type ItemCardProps = {
  name: string;
  description: string;
  price: number;
  image?: any;
<<<<<<< HEAD
  onAddToCart: () => void;
};

export default function ItemCard({ 
  name, 
  description, 
  price, 
  image, 
  onAddToCart 
}: ItemCardProps) {
  return (
    <TouchableOpacity 
      style={styles.card}
      onPress={onAddToCart}
      activeOpacity={0.7}
    >
      <Image 
=======
  onAddToCart: (quantity: number) => void;
  cartQuantity?: number;
};

export default function ItemCard({
  name,
  description,
  price,
  image,
  onAddToCart,
  cartQuantity = 0
}: ItemCardProps) {
  const [showControls, setShowControls] = useState(false);

  const handleCardPress = () => {
    setShowControls(!showControls);
  };

  const incrementQuantity = () => {
    onAddToCart(1); // Add 1 to cart
  };

  const decrementQuantity = () => {
    onAddToCart(-1); // Remove 1 from cart
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handleCardPress}
      activeOpacity={0.9}
    >
      <Image
>>>>>>> LoginRedesign
        source={image}
        style={styles.image}
        defaultSource={require('../assets/images/no_item_image.png')}
      />
      <View style={styles.content}>
<<<<<<< HEAD
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.description}>{description}</Text>
        <Text style={styles.price}>${price.toFixed(2)}</Text>
=======
        <View style={styles.textContent}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.description}>{description}</Text>
          <Text style={styles.price}>${price.toFixed(2)}</Text>
        </View>

        {showControls && (
          <View style={styles.quantityContainer}>
            <TouchableOpacity
              onPress={decrementQuantity}
              style={styles.quantityButton}
            >
              <Ionicons name="remove" size={20} color="#6F4E37" />
            </TouchableOpacity>

            <TextInput
              style={styles.quantityInput}
              value={cartQuantity > 0 ? cartQuantity.toString() : '0'}
              editable={false}
              selectTextOnFocus={false}
            />

            <TouchableOpacity
              onPress={incrementQuantity}
              style={styles.quantityButton}
            >
              <Ionicons name="add" size={20} color="#6F4E37" />
            </TouchableOpacity>
          </View>
        )}
>>>>>>> LoginRedesign
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
<<<<<<< HEAD
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
=======
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
>>>>>>> LoginRedesign
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  content: {
    flex: 1,
<<<<<<< HEAD
    marginLeft: 10,
    justifyContent: 'space-between',
  },
=======
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  textContent: {
    flex: 1,
  },
>>>>>>> LoginRedesign
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  description: {
    fontSize: 14,
    color: '#666666',
    marginVertical: 4,
  },
  price: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6F4E37',
  },
<<<<<<< HEAD
=======
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    justifyContent: 'flex-end',
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  quantityInput: {
    width: 40,
    height: 32,
    textAlign: 'center',
    backgroundColor: '#F5F5F5',
    marginHorizontal: 8,
    borderRadius: 8,
    fontSize: 16,
    color: '#333333',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
>>>>>>> LoginRedesign
});