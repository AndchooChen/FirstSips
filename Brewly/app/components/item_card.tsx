import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";

type ItemCardProps = {
  name: string;
  description: string;
  price: number;
  image?: any;
};

export default function ItemCard({ name, description, price, image }: ItemCardProps) {
  return (
    <View style={styles.card}>
      {image && (
        <Image source={image} style={styles.image} />
      )}
      <View style={styles.details}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.description}>{description}</Text>
        <Text style={styles.price}>${price.toFixed(2)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    alignItems: "center",
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 16,
    resizeMode: "cover",
  },
  details: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
    color: "#333",
  },
  description: {
    fontSize: 14,
    color: "#666",
    marginBottom: 6,
  },
  price: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#6F4E37",
  },
});
