import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';

interface Shop {
    shopName: string;
    profileImage?: string;
    isOpen: boolean;
    description?: string;
}

interface ShopCardProps {
    shop: Shop;
    onPress: () => void;
}

const ShopCard = ({ shop, onPress }: ShopCardProps) => {
    return (
        <TouchableOpacity style={styles.card} onPress={onPress}>
            <View style={styles.imageContainer}>
                <Image
                    source={
                        shop.profileImage
                            ? { uri: shop.profileImage }
                            : require('../assets/images/stock_coffee.png')
                    }
                    style={styles.image}
                />
                <View style={[
                    styles.statusIndicator,
                    { backgroundColor: shop.isOpen ? '#4CAF50' : '#F44336' }
                ]} />
            </View>
            <View style={styles.contentContainer}>
                <Text style={styles.title}>{shop.shopName}</Text>
                {shop.description && (
                    <Text style={styles.description} numberOfLines={2}>
                        {shop.description}
                    </Text>
                )}
                <Text style={[
                    styles.status,
                    { color: shop.isOpen ? '#4CAF50' : '#F44336' }
                ]}>
                    {shop.isOpen ? 'Open' : 'Closed'}
                </Text>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        marginVertical: 8,
        marginHorizontal: 8,
        flexDirection: 'column',
        padding: 0,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        width: '95%',
        alignSelf: 'center',
        overflow: 'hidden',
    },
    imageContainer: {
        position: 'relative',
        width: '100%',
        marginBottom: 0,
    },
    image: {
        width: '100%',
        height: 180,
        resizeMode: 'cover',
    },
    statusIndicator: {
        position: 'absolute',
        bottom: -4,
        right: -4,
        width: 12,
        height: 12,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    contentContainer: {
        width: '100%',
        padding: 12,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#6F4E37',
        marginBottom: 4,
    },
    description: {
        fontSize: 14,
        color: '#666666',
        marginBottom: 4,
    },
    status: {
        fontSize: 14,
        fontWeight: '500',
    },
});

export default ShopCard;
