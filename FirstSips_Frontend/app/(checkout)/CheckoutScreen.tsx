import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Button, ActivityIndicator } from 'react-native';
import { TextInput, Switch, Divider } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { FIREBASE_DB } from "../auth/FirebaseConfig";
import { doc, getDoc, setDoc } from 'firebase/firestore';
import DateTimePicker from '@react-native-community/datetimepicker';

import PaymentComponent from '../components/PaymentComponent';

type CartItem = {
    id: string;
    name: string;
    price: number;
    quantity: number;
    description?: string;
};

const CheckoutScreen = () => {
    const [customerInfo, setCustomerInfo] = useState({
        name: '',
        phone: '',
        pickupTime: new Date(),
        isDelivery: false,
        address: '',
    });
    const [isProcessing, setIsProcessing] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [shopData, setShopData] = useState(null);
    const router = useRouter();
    const params = useLocalSearchParams();
    const { items, shopId } = params;

    // Validation function
    const validateCustomerInfo = () => {
        if (!customerInfo.name.trim()) {
            alert('Error: Please enter your name');
            return false;
        }
        if (!customerInfo.phone.trim()) {
            alert('Error: Please enter your phone number');
            return false;
        }
        if (customerInfo.isDelivery && !customerInfo.address.trim()) {
            alert('Error: Please enter delivery address');
            return false;
        }
        return true;
    };

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
        if (!cartItems.length) {
            router.back();
            return null;
        }
    
        const subtotal = cartItems.reduce((sum, item) => 
            sum + (item.price * item.quantity), 0);
        const tax = subtotal * 0.0825;
        const deliveryFee = customerInfo.isDelivery ? 5.99 : 0;
        const total = Math.round((subtotal + tax + deliveryFee) * 100); // Convert to cents
    
        return {
            subtotal,
            tax,
            deliveryFee,
            total
        };
    }, [cartItems, customerInfo.isDelivery]);

    const handlePaymentSuccess = async (result: { orderId: string; clientSecret: string }) => {
        try {
            // Log success and order details
            console.log('Payment successful:', result);
    
            // Store order reference in user's history
            const userOrderRef = doc(FIREBASE_DB, 'users', 'CURRENT_USER_ID', 'orders', result.orderId);
            await setDoc(userOrderRef, { 
                createdAt: new Date(),
                status: 'pending'
            });
    
            // Navigate to success screen with order ID
            router.push({
                pathname: "/(checkout)/SuccessScreen",
                params: { orderId: result.orderId }
            });
        } catch (error) {
            console.error('Error handling payment success:', error);
            alert('Error', 'Order was placed but there was an error saving it.');
        }
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
        <ScrollView style={styles.container}>
            <View style={styles.section}>
                <TextInput
                    label="Name"
                    value={customerInfo.name}
                    onChangeText={(text) => setCustomerInfo(prev => ({ ...prev, name: text }))}
                    style={styles.input}
                />
                <TextInput
                    label="Phone Number"
                    value={customerInfo.phone}
                    onChangeText={(text) => setCustomerInfo(prev => ({ ...prev, phone: text }))}
                    keyboardType="phone-pad"
                    style={styles.input}
                />
                <Button onPress={() => setShowDatePicker(true)}>
                    Select Pickup Time
                </Button>
                {showDatePicker && (
                    <DateTimePicker
                        value={customerInfo.pickupTime}
                        mode="time"
                        is24Hour={false}
                        onChange={(event, selectedDate) => {
                            setShowDatePicker(false);
                            if (selectedDate) {
                                setCustomerInfo(prev => ({ ...prev, pickupTime: selectedDate }));
                            }
                        }}
                    />
                )}
                <View style={styles.deliverySection}>
                    <Text>Delivery</Text>
                    <Switch
                        value={customerInfo.isDelivery}
                        onValueChange={(value) => 
                            setCustomerInfo(prev => ({ ...prev, isDelivery: value }))
                        }
                    />
                </View>
                {customerInfo.isDelivery && (
                    <TextInput
                        label="Delivery Address"
                        value={customerInfo.address}
                        onChangeText={(text) => 
                            setCustomerInfo(prev => ({ ...prev, address: text }))
                        }
                        style={styles.input}
                    />
                )}
            </View>

            {/* Order Summary Section */}
            <View style={styles.section}>
                <Text>Order Total: ${(totals.total / 100).toFixed(2)}</Text>
            </View>

            {/* Payment Section */}
            {isProcessing && (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#6F4E37" />
                    <Text style={styles.loadingText}>Processing your order...</Text>
                </View>
            )}
            {!isProcessing && validateCustomerInfo() && totals && (
                <PaymentComponent
                    amount={totals.total}
                    onSuccess={handlePaymentSuccess}
                    cartItems={cartItems}
                    shopId={shopId}
                    customerInfo={customerInfo}
                    setIsProcessing={setIsProcessing} // Add this prop to control loading state
                />
            )}
        </ScrollView>
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
    deliverySection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginVertical: 12,
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
    loadingContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255,255,255,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    loadingText: {
        marginTop: 10,
        color: '#6F4E37',
        fontSize: 16,
    }
});

export default CheckoutScreen;