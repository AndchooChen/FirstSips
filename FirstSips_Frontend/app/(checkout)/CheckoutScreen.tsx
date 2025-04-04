import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { TextInput, Switch, Divider, ActivityIndicator, Button } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { FIREBASE_AUTH, FIREBASE_DB } from "../auth/FirebaseConfig";
import { doc, getDoc, setDoc, collection, addDoc } from 'firebase/firestore';
import { useStripe } from '@stripe/stripe-react-native';
import { API_URL } from '../config/api';

interface ShopData {
    shopName: string;
    streetAddress: string;
    city: string;
    state: string;
    zipCode: string;
    ownerId: string;
    phoneNumber?: string;
    [key: string]: any;
}

interface CartItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
    description?: string;
}

const CheckoutScreen = () => {
    const { initPaymentSheet, presentPaymentSheet } = useStripe();
    const [customerInfo, setCustomerInfo] = useState({
        name: '',
        phoneNumber: '',
        userId: '',
    });
    const [isDelivery, setIsDelivery] = useState(false);
    const [pickupTime, setPickupTime] = useState('');
    const [deliveryAddress, setDeliveryAddress] = useState('');
    const [shopData, setShopData] = useState<ShopData | null>(null);
    const [loading, setLoading] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
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

    const fetchPaymentSheetParams = async () => {
        const userId = FIREBASE_AUTH.currentUser?.uid;
        if (!userId) {
            throw new Error('User not authenticated');
        }

        console.log("Fetching payment sheet params");
        const response = await fetch(`${API_URL}/payments/payment-sheet`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                amount: Math.round(totals.total * 100),
                currency: 'usd',
                customerId: userId,
                shopId
            }),
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Payment sheet error:', {
                status: response.status,
                statusText: response.statusText,
                body: errorText
            });
            throw new Error(`Failed to fetch payment sheet: ${errorText}`);
        }

        const data = await response.json();
        console.log("Payment sheet params:", data);

        return {
            paymentIntent: data.paymentIntent,
            ephemeralKey: data.ephemeralKey,
            customer: data.customer,
        };
    };

    const initializePaymentSheet = async () => {
        try {
            console.log("Initializing payment sheet");
            const {
                paymentIntent,
                ephemeralKey,
                customer,
            } = await fetchPaymentSheetParams();
            console.log("Payment sheet params fetched");
            const { error } = await initPaymentSheet({
                merchantDisplayName: "FirstSips",
                customerId: customer,
                customerEphemeralKeySecret: ephemeralKey,
                paymentIntentClientSecret: paymentIntent,
                allowsDelayedPaymentMethods: true,
                returnURL: 'firstsips://stripe-redirect',
                defaultBillingDetails: {
                    name: customerInfo?.name,
                    phone: customerInfo?.phoneNumber,
                }
            });

            if (error) {
                Alert.alert('Error', error.message);
            } else {
                setLoading(true);
            }
        } catch (error) {
            console.error('Error initializing payment sheet:', error);
            Alert.alert('Error', 'Unable to initialize payment');
        }
    };

    const handlePayment = async () => {
        if (!loading) return;

        try {
            setIsProcessing(true);
            const { error } = await presentPaymentSheet();

            if (error) {
                Alert.alert('Error', error.message);
                return;
            }

            // Create order in Firestore
            const orderRef = collection(FIREBASE_DB, 'orders');
            const newOrder = {
                shopId,
                customerId: customerInfo.userId,
                customerName: customerInfo.name,
                customerPhone: customerInfo.phoneNumber,
                items: cartItems,
                totalAmount: totals.total.toFixed(2),
                status: 'pending',
                createdAt: new Date(),
                updatedAt: new Date(),
                pickupTime: pickupTime,
            };

            const docRef = await addDoc(orderRef, newOrder);

            // Store order references
            await Promise.all([
                setDoc(doc(FIREBASE_DB, 'users', customerInfo.userId, 'orders', docRef.id), {
                    customerId: customerInfo.userId,
                    shopId: shopId,
                    createdAt: new Date(),
                }),
                setDoc(doc(FIREBASE_DB, 'shops', shopId, 'orders', docRef.id), {
                    customerId: customerInfo.userId,
                    shopId: shopId,
                    createdAt: new Date(),
                })
            ]);

            Alert.alert('Success', 'Your order has been placed!');
            router.push({
                pathname: "/(checkout)/SuccessScreen",
                params: { orderId: docRef.id }
            });
        } catch (error) {
            console.error('Payment Error:', error);
            Alert.alert('Error', 'Unable to process payment');
        } finally {
            setIsProcessing(false);
        }
    };

    useEffect(() => {
        initializePaymentSheet();
    }, [totals.total, shopId, customerInfo]);

    // Fetch user data
    useEffect(() => {
        const fetchUserData = async () => {
            console.log("Fetching user data");
            const userId = FIREBASE_AUTH.currentUser?.uid; // Get the current user ID from Firebase Auth
            if (!userId) {
                alert('User not authenticated');
                setLoading(false);
                return;
            }

            // Reference to the user document in Firestore
            const userDocRef = doc(FIREBASE_DB, 'users', userId);

            try {
                // Fetch the user document
                const userDocSnap = await getDoc(userDocRef);

                if (userDocSnap.exists()) {
                    const userData = userDocSnap.data();

                    // Concatenate firstName and lastName to get full name
                    const name = `${userData.firstName || ''} ${userData.lastName || ''}`.trim();
                    const phoneNumber = userData.phoneNumber || '';

                    // Update state with the fetched data
                    setCustomerInfo({
                        name,
                        phoneNumber,
                        userId,
                    });
                } else {
                    alert('User data not found');
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
                alert('Failed to fetch user data');
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, []);

    // Fetch shop data
    useEffect(() => {
        const fetchShopData = async () => {
            if (!shopId) return;

            try {
                const shopDoc = await getDoc(doc(FIREBASE_DB, 'shops', shopId as string));

                if (shopDoc.exists()) {
                    const shopDataFromDB = shopDoc.data() as ShopData;
                    
                    // Fetch owner's data to get phone number
                    const ownerDoc = await getDoc(doc(FIREBASE_DB, 'users', shopDataFromDB.ownerId));
                    if (ownerDoc.exists()) {
                        const ownerData = ownerDoc.data();
                        setShopData({
                            ...shopDataFromDB,
                            phoneNumber: ownerData.phoneNumber || 'No phone number available'
                        });
                    } else {
                        setShopData(shopDataFromDB);
                    }
                } else {
                    alert('Shop data not found');
                }
            } catch (error) {
                console.error('Error fetching shop data:', error);
                alert('Failed to fetch shop data');
            }
        };

        fetchShopData();
    }, [shopId]);

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView style={styles.container}>
                {/* Back Arrow */}
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#6F4E37" />
                </TouchableOpacity>

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

                {/* Payment Section */}
                {isProcessing && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#6F4E37" />
                        <Text style={styles.loadingText}>Processing your order...</Text>
                    </View>
                )}
                {!isProcessing && (
                    <Button
                        mode="contained"
                        onPress={handlePayment}
                        disabled={!loading}
                        loading={isProcessing}
                        style={styles.payButton}
                    >
                        Pay ${totals.total.toFixed(2)}
                    </Button>
                )}
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
    },
    payButton: {
        backgroundColor: '#D4A373',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginVertical: 16,
    },
});

export default CheckoutScreen;