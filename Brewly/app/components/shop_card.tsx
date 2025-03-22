import { View, Text, StyleSheet, Image } from "react-native";

type CustomShopProp = {
    name: string;
    description?: string;
    image?: string;
}

const ShopCard: React.FC<CustomShopProp> = ({
    name,
    description = " ",
    image = "../assets/images/stock_coffee.png",
}) => {
    return (
        <View style={styles.background}>
            <View style={styles.topContainer}>
                <Image
                    source={require(image)}
                    style={styles.image}
                />
            </View>
            <View style={styles.bottomContainer}>
                <Text>{name}</Text>
                <Text>{description}</Text>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    background: {
        backgroundColor: "#654942",
        flex: 1,
        borderRadius: 20,
    },
    topContainer: {
        borderTopEndRadius: 20,

    },
    bottomContainer: {
        borderBottomEndRadius: 20,
    },
    image: {
        height: "100%",
        resizeMode: "contain",
    }
})