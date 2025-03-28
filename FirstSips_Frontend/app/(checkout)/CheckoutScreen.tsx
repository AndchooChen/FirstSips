import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { TextInput, Switch, Divider } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { FIREBASE_DB } from "../auth/FirebaseConfig";
import { doc, getDoc } from 'firebase/firestore';
import PaymentComponent from '../components/PaymentComponent';

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

    const handlePaymentSuccess = (paymentIntent: any) => {
        console.log('Payment successful:', paymentIntent);
        router.push("../success");
    };

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
        <SafeAreaView style={styles.safeArea}>
            <ScrollView style={styles.container}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#6F4E37" />
                </TouchableOpacity>

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

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Order Summary</Text>
                    <View style={styles.summaryRow}>
                        <Text>Subtotal</Text>
                        <Text>${totals.subtotal.toFixed(2)}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text>Tax</Text>
                        <Text>${totals.tax.toFixed(2)}</Text>
                    </View>
                    {isDelivery && (
                        <View style={styles.summaryRow}>
                            <Text>Delivery Fee</Text>
                            <Text>${totals.deliveryFee.toFixed(2)}</Text>
                        </View>
                    )}
                    <Divider style={styles.divider} />
                    <View style={styles.summaryRow}>
                        <Text style={styles.totalText}>Total</Text>
                        <Text style={styles.totalAmount}>${totals.total.toFixed(2)}</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Payment</Text>
                    <PaymentComponent 
                        amount={Math.round(totals.total * 100)} // Convert to cents for Stripe
                        onSuccess={handlePaymentSuccess}
                    />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F5EDD8',
    },
    container: {
        flex: 1,
        backgroundColor: '#F5EDD8',
        padding: 16,
    },
    backButton: {
        marginBottom: 16,
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
    }
});

export default CheckoutScreen;