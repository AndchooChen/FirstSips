import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";

type ItemCardProps = {
  name: string;
  description: string;
  price: number;
  image?: any;
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
        source={image}
        style={styles.image}
        defaultSource={require('../assets/images/no_item_image.png')}
      />
      <View style={styles.content}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.description}>{description}</Text>
        <Text style={styles.price}>${price.toFixed(2)}</Text>
      </View>
    </TouchableOpacity>
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
    alignItems: 'center',
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
});