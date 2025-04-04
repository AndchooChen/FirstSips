import React, { useState } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type ItemCardProps = {
  name: string;
  description: string;
  price: number;
  image?: any;
  onAddToCart: (quantity: number) => void;
};

export default function ItemCard({ 
  name, 
  description, 
  price, 
  image, 
  onAddToCart 
}: ItemCardProps) {
  const [quantity, setQuantity] = useState(1);

  const handleQuantityChange = (text: string) => {
    const num = parseInt(text);
    if (!isNaN(num) && num > 0) {
      setQuantity(num);
    }
  };

  const incrementQuantity = () => {
    setQuantity(prev => prev + 1);
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  return (
    <View style={styles.card}>
      <Image 
        source={image}
        style={styles.image}
        defaultSource={require('../assets/images/no_item_image.png')}
      />
      <View style={styles.content}>
        <View style={styles.textContent}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.description}>{description}</Text>
          <Text style={styles.price}>${price.toFixed(2)}</Text>
        </View>
        
        <View style={styles.quantityContainer}>
          <TouchableOpacity 
            onPress={decrementQuantity}
            style={styles.quantityButton}
          >
            <Ionicons name="remove" size={20} color="#6F4E37" />
          </TouchableOpacity>
          
          <TextInput
            style={styles.quantityInput}
            value={quantity.toString()}
            onChangeText={handleQuantityChange}
            keyboardType="number-pad"
            selectTextOnFocus
          />
          
          <TouchableOpacity 
            onPress={incrementQuantity}
            style={styles.quantityButton}
          >
            <Ionicons name="add" size={20} color="#6F4E37" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => onAddToCart(quantity)}
          >
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  content: {
    flex: 1,
    marginLeft: 10,
    justifyContent: 'space-between',
  },
  textContent: {
    flex: 1,
  },
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
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  quantityButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityInput: {
    width: 40,
    height: 30,
    textAlign: 'center',
    backgroundColor: '#F0F0F0',
    marginHorizontal: 8,
    borderRadius: 4,
    fontSize: 16,
  },
  addButton: {
    backgroundColor: '#6F4E37',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});