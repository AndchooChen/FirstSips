import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { TextInput, Switch, Divider } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { FIREBASE_DB } from "../auth/FirebaseConfig";
import { doc, getDoc } from 'firebase/firestore';

type CartItem = {
    id: string;
    name: string;
    price: number;
    quantity: number;
    description?: string;
};

const CheckoutScreen = () => {
    const [isDelivery, setIsDelivery] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [pickupTime, setPickupTime] = useState('');
    const [deliveryAddress, setDeliveryAddress] = useState('');
    const [shopData, setShopData] = useState(null);
    const router = useRouter();
    const params = useLocalSearchParams();
    const { items, shopId } = params;

        // Parse cart items from params with type safety
        const cartItems: CartItem[] = useMemo(() => {
            try {
                return JSON.parse(items as string || '[]');
            } catch (error) {
                console.error('Error parsing cart items:', error);
                return [];
            }
        }, [items]);
    
        // Calculate totals with error handling
        const totals = useMemo(() => {
            const subtotal = cartItems.reduce((sum, item) => 
                sum + (item.price * item.quantity), 0);
            const tax = subtotal * 0.0825; // 8.25% tax
            const deliveryFee = isDelivery ? 5.99 : 0;
            const total = subtotal + tax + deliveryFee;
    
            return {
                subtotal,
                tax,
                deliveryFee,
                total
            };
        }, [cartItems, isDelivery]);
    
        // Add validation for order placement
        const handlePlaceOrder = () => {
            if (cartItems.length === 0) {
                alert('Please add items to your cart');
                return;
            }
    
            if (!phoneNumber) {
                alert('Please enter your phone number');
                return;
            }
    
            if (isDelivery && !deliveryAddress) {
                alert('Please enter your delivery address');
                return;
            }
    
            if (!pickupTime) {
                alert('Please select a pickup time');
                return;
            }
    
            // TODO: Implement order creation in Firebase
            console.log('Order placed:', {
                items: cartItems,
                isDelivery,
                phoneNumber,
                pickupTime,
                deliveryAddress,
                shopId,
                ...totals
            });
        };

    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.0825; // 8.25% tax
    const deliveryFee = isDelivery ? 5.99 : 0;
    const total = subtotal + tax + deliveryFee;

    useEffect(() => {
        const fetchShopData = async () => {
            const shopDoc = await getDoc(doc(FIREBASE_DB, "shops", shopId));
            if (shopDoc.exists()) {
                setShopData(shopDoc.data());
            }
        };
        fetchShopData();
    }, [shopId]);

    return (
        <ScrollView style={styles.container}>
            {/* Delivery/Pickup Toggle */}
            <View style={styles.section}>
                <View style={styles.toggleContainer}>
                    <Text style={styles.toggleText}>Delivery</Text>
                    <Switch
                        value={isDelivery}
                        onValueChange={setIsDelivery}
                        color="#D4A373"
                    />
                </View>
            </View>

            {/* Location Information */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                    {isDelivery ? 'Delivery Address' : 'Pickup Location'}
                </Text>
                {isDelivery ? (
                    <TextInput
                        label="Delivery Address"
                        value={deliveryAddress}
                        onChangeText={setDeliveryAddress}
                        mode="outlined"
                        style={styles.input}
                    />
                ) : (
                    <View style={styles.shopInfo}>
                        <Text style={styles.shopName}>{shopData?.shopName}</Text>
                        <Text style={styles.shopAddress}>{shopData?.streetAddress}</Text>
                        <Text style={styles.shopAddress}>
                            {shopData?.city}, {shopData?.state} {shopData?.zipCode}
                        </Text>
                        <Text style={styles.shopPhone}>📞 Contact: {shopData?.phoneNumber}</Text>
                    </View>
                )}
            </View>

            {/* Time Selection */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                    {isDelivery ? 'Delivery Time' : 'Pickup Time'}
                </Text>
                <TextInput
                    label="Preferred Time"
                    value={pickupTime}
                    onChangeText={setPickupTime}
                    mode="outlined"
                    style={styles.input}
                />
            </View>

            {/* Cart Items */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Order Details</Text>
                {cartItems.map((item, index) => (
                    <View key={index} style={styles.cartItem}>
                        <View style={styles.itemInfo}>
                            <Text style={styles.itemName}>{item.name}</Text>
                            <Text style={styles.itemQuantity}>x{item.quantity}</Text>
                        </View>
                        <Text style={styles.itemPrice}>${(item.price * item.quantity).toFixed(2)}</Text>
                    </View>
                ))}
            </View>

            {/* Order Summary */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Order Summary</Text>
                <View style={styles.summaryRow}>
                    <Text>Subtotal</Text>
                    <Text>${subtotal.toFixed(2)}</Text>
                </View>
                <View style={styles.summaryRow}>
                    <Text>Tax</Text>
                    <Text>${tax.toFixed(2)}</Text>
                </View>
                {isDelivery && (
                    <View style={styles.summaryRow}>
                        <Text>Delivery Fee</Text>
                        <Text>${deliveryFee.toFixed(2)}</Text>
                    </View>
                )}
                <Divider style={styles.divider} />
                <View style={styles.summaryRow}>
                    <Text style={styles.totalText}>Total</Text>
                    <Text style={styles.totalAmount}>${total.toFixed(2)}</Text>
                </View>
            </View>

            {/* Place Order Button */}
            <TouchableOpacity style={styles.placeOrderButton}>
                <Text style={styles.placeOrderText}>Place Order</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5EDD8',
        padding: 16,
    },
    section: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
        color: '#6F4E37',
    },
    toggleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    toggleText: {
        fontSize: 16,
        color: '#6F4E37',
    },
    input: {
        backgroundColor: '#FFFFFF',
        marginBottom: 8,
    },
    shopInfo: {
        marginVertical: 8,
    },
    shopName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6F4E37',
    },
    shopAddress: {
        color: '#666666',
        marginTop: 4,
    },
    shopPhone: {
        color: '#666666',
        marginTop: 8,
    },
    cartItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    itemInfo: {
        flex: 1,
    },
    itemName: {
        fontSize: 16,
        color: '#6F4E37',
    },
    itemQuantity: {
        color: '#666666',
        marginTop: 4,
    },
    itemPrice: {
        fontSize: 16,
        fontWeight: '500',
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    divider: {
        marginVertical: 8,
    },
    totalText: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    totalAmount: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#6F4E37',
    },
    placeOrderButton: {
        backgroundColor: '#D4A373',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginVertical: 16,
    },
    placeOrderText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default CheckoutScreen;