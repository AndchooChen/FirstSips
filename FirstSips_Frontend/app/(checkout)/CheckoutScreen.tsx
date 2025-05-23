import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Alert, Platform, Modal, Image } from 'react-native';
import { Divider, ActivityIndicator, Button } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useStripe } from '@stripe/stripe-react-native';
import { API_URL } from '../config/api';
import { Picker } from '@react-native-picker/picker';
import { supabase } from '../utils/supabase';

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
    images?: string[];
}

const CheckoutScreen = () => {
    const { initPaymentSheet, presentPaymentSheet } = useStripe();
    const [customerInfo, setCustomerInfo] = useState({
        name: '',
        phoneNumber: '',
        userId: '',
    });
    // Shop data is fetched but not currently used in the UI
    const [_shopData, _setShopData] = useState<ShopData | null>(null);
    const [loading, setLoading] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const router = useRouter();
    const params = useLocalSearchParams();
    const { items: itemsParam, shopId } = params;

    // Parse cart items from URL params
    useEffect(() => {
        if (itemsParam) {
            try {
                const parsedItems = JSON.parse(itemsParam as string);
                setCartItems(parsedItems);
            } catch (error) {
                console.error('Error parsing cart items:', error);
                Alert.alert('Error', 'There was a problem loading your cart items');
                router.back();
            }
        } else {
            // No items in cart, go back
            Alert.alert('Empty Cart', 'Please add items to your cart');
            router.back();
        }
    }, [itemsParam]);

    const formatTime = (date: { getHours: () => any; getMinutes: () => any; }) => {
      if (!date) return null;
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const formattedHours = hours % 12 || 12; // the hour '0' should be '12'
      const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
      return `${formattedHours}:${formattedMinutes} ${ampm}`;
    };
    
    // Function to generate the list of available time options (Date objects)
    // Starts 5 minutes from now, in 5-minute intervals, up to 1 hour from now.
    const generateTimeOptions = () => {
      const options = [];
      const now = new Date();
      const startTime = new Date(now.getTime() + 5 * 60 * 1000); // Start 5 minutes from now
      const endTime = new Date(now.getTime() + 60 * 60 * 1000); // End 1 hour from now
    
      let currentTime = new Date(startTime);
    
      // Round up the start time to the nearest 5-minute interval if it's not already
      const startMinutes = currentTime.getMinutes();
      const remainder = startMinutes % 5;
      if (remainder !== 0) {
        currentTime.setMinutes(startMinutes + (5 - remainder));
        currentTime.setSeconds(0);
        currentTime.setMilliseconds(0);
      } else {
          // If it's already on a 5-minute mark, just ensure seconds/milliseconds are zero
          currentTime.setSeconds(0);
          currentTime.setMilliseconds(0);
      }
    
      // Add times in 5-minute intervals until the end time is reached
      while (currentTime <= endTime) {
        options.push(new Date(currentTime));
        currentTime.setMinutes(currentTime.getMinutes() + 5);
    
        // Safety break to prevent infinite loops in case of logic errors
        if (options.length > 120) { // Max 12 intervals per hour * 2 hours buffer = 24 intervals * 5 = 120
             console.warn("Time option generation potentially in infinite loop");
             break;
        }
      }
    
      return options; // This will be an array of Date objects
    };

    const [showTimePicker, setShowTimePicker] = useState(false);
    // State to hold the currently selected Date object from the list
    const [selectedDate, setSelectedDate] = useState(null);
    // State to hold the formatted string displayed on the button
    const [pickupTime, setPickupTime] = useState('');

    // Generate the list of available time options (Date objects)
    const availableTimeDates = generateTimeOptions();
    // Format these Date objects into strings for the Picker items
    const availableTimeStringOptions = availableTimeDates.map(date => formatTime(date));

    // Effect to set the initial pickup time when the component mounts
    useEffect(() => {
      if (availableTimeDates.length > 0) {
        // Set the initial selected date to the first available date
        setSelectedDate(availableTimeDates[0]);
        // Set the initial pickup time text to the formatted first available time
        setPickupTime(formatTime(availableTimeDates[0]) as any);
      }
    }, []); // Empty dependency array ensures this runs only once on mount

    // Function to handle selection from the Picker
    const handleTimeChange = (itemValue, itemIndex) => {
      // itemValue will be the formatted time string
      // itemIndex will be the index in the availableTimeStringOptions array
      const selectedDateObject = availableTimeDates[itemIndex]; // Get the corresponding Date object
      setSelectedDate(selectedDateObject);
      setPickupTime(itemValue); // Update the displayed text
    };

    // Function to check item availability
    const checkItemAvailability = async (itemId: string, requestedQuantity: number) => {
        try {
          const { data: itemData, error } = await supabase
            .from("items")
            .select("*")
            .eq("id", itemId)
            .single();

          if (error || !itemData) {
            return { available: false, message: "Item no longer exists" };
          }

          if (itemData.quantity === -2) {
            return { available: false, message: "This item is not available for purchase." };
          }

          if (itemData.quantity === -1) {
            return { available: true };
          }

          if (requestedQuantity > itemData.quantity) {
            return {
              available: false,
              message: `Sorry, only ${itemData.quantity} items available in stock.`,
            };
          }

          return { available: true };
        } catch (error) {
          console.error("Error checking item availability:", error);
          return { available: false, message: "Error checking availability" };
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
        try {
            // Get current user
            const {
                data: {user}
            } = await supabase.auth.getUser();

            const userId = user?.id;

            if (!userId) {
                throw new Error('User not authenticated');
            }

            // Validate shopId
            if (!shopId) {
                throw new Error('Shop ID is missing');
            }

            // Clean the shopId to ensure it's properly formatted
            const cleanShopId = String(shopId).trim();

            // Verify the shop exists and has Stripe set up
            const { data: shopData, error: shopError } = await supabase
                .from("shops")
                .select("id, stripe_account_id")
                .eq("id", cleanShopId)
                .single();

            if (shopError || !shopData) {
                console.error('Shop verification error:', shopError);
                throw new Error('Shop not found in database');
            }

            if (!shopData.stripe_account_id) {
                throw new Error('This shop has not set up payment processing yet');
            }

            console.log("Fetching payment sheet params for shop:", cleanShopId);
            console.log("Totals:", totals);

            const response = await fetch(`${API_URL}/payments/payment-sheet`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    amount: Math.round(totals.total * 100),
                    currency: 'usd',
                    customerId: userId,
                    shopId: cleanShopId
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
        } catch (error: any) {
            console.error('Error in fetchPaymentSheetParams:', error);
            Alert.alert(
                'Payment Setup Error',
                error.message || 'Unable to set up payment. Please try again.'
            );
            throw error;
        }
    };

    const initializePaymentSheet = async () => {
        try {
            console.log("Initializing payment sheet");
            setIsProcessing(true);

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
                console.error('Payment sheet initialization error:', error);
                Alert.alert('Payment Setup Error', error.message);
                return;
            }

            setLoading(true);
            console.log("Payment sheet initialized successfully");
        } catch (error: any) {
            console.error('Error initializing payment sheet:', error);
            // Don't show another alert as fetchPaymentSheetParams already shows one
        } finally {
            setIsProcessing(false);
        }
    };

    const handlePayment = async () => {
        if (!loading) return;

        try {
          setIsProcessing(true);

          for (const item of cartItems) {
            const result = await checkItemAvailability(item.id, item.quantity);
            if (!result.available) {
              Alert.alert("Inventory Issue", result.message);
              setIsProcessing(false);
              return;
            }
          }

          const { error: paymentError } = await presentPaymentSheet();

          if (paymentError) {
            Alert.alert("Error", paymentError.message);
            return;
          }

          // Create the order first
          const { data: orderData, error: orderError } = await supabase
            .from("orders")
            .insert([
              {
                user_id: customerInfo.userId,
                shop_id: shopId,
                total: parseFloat(totals.total.toFixed(2)),
                status: "pending",
                pickup_time: pickupTime,
                created_at: new Date().toISOString(),
              },
            ])
            .select()
            .single();

          if (orderError) {
            throw orderError;
          }

          console.log('Order created with ID:', orderData.id);

          // Now create entries in the order_items table for each item
          const orderItemsPromises = cartItems.map(item => {
            return supabase
              .from("order_items")
              .insert({
                order_id: orderData.id,
                item_id: item.id,
                quantity: item.quantity,
                price: item.price,
                created_at: new Date().toISOString()
              });
          });

          // Wait for all order items to be inserted
          const orderItemsResults = await Promise.all(orderItemsPromises);

          // Check if any order items failed to insert
          const orderItemsErrors = orderItemsResults.filter(result => result.error);
          if (orderItemsErrors.length > 0) {
            console.error('Errors inserting order items:', orderItemsErrors);
            throw new Error('Failed to create some order items');
          }

          console.log('Successfully created', orderItemsResults.length, 'order items');

          // Update item quantities in inventory
          for (const item of cartItems) {
            const { data: itemData } = await supabase
              .from("items")
              .select("quantity")
              .eq("id", item.id)
              .single();

            if (itemData && itemData.quantity !== -1 && itemData.quantity !== -2) {
              const newQuantity = itemData.quantity - item.quantity;
              await supabase
                .from("items")
                .update({ quantity: newQuantity })
                .eq("id", item.id);
            }
          }

          Alert.alert("Success", "Your order has been placed!");
          router.push({
            pathname: "/(checkout)/SuccessScreen",
            params: { orderId: orderData.id },
          });
        } catch (error) {
          console.error("Payment Error:", error);
          Alert.alert("Error", "Unable to process payment");
        } finally {
          setIsProcessing(false);
        }
      };


    useEffect(() => {
        // Only initialize payment sheet when we have all required data
        if (shopId && customerInfo.userId && cartItems.length > 0 && totals.total > 0) {
            // Add a small delay to ensure all state is properly updated
            const timer = setTimeout(() => {
                initializePaymentSheet();
            }, 500);

            return () => clearTimeout(timer);
        }
    }, [totals.total, shopId, customerInfo, cartItems]);

    // Fetch user data
    useEffect(() => {
        const getUserData = async () => {
          const { data: { user }, error: authError } = await supabase.auth.getUser();
          if (authError || !user) {
            alert("User not authenticated");
            setLoading(false);
            return;
          }

          const { data: userData, error: userDataError } = await supabase
            .from("users")
            .select("*")
            .eq("id", user.id)
            .single();

          if (userDataError || !userData) {
            alert("User data not found");
          } else {
            const name = `${userData.first_name || ""} ${userData.last_name || ""}`.trim();
            const phoneNumber = userData.phone_number || "";

            setCustomerInfo({
              name,
              phoneNumber,
              userId: user.id,
            });
          }

          setLoading(false);
        };

        getUserData();
      }, []);


    // Fetch shop data
    useEffect(() => {
        const fetchShopData = async () => {
          if (!shopId) return;

          // Clean the shopId to ensure it's properly formatted
          const cleanShopId = String(shopId).trim();

          const { data: shopData, error: shopError } = await supabase
            .from("shops")
            .select("*, stripe_account_id")
            .eq("id", cleanShopId)
            .single();

          if (shopError || !shopData) {
            console.error('Shop data not found:', shopError);
            Alert.alert("Error", "Shop data not found. Please try again.");
            router.back();
            return;
          }

          // Check if shop has Stripe set up
          if (!shopData.stripe_account_id) {
            console.warn('Shop does not have Stripe set up:', cleanShopId);
            // We'll continue anyway, but payment will fail later
          }

          const { data: ownerData } = await supabase
            .from("users")
            .select("phone_number")
            .eq("id", shopData.owner_id)
            .single();

          _setShopData({
            ...shopData,
            phoneNumber: ownerData?.phone_number || "No phone number available",
          });
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
    
            {/* Cart Items */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Order Details</Text>
              {cartItems.map((item, index) => (
                <View key={index} style={styles.cartItem}>
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
                </View>
              ))}
            </View>
    
            {/* Pickup Time Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Pickup Time</Text>
              <TouchableOpacity
                style={styles.timePickerButton}
                onPress={() => setShowTimePicker(true)}
              >
                <Text style={styles.timePickerButtonText}>
                  {/* Display the formatted pickupTime state */}
                  {pickupTime || 'Select Pickup Time'}
                </Text>
                <Ionicons name="time-outline" size={24} color="#6F4E37" />
              </TouchableOpacity>

              {/* Custom Time Picker Modal */}
              <Modal
                transparent={true}
                visible={showTimePicker}
                animationType="slide"
                onRequestClose={() => setShowTimePicker(false)} // Handle Android back button
              >
                <View style={styles.modalContainer}>
                  <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Select Pickup Time</Text>

                    {/* Use the Picker component */}
                    <Picker
                      selectedValue={pickupTime} // The currently selected formatted time string
                      style={styles.picker}
                      onValueChange={handleTimeChange} // Handle selection
                      itemStyle={styles.pickerItem} // Apply itemStyle here
                    >
                      {/* Map the formatted time strings to Picker.Item components */}
                      {availableTimeStringOptions.map((timeString, index) => (
                        // Explicitly set label and value
                        <Picker.Item key={index} label={timeString} value={timeString} />
                      ))}
                    </Picker>

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
                disabled={!loading} // Use 'loading' state to disable the button
                loading={isProcessing} // Use 'isProcessing' for the loading indicator on the button
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
    backButton: {
        marginBottom: 10,
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
    input: {
        backgroundColor: '#FFFFFF',
        marginBottom: 8,
    },
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
    picker: {
        width: '100%', // Make picker take full width of modal content
        height: 200, // Adjust height as needed
    },
    pickerItem: {
        // Optional styling for picker items
        fontSize: 16,
        color: '#333',
    },
});

export default CheckoutScreen;