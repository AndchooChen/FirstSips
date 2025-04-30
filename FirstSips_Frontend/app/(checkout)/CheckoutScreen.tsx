import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Alert, Platform, Modal, Image } from 'react-native';
import { Divider, ActivityIndicator, Button } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useStripe } from '@stripe/stripe-react-native';
import { API_URL } from '../config/api';
import DateTimePicker from '@react-native-community/datetimepicker';
import { supabase } from '../utils/supabase';

// Interfaces remain the same...
interface ShopData { /* ... */ }
interface CartItem { /* ... */ }

const CheckoutScreen = () => {
    const { initPaymentSheet, presentPaymentSheet } = useStripe();
    const [customerInfo, setCustomerInfo] = useState({ name: '', phoneNumber: '', userId: '' });
    const [pickupTime, setPickupTime] = useState('');
    const [_shopData, _setShopData] = useState<ShopData | null>(null); // Still fetched but unused in UI
    const [paymentSheetReady, setPaymentSheetReady] = useState(false); // Track if payment sheet is initialized
    const [isProcessing, setIsProcessing] = useState(false); // For payment processing / sheet init
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const router = useRouter();
    const params = useLocalSearchParams();
    const { items: itemsParam, shopId } = params;

    // Time picker state
    const [date, setDate] = useState(new Date());
    const [showTimePicker, setShowTimePicker] = useState(false);

    // Parse cart items
    useEffect(() => {
        if (itemsParam) {
            try { setCartItems(JSON.parse(itemsParam as string)); }
            catch (error) { /* ... error handling ... */ router.back(); }
        } else { /* ... empty cart handling ... */ router.back(); }
    }, [itemsParam, router]);

    // Check item availability function remains the same...
    const checkItemAvailability = useCallback(async (itemId: string, requestedQuantity: number) => { /* ... */ }, []);

    // Update cart item function remains the same...
    const updateCartItem = useCallback(async (itemId: string, changeType: 'increase' | 'decrease') => { /* ... */ }, [cartItems, checkItemAvailability]);

    // Calculate totals
    const totals = useMemo(() => {
        const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const tax = subtotal * 0.0825; // Consider making tax rate configurable
        const total = subtotal + tax;
        return { subtotal, tax, total };
    }, [cartItems]);

    // Fetch payment sheet params function remains largely the same...
    const fetchPaymentSheetParams = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const userId = user?.id;
            if (!userId) throw new Error('User not authenticated');
            if (!shopId) throw new Error('Shop ID is missing');
            const cleanShopId = String(shopId).trim();

            // Verify shop and Stripe setup
            const { data: shopData, error: shopError } = await supabase.from("shops").select("id, stripe_account_id").eq("id", cleanShopId).single();
            if (shopError || !shopData) throw new Error('Shop not found');
            if (!shopData.stripe_account_id) throw new Error('Shop has not set up payments');

            const response = await fetch(`${API_URL}/payments/payment-sheet`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: Math.round(totals.total * 100), currency: 'usd', customerId: userId, shopId: cleanShopId }),
            });
            if (!response.ok) { const errorText = await response.text(); throw new Error(`Payment setup failed: ${errorText}`); }
            const data = await response.json();
            return { paymentIntent: data.paymentIntent, ephemeralKey: data.ephemeralKey, customer: data.customer };
        } catch (error: any) {
            console.error('Error in fetchPaymentSheetParams:', error);
            Alert.alert('Payment Setup Error', error.message || 'Unable to set up payment.');
            throw error; // Re-throw to be caught by initializePaymentSheet
        }
    }, [shopId, totals.total]); // Depend on shopId and total amount

    // Initialize payment sheet
    const initializePaymentSheet = useCallback(async () => {
        if (!shopId || !customerInfo.userId || cartItems.length === 0 || totals.total <= 0) return; // Guard condition

        try {
            console.log("Initializing payment sheet...");
            setIsProcessing(true); // Indicate loading state
            setPaymentSheetReady(false); // Reset readiness

            const { paymentIntent, ephemeralKey, customer } = await fetchPaymentSheetParams();

            const { error } = await initPaymentSheet({
                merchantDisplayName: "FirstSips",
                customerId: customer,
                customerEphemeralKeySecret: ephemeralKey,
                paymentIntentClientSecret: paymentIntent,
                allowsDelayedPaymentMethods: true,
                returnURL: 'firstsips://stripe-redirect', // Ensure this matches iOS/Android config
                defaultBillingDetails: { name: customerInfo?.name, phone: customerInfo?.phoneNumber }
            });

            if (error) {
                console.error('Payment sheet init error:', error);
                Alert.alert('Payment Setup Error', error.message);
                setPaymentSheetReady(false);
            } else {
                console.log("Payment sheet initialized successfully");
                setPaymentSheetReady(true); // Mark as ready
            }
        } catch (error: any) {
            console.error('Error initializing payment sheet:', error);
            setPaymentSheetReady(false); // Ensure readiness is false on error
            // Alert is shown in fetchPaymentSheetParams
        } finally {
            setIsProcessing(false); // Stop loading indicator
        }
    }, [fetchPaymentSheetParams, initPaymentSheet, customerInfo, shopId, cartItems, totals.total]);

    // Handle payment submission
    const handlePayment = useCallback(async () => {
        if (!paymentSheetReady || isProcessing) return; // Only proceed if ready and not already processing

        try {
            setIsProcessing(true);

            // Final availability check before payment
            for (const item of cartItems) {
                const result = await checkItemAvailability(item.id, item.quantity);
                if (!result.available) { Alert.alert("Inventory Issue", result.message); setIsProcessing(false); return; }
            }

            // Present the payment sheet
            const { error: paymentError } = await presentPaymentSheet();
            if (paymentError) { Alert.alert("Payment Error", paymentError.message); setIsProcessing(false); return; }

            // --- Order Creation and Inventory Update ---
            // Create order
            const { data: orderData, error: orderError } = await supabase.from("orders").insert([{
                user_id: customerInfo.userId, shop_id: shopId, total: parseFloat(totals.total.toFixed(2)),
                status: "pending", pickup_time: pickupTime || 'ASAP', created_at: new Date().toISOString(),
            }]).select().single();
            if (orderError) throw orderError;
            console.log('Order created:', orderData.id);

            // Create order items
            const orderItemsPromises = cartItems.map(item => supabase.from("order_items").insert({
                order_id: orderData.id, item_id: item.id, quantity: item.quantity, price: item.price, created_at: new Date().toISOString()
            }));
            const orderItemsResults = await Promise.all(orderItemsPromises);
            const orderItemsErrors = orderItemsResults.filter(result => result.error);
            if (orderItemsErrors.length > 0) throw new Error('Failed to create some order items');
            console.log('Created', orderItemsResults.length, 'order items');

            // Update inventory (handle -1 quantity)
            for (const item of cartItems) {
                const { data: itemData } = await supabase.from("items").select("quantity").eq("id", item.id).single();
                if (itemData && itemData.quantity !== -1) { // Only update if quantity is tracked
                    const newQuantity = Math.max(0, itemData.quantity - item.quantity); // Prevent negative quantity
                    await supabase.from("items").update({ quantity: newQuantity }).eq("id", item.id);
                }
            }
            // --- End Order Creation ---

            Alert.alert("Success", "Your order has been placed!");
            router.replace({ pathname: "/(checkout)/SuccessScreen", params: { orderId: orderData.id } }); // Use replace

        } catch (error: any) {
            console.error("Payment/Order Error:", error);
            Alert.alert("Error", "Unable to process payment or create order: " + error.message);
        } finally {
            setIsProcessing(false);
        }
    }, [paymentSheetReady, isProcessing, cartItems, checkItemAvailability, presentPaymentSheet, customerInfo.userId, shopId, totals.total, pickupTime, router]);

    // Effect to initialize payment sheet when dependencies change
    useEffect(() => {
        initializePaymentSheet();
    }, [initializePaymentSheet]); // Dependency array includes the memoized function

    // Fetch user data
    useEffect(() => {
        const getUserData = async () => { /* ... remains the same ... */ };
        getUserData();
    }, []);

    // Fetch shop data (still unused in UI, but kept for potential future use)
    useEffect(() => {
        const fetchShopData = async () => { /* ... remains the same ... */ };
        fetchShopData();
    }, [shopId, router]);

    // Handle time selection from DateTimePicker
    const onTimeChange = (_: any, selectedDate?: Date) => {
        const currentDate = selectedDate || date;
        setShowTimePicker(Platform.OS === 'ios'); // Keep open on iOS until 'Done'
        setDate(currentDate);

        if (selectedDate) { // Format time only if a date is selected
            const hours = currentDate.getHours();
            const minutes = currentDate.getMinutes();
            const ampm = hours >= 12 ? 'PM' : 'AM';
            const formattedHours = hours % 12 || 12;
            const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
            setPickupTime(`${formattedHours}:${formattedMinutes} ${ampm}`);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
                {/* Back Arrow */}
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#555555" />
                </TouchableOpacity>

                {/* Cart Items */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Order Details</Text>
                    {cartItems.map((item) => (
                        <View key={item.id} style={styles.cartItem}>
                            <Image
                                source={item.images?.[0] ? { uri: item.images[0] } : require('../assets/images/no_item_image.png')}
                                style={styles.itemImage}
                            />
                            <View style={styles.itemInfo}>
                                <Text style={styles.itemName}>{item.name}</Text>
                                <Text style={styles.itemPrice}>${(item.price).toFixed(2)}</Text>
                                <View style={styles.quantityContainer}>
                                    <TouchableOpacity style={styles.quantityButton} onPress={() => updateCartItem(item.id, 'decrease')}>
                                        <Ionicons name="remove-outline" size={20} color="#6F4E37" />
                                    </TouchableOpacity>
                                    <Text style={styles.quantityText}>{item.quantity}</Text>
                                    <TouchableOpacity style={styles.quantityButton} onPress={() => updateCartItem(item.id, 'increase')}>
                                        <Ionicons name="add-outline" size={20} color="#6F4E37" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                            <Text style={styles.itemTotalPrice}>${(item.price * item.quantity).toFixed(2)}</Text>
                        </View>
                    ))}
                    {cartItems.length === 0 && <Text style={styles.emptyCartText}>Your cart is empty.</Text>}
                </View>

                {/* Time Selection */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Pickup Time</Text>
                    <TouchableOpacity
                        style={styles.timePickerButton} // Styled like secondary button
                        onPress={() => setShowTimePicker(true)}
                    >
                        <Text style={styles.timePickerButtonText}>
                            {pickupTime || 'Select Pickup Time'}
                        </Text>
                        <Ionicons name="time-outline" size={22} color="#6F4E37" />
                    </TouchableOpacity>

                    {showTimePicker && (
                        Platform.OS === 'ios' ? (
                            <Modal transparent={true} visible={showTimePicker} animationType="fade">
                                <TouchableOpacity style={styles.modalBackdrop} onPress={() => setShowTimePicker(false)} />
                                <View style={styles.modalContainer}>
                                    <View style={styles.modalContent}>
                                        <Text style={styles.modalTitle}>Select Pickup Time</Text>
                                        <DateTimePicker value={date} mode="time" display="spinner" minuteInterval={5} onChange={onTimeChange} textColor="#333333"/>
                                        <Button mode="contained" onPress={() => setShowTimePicker(false)} style={styles.modalButton} labelStyle={styles.modalButtonText}> Done </Button>
                                    </View>
                                </View>
                            </Modal>
                        ) : ( // Android uses default picker
                            <DateTimePicker value={date} mode="time" display="default" minuteInterval={5} onChange={onTimeChange} />
                        )
                    )}
                </View>

                {/* Order Summary */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Order Summary</Text>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Subtotal</Text>
                        <Text style={styles.summaryValue}>${totals.subtotal.toFixed(2)}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Tax (8.25%)</Text>
                        <Text style={styles.summaryValue}>${totals.tax.toFixed(2)}</Text>
                    </View>
                    <Divider style={styles.divider} />
                    <View style={styles.summaryRow}>
                        <Text style={styles.totalLabel}>Total</Text>
                        <Text style={styles.totalAmount}>${totals.total.toFixed(2)}</Text>
                    </View>
                </View>

                {/* Payment Button */}
                <Button
                    mode="contained"
                    onPress={handlePayment}
                    disabled={!paymentSheetReady || isProcessing || cartItems.length === 0} // Disable if not ready, processing, or empty cart
                    loading={isProcessing && !paymentSheetReady} // Show loading only during sheet init
                    style={[styles.payButton, (!paymentSheetReady || cartItems.length === 0) && styles.payButtonDisabled]} // Apply disabled style
                    labelStyle={styles.payButtonText}
                    contentStyle={styles.payButtonContent} // Control inner padding
                >
                    {isProcessing ? 'Processing...' : `Pay $${totals.total.toFixed(2)}`}
                </Button>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#FFFFFF', // White background
    },
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF', // White background
        paddingHorizontal: 16,
    },
    backButton: {
        marginTop: 10, // Space from top
        marginBottom: 10,
        alignSelf: 'flex-start', // Align to left
        padding: 5, // Touch area
    },
    section: {
        backgroundColor: '#FFFFFF', // Keep sections white
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        // Add subtle border instead of shadow for sections
        borderWidth: 1,
        borderColor: '#EEEEEE',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600', // Semi-bold
        marginBottom: 16, // Increased space below title
        color: '#333333', // Dark grey
    },
    cartItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F5F5F5', // Lighter separator
    },
    itemImage: {
        width: 60,
        height: 60,
        borderRadius: 8, // Rounded corners for image
        marginRight: 12,
        backgroundColor: '#F0F0F0', // Placeholder background
    },
    itemInfo: {
        flex: 1,
    },
    itemName: {
        fontSize: 16,
        fontWeight: '500', // Medium weight
        color: '#333333',
        marginBottom: 4,
    },
    itemPrice: {
        fontSize: 14,
        color: '#888888', // Lighter grey for price
        marginBottom: 8,
    },
    quantityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    quantityButton: {
        width: 32, // Slightly larger touch area
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F5F5F5', // Light background
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E0E0E0', // Subtle border
    },
    quantityText: {
        minWidth: 30, // Ensure space for number
        textAlign: 'center',
        fontSize: 16,
        color: '#333333',
        marginHorizontal: 8, // Space around number
        fontWeight: '500',
    },
    itemTotalPrice: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333333',
        marginLeft: 10, // Space from item info
    },
    emptyCartText: {
        textAlign: 'center',
        color: '#888888',
        paddingVertical: 20,
    },
    timePickerButton: { // Style like secondary button
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: "#E0E0E0", // Lighter border for inactive state
        backgroundColor: '#FFFFFF',
    },
    timePickerButtonText: {
        fontSize: 16,
        color: '#6F4E37', // Accent color text
    },
    modalBackdrop: { // Semi-transparent backdrop for iOS modal
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
    },
    modalContainer: { // Centered container for iOS modal
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
        backgroundColor: 'transparent', // Container itself is transparent
    },
    modalContent: { // White card for iOS modal content
        width: '100%',
        maxWidth: 350,
        backgroundColor: '#FFFFFF',
        borderRadius: 16, // More rounded corners
        padding: 20,
        alignItems: 'stretch', // Stretch content horizontally
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 20,
        textAlign: 'center',
        color: '#333333',
    },
    modalButton: { // Primary style for modal 'Done' button
        marginTop: 20,
        backgroundColor: '#6F4E37',
        borderRadius: 12,
        paddingVertical: 6,
    },
    modalButtonText: {
        fontSize: 16,
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10, // Increased spacing
    },
    summaryLabel: {
        fontSize: 16,
        color: '#555555', // Medium grey
    },
    summaryValue: {
        fontSize: 16,
        color: '#333333',
        fontWeight: '500',
    },
    divider: {
        marginVertical: 12, // Increased spacing around divider
        backgroundColor: '#EEEEEE', // Lighter divider
    },
    totalLabel: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333333',
    },
    totalAmount: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#6F4E37', // Accent color for total
    },
    payButton: { // Primary button style
        backgroundColor: '#6F4E37',
        borderRadius: 12,
        marginVertical: 24, // Space above/below button
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
    },
    payButtonContent: { // Control padding inside the button
        paddingVertical: 8,
    },
    payButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    payButtonDisabled: {
        backgroundColor: '#C1A181', // Desaturated accent color for disabled state
        elevation: 0, // Remove shadow when disabled
    },
    loadingContainer: { // Style for processing overlay (optional)
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(255,255,255,0.7)',
        justifyContent: 'center', alignItems: 'center', zIndex: 10,
    },
    loadingText: {
        marginTop: 10, color: '#6F4E37', fontSize: 16,
    },
});

export default CheckoutScreen;
