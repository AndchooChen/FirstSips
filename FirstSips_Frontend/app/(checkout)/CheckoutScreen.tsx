import React, { useState, useEffect, useMemo } from 'react';
<<<<<<< HEAD
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { TextInput, Switch, Divider, ActivityIndicator } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { FIREBASE_AUTH, FIREBASE_DB } from "../auth/FirebaseConfig";
import { doc, getDoc, setDoc } from 'firebase/firestore';
import PaymentComponent from '../components/PaymentComponent';

type CartItem = {
=======
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Alert, Platform, Modal, Image } from 'react-native';
import { Divider, ActivityIndicator, Button } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { FIREBASE_AUTH, FIREBASE_DB } from "../auth/FirebaseConfig";
import { doc, getDoc, setDoc, collection, addDoc, updateDoc } from 'firebase/firestore';
import { useStripe } from '@stripe/stripe-react-native';
import { API_URL } from '../config/api';
import DateTimePicker from '@react-native-community/datetimepicker';

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
>>>>>>> LoginRedesign
    id: string;
    name: string;
    price: number;
    quantity: number;
    description?: string;
<<<<<<< HEAD
};

const CheckoutScreen = () => {
    const [customerInfo, setCustomerInfo] = useState({
        name: '',
        phoneNumber: '',
        userId: '',
    });
    const [isDelivery, setIsDelivery] = useState(false);
    const [pickupTime, setPickupTime] = useState('');
    const [deliveryAddress, setDeliveryAddress] = useState('');
    const [shopData, setShopData] = useState(null);
<<<<<<< HEAD
=======
    images?: string[];
}

const CheckoutScreen = () => {
    const { initPaymentSheet, presentPaymentSheet } = useStripe();
    const [customerInfo, setCustomerInfo] = useState({
        name: '',
        phoneNumber: '',
        userId: '',
    });
    const [pickupTime, setPickupTime] = useState('');
    const [shopData, setShopData] = useState<ShopData | null>(null);
    const [loading, setLoading] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
>>>>>>> LoginRedesign
=======
    const [loading, setLoading] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
>>>>>>> 68fb1e5fa391f1bdac2f665bb27bc781ec148f7d
    const router = useRouter();
    const params = useLocalSearchParams();
    const { items, shopId } = params;

<<<<<<< HEAD
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
    

    const handlePaymentSuccess = async (result: { orderId: string; clientSecret: string }) => {
        try {
            // Log success and order details
            console.log('Payment successful:', result);
    
            // Store order reference in customers's history
            const userOrderRef = doc(FIREBASE_DB, 'users', customerInfo.userId, 'orders', result.orderId);
            await setDoc(userOrderRef, { 
                customerId: customerInfo.userId,
                shopId: shopId,
                createdAt: new Date(),
            });

            // Store order reference in shop's history
            console.log(shopId)
            const shopOrderRef = doc(FIREBASE_DB, 'shops', shopId, 'orders', result.orderId);
            await setDoc(shopOrderRef, {
                customerId: customerInfo.userId,
                shopId: shopId,
                createdAt: new Date(),
            });
    
            // Navigate to success screen with order ID
            router.push({
                pathname: "/(checkout)/SuccessScreen",
                params: { orderId: result.orderId }
            });
        } catch (error) {
            console.error('Error handling payment success:', error);
            alert('Error: Order was placed but there was an error saving it.');
        }
    };

    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.0825; // 8.25% tax
    const deliveryFee = isDelivery ? 5.99 : 0;
    const total = subtotal + tax + deliveryFee;

    // Fetch user data
    useEffect(() => {
        const fetchUserData = async () => {
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
<<<<<<< HEAD
=======
    // Time picker state
    const [date, setDate] = useState(new Date());
    const [showTimePicker, setShowTimePicker] = useState(false);

    // Function to check item availability
    const checkItemAvailability = async (itemId: string, requestedQuantity: number) => {
        try {
            // Get the current item data from Firestore
            const itemDoc = await getDoc(doc(FIREBASE_DB, `shops/${shopId}/items/${itemId}`));
            if (!itemDoc.exists()) {
                return { available: false, message: 'Item no longer exists' };
            }

            const itemData = itemDoc.data();

            // Check if item is hidden
            if (itemData.quantity === -2) {
                return { available: false, message: 'This item is not available for purchase.' };
            }

            // If unlimited stock
            if (itemData.quantity === -1) {
                return { available: true };
            }

            // Check if enough stock
            if (requestedQuantity > itemData.quantity) {
                return {
                    available: false,
                    message: `Sorry, only ${itemData.quantity} items available in stock.`
                };
            }

            return { available: true };
        } catch (error) {
            console.error('Error checking item availability:', error);
            return { available: false, message: 'Error checking availability' };
        }
    };

    // Function to update cart items
    const updateCartItem = async (itemId: string, changeType: 'increase' | 'decrease') => {
        if (changeType === 'increase') {
            // Check availability before increasing
            const itemIndex = cartItems.findIndex(i => i.id === itemId);
            const currentQuantity = cartItems[itemIndex].quantity;
            const result = await checkItemAvailability(itemId, currentQuantity + 1);

            if (!result.available) {
                alert(result.message);
                return;
            }
        }

        setCartItems(prevItems => {
            const updatedItems = [...prevItems];
            const itemIndex = updatedItems.findIndex(i => i.id === itemId);

            if (changeType === 'increase') {
                // Increase quantity
                updatedItems[itemIndex] = {
                    ...updatedItems[itemIndex],
                    quantity: updatedItems[itemIndex].quantity + 1
                };
            } else if (changeType === 'decrease') {
                // Decrease quantity or remove
                if (updatedItems[itemIndex].quantity > 1) {
                    updatedItems[itemIndex] = {
                        ...updatedItems[itemIndex],
                        quantity: updatedItems[itemIndex].quantity - 1
                    };
                } else {
                    // Remove item if quantity would be 0
                    updatedItems.splice(itemIndex, 1);
                }
            }

            return updatedItems;
        });
    };

    // Parse cart items from params with type safety
    useEffect(() => {
        try {
            const parsedItems = JSON.parse(items as string || '[]');
            setCartItems(parsedItems);
        } catch (error) {
            console.error('Error parsing cart items:', error);
            setCartItems([]);
        }
    }, [items]);

    // Calculate totals with error handling
    const totals = useMemo(() => {
        const subtotal = cartItems.reduce((sum, item) =>
            sum + (item.price * item.quantity), 0);
        const tax = subtotal * 0.0825; // 8.25% tax
        const total = subtotal + tax;

        return {
            subtotal,
            tax,
            total
        };
    }, [cartItems]);

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

            // Check availability for all items before proceeding
            for (const item of cartItems) {
                const result = await checkItemAvailability(item.id, item.quantity);
                if (!result.available) {
                    Alert.alert('Inventory Issue', result.message);
                    setIsProcessing(false);
                    return;
                }
            }

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

            // Store order references for user
            await setDoc(doc(FIREBASE_DB, 'users', customerInfo.userId, 'orders', docRef.id), {
                customerId: customerInfo.userId,
                shopId: shopId as string,
                createdAt: new Date(),
            });

            // Store order references for shop
            await setDoc(doc(FIREBASE_DB, 'shops', shopId as string, 'orders', docRef.id), {
                customerId: customerInfo.userId,
                shopId: shopId as string,
                createdAt: new Date(),
            });

            // Update item quantities in Firestore
            for (const item of cartItems) {
                const itemRef = doc(FIREBASE_DB, `shops/${shopId}/items/${item.id}`);
                const itemDoc = await getDoc(itemRef);

                if (itemDoc.exists()) {
                    const itemData = itemDoc.data();

                    // Only update if the item has a limited quantity (not unlimited or hidden)
                    if (itemData.quantity !== -1 && itemData.quantity !== -2) {
                        const newQuantity = itemData.quantity - item.quantity;
                        await updateDoc(itemRef, { quantity: newQuantity });
                    }
                }
            }

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
=======
>>>>>>> 68fb1e5fa391f1bdac2f665bb27bc781ec148f7d

        fetchUserData();
    }, []);

    // Fetch shop data
    useEffect(() => {
        const fetchShopData = async () => {
<<<<<<< HEAD
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
=======
            if (!shopId) return; // If no shopId, don't fetch

            try {
                const shopDoc = await getDoc(doc(FIREBASE_DB, 'shops', shopId));

                if (shopDoc.exists()) {
                    setShopData(shopDoc.data());
>>>>>>> 68fb1e5fa391f1bdac2f665bb27bc781ec148f7d
                } else {
                    alert('Shop data not found');
                }
            } catch (error) {
                console.error('Error fetching shop data:', error);
                alert('Failed to fetch shop data');
            }
        };

<<<<<<< HEAD
>>>>>>> LoginRedesign
=======
>>>>>>> 68fb1e5fa391f1bdac2f665bb27bc781ec148f7d
        fetchShopData();
    }, [shopId]); // Runs every time the shopId changes

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView style={styles.container}>
                {/* Back Arrow */}
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#6F4E37" />
                </TouchableOpacity>

<<<<<<< HEAD
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

=======
>>>>>>> LoginRedesign
                {/* Cart Items */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Order Details</Text>
                    {cartItems.map((item, index) => (
                        <View key={index} style={styles.cartItem}>
<<<<<<< HEAD
                            <View style={styles.itemInfo}>
                                <Text style={styles.itemName}>{item.name}</Text>
                                <Text style={styles.itemQuantity}>x{item.quantity}</Text>
                            </View>
                            <Text style={styles.itemPrice}>${(item.price * item.quantity).toFixed(2)}</Text>
=======
                            <Image
                                source={item.images?.[0] ? { uri: item.images[0] } : require('../assets/images/no_item_image.png')}
                                style={styles.itemImage}
                            />
                            <View style={styles.itemInfo}>
                                <Text style={styles.itemName}>{item.name}</Text>
                                <Text style={styles.itemPrice}>${(item.price).toFixed(2)}</Text>
                                <View style={styles.quantityContainer}>
                                    <TouchableOpacity
                                        style={styles.quantityButton}
                                        onPress={() => updateCartItem(item.id, 'decrease')}
                                    >
                                        <Ionicons name="remove" size={20} color="#6F4E37" />
                                    </TouchableOpacity>

                                    <Text style={styles.quantityText}>{item.quantity}</Text>

                                    <TouchableOpacity
                                        style={styles.quantityButton}
                                        onPress={() => updateCartItem(item.id, 'increase')}
                                    >
                                        <Ionicons name="add" size={20} color="#6F4E37" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                            <Text style={styles.itemTotalPrice}>${(item.price * item.quantity).toFixed(2)}</Text>
>>>>>>> LoginRedesign
                        </View>
                    ))}
                </View>

<<<<<<< HEAD
=======
                {/* Location Information */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Pickup Location</Text>
                    <View style={styles.shopInfo}>
                        <Text style={styles.shopName}>{shopData?.shopName}</Text>
                        <Text style={styles.shopAddress}>{shopData?.streetAddress}</Text>
                        <Text style={styles.shopAddress}>
                            {shopData?.city}, {shopData?.state} {shopData?.zipCode}
                        </Text>
                        <Text style={styles.shopPhone}>📞 Contact: {shopData?.phoneNumber}</Text>
                    </View>
                </View>

                {/* Time Selection */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Pickup Time</Text>
                    <TouchableOpacity
                        style={styles.timePickerButton}
                        onPress={() => setShowTimePicker(true)}
                    >
                        <Text style={styles.timePickerButtonText}>
                            {pickupTime || 'Select Pickup Time'}
                        </Text>
                        <Ionicons name="time-outline" size={24} color="#6F4E37" />
                    </TouchableOpacity>

                    {showTimePicker && (
                        Platform.OS === 'ios' ? (
                            <Modal
                                transparent={true}
                                visible={showTimePicker}
                                animationType="slide"
                            >
                                <View style={styles.modalContainer}>
                                    <View style={styles.modalContent}>
                                        <Text style={styles.modalTitle}>Select Pickup Time</Text>
                                        <DateTimePicker
                                            value={date}
                                            mode="time"
                                            display="spinner"
                                            minuteInterval={5}
                                            onChange={(_, selectedDate) => {
                                                if (selectedDate) {
                                                    setDate(selectedDate);
                                                    const hours = selectedDate.getHours();
                                                    const minutes = selectedDate.getMinutes();
                                                    const ampm = hours >= 12 ? 'PM' : 'AM';
                                                    const formattedHours = hours % 12 || 12;
                                                    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
                                                    setPickupTime(`${formattedHours}:${formattedMinutes} ${ampm}`);
                                                }
                                            }}
                                        />
                                        <Button
                                            mode="contained"
                                            onPress={() => setShowTimePicker(false)}
                                            style={styles.modalButton}
                                        >
                                            Done
                                        </Button>
                                    </View>
                                </View>
                            </Modal>
                        ) : (
                            <DateTimePicker
                                value={date}
                                mode="time"
                                display="default"
                                minuteInterval={5}
                                onChange={(_, selectedDate) => {
                                    setShowTimePicker(false);
                                    if (selectedDate) {
                                        setDate(selectedDate);
                                        const hours = selectedDate.getHours();
                                        const minutes = selectedDate.getMinutes();
                                        const ampm = hours >= 12 ? 'PM' : 'AM';
                                        const formattedHours = hours % 12 || 12;
                                        const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
                                        setPickupTime(`${formattedHours}:${formattedMinutes} ${ampm}`);
                                    }
                                }}
                            />
                        )
                    )}
                </View>

>>>>>>> LoginRedesign
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
<<<<<<< HEAD
                    {isDelivery && (
                        <View style={styles.summaryRow}>
                            <Text>Delivery Fee</Text>
                            <Text>${totals.deliveryFee.toFixed(2)}</Text>
                        </View>
                    )}
=======

>>>>>>> LoginRedesign
                    <Divider style={styles.divider} />
                    <View style={styles.summaryRow}>
                        <Text style={styles.totalText}>Total</Text>
                        <Text style={styles.totalAmount}>${totals.total.toFixed(2)}</Text>
                    </View>
                </View>

<<<<<<< HEAD
<<<<<<< HEAD
                {/* Place Order Button */}
                <TouchableOpacity style={styles.placeOrderButton} onPress={handlePlaceOrder}>
                    <Text style={styles.placeOrderText}>Place Order</Text>
                </TouchableOpacity>
=======
=======
>>>>>>> 68fb1e5fa391f1bdac2f665bb27bc781ec148f7d
                {/* Payment Section */}
                {isProcessing && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#6F4E37" />
                        <Text style={styles.loadingText}>Processing your order...</Text>
                    </View>
                )}
<<<<<<< HEAD
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
>>>>>>> LoginRedesign
=======
                {!isProcessing && totals && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Payment</Text>
                        <PaymentComponent 
                            amount={totals.total * 100}
                            onSuccess={handlePaymentSuccess}
                            cartItems={cartItems}
                            shopId={shopId}
                            pickupTime={pickupTime}
                            customerInfo={customerInfo}
                            setIsProcessing={setIsProcessing}
                        />
                    </View>
                )}
>>>>>>> 68fb1e5fa391f1bdac2f665bb27bc781ec148f7d
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F5EDD8',
    },
<<<<<<< HEAD
=======
    backButton: {
        marginBottom: 10,
    },
>>>>>>> LoginRedesign
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
<<<<<<< HEAD
    toggleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    toggleText: {
        fontSize: 16,
        color: '#6F4E37',
    },
=======
>>>>>>> LoginRedesign
    input: {
        backgroundColor: '#FFFFFF',
        marginBottom: 8,
    },
<<<<<<< HEAD
=======
    timePickerButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        padding: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    timePickerButtonText: {
        fontSize: 16,
        color: '#6F4E37',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        width: '80%',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 20,
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#6F4E37',
    },
    modalButton: {
        marginTop: 20,
        backgroundColor: '#D4A373',
        width: '100%',
    },
>>>>>>> LoginRedesign
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
<<<<<<< HEAD
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
=======
        marginBottom: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    itemImage: {
        width: 60,
        height: 60,
        borderRadius: 8,
        marginRight: 12,
    },
    itemInfo: {
        flex: 1,
        justifyContent: 'space-between',
    },
    itemName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#6F4E37',
        marginBottom: 4,
    },
    itemPrice: {
        fontSize: 14,
        color: '#666666',
        marginBottom: 8,
    },
    itemTotalPrice: {
        fontSize: 16,
        fontWeight: '500',
        color: '#6F4E37',
    },
    quantityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    quantityButton: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    quantityText: {
        width: 30,
        textAlign: 'center',
        fontSize: 16,
        color: '#333333',
>>>>>>> LoginRedesign
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
<<<<<<< HEAD
<<<<<<< HEAD
=======
=======
>>>>>>> 68fb1e5fa391f1bdac2f665bb27bc781ec148f7d
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
<<<<<<< HEAD
    payButton: {
        backgroundColor: '#D4A373',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginVertical: 16,
    },
>>>>>>> LoginRedesign
=======
>>>>>>> 68fb1e5fa391f1bdac2f665bb27bc781ec148f7d
});

export default CheckoutScreen;