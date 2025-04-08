import React, { useState } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type ItemCardProps = {
  name: string;
  description: string;
  price: number;
  image?: any;
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
  const [quantity, setQuantity] = useState(1);

  const handleCardPress = () => {
    setShowControls(!showControls);
  };

  const incrementQuantity = () => {
    setQuantity(prev => prev + 1);
    onAddToCart(quantity + 1);
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
      onAddToCart(quantity - 1);
    }
  };

  return (
    <TouchableOpacity 
      style={styles.card}
      onPress={handleCardPress}
      activeOpacity={0.9}
    >
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
              value={cartQuantity.toString()}
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
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
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
    marginLeft: 12,
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
});