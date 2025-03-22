import { View, Text, StyleSheet, Image, TouchableOpacity, ImageSourcePropType } from "react-native";

type CustomShopProp = {
    name: string;
    onPress: () => void
    description?: string;
    image?: ImageSourcePropType;
}

const ShopCard: React.FC<CustomShopProp> = ({
    name,
    onPress,
    description,
    image,
}) => {
    const defaultImage = require("../assets/images/stock_coffee.png");

    return (
        <TouchableOpacity
            style={styles.container}
            activeOpacity={0.8}
            onPress={onPress}
        >
            <View style={styles.imageContainer}>
                <Image
                    source={image || defaultImage}
                    style={styles.image}
                />
            </View>
            <View style={styles.textContainer}>
                <Text style={styles.title}>{name}</Text>
                <Text style={styles.description}>{description}</Text>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: "#654942",
        borderRadius: 20,
        overflow: 'hidden',
        height: 280,
        width: 360,
        marginBottom: 15,
    },
    imageContainer: {
        height: '70%',
        width: '100%',
    },
    image: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    textContainer: {
        padding: 12,
        height: '30%',
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    description: {
        fontSize: 14,
        color: '#FFFFFF',
        opacity: 0.8,
    },
});

export default ShopCard;