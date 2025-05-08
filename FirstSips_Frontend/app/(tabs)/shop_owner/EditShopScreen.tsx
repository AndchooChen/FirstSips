import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, SafeAreaView, Alert, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { TextInput, Portal, Modal } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import ScreenWideButton from '../../components/ScreenWideButton';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from "expo-router";
import { supabase } from '@/app/utils/supabase';

interface ShopItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
    images?: string[];
    description?: string;
    shop_id: string;
}

export default function EditShopScreen() {
    const [shopName, setShopName] = useState("My Coffee Shop");
    const [status, setStatus] = useState(false);
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const [showNameModal, setShowNameModal] = useState(false);
    const [tempShopName, setTempShopName] = useState(shopName);
    const [items, setItems] = useState<ShopItem[]>([]);
    const [stripeConnected, setStripeConnected] = useState(false);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        let intervalId: NodeJS.Timeout;

        const fetchShopData = async () => {
            const {
                data: { user },
                error: authError,
            } = await supabase.auth.getUser();

            if (authError || !user) {
                 console.error("Auth error fetching shop data:", authError);
                 Alert.alert("Authentication Error", "Please log in again.");
                 setLoading(false);
                 return;
            }

            const { data: userData, error: userError } = await supabase
                .from("users")
                .select("shop_id")
                .eq("id", user.id)
                .single();

            if (userError || !userData?.shop_id) {
                 console.error("Error fetching user shop_id:", userError);
                 Alert.alert("Error", "Could not find shop associated with user.");
                 setLoading(false);
                 return;
            }

            const { data: shopData, error: shopError } = await supabase
                .from("shops")
                .select("*")
                .eq("id", userData.shop_id)
                .single();

            if (shopError) {
                 console.error("Error fetching shop data:", shopError);
                 Alert.alert("Error", "Failed to load shop data.");
                 setLoading(false); 
                 return;
            }

            if (shopData) {
                setShopName(shopData.shop_name || "My Coffee Shop");
                setTempShopName(shopData.shop_name || "My Coffee Shop");
                setStatus(shopData.status || false);
                setProfileImage(shopData.profile_image || null);
                setStripeConnected(shopData.stripe_account_id ? true : false);
            }
        };

        const fetchItems = async () => {
             const {
                data: { user },
                error: authError,
            } = await supabase.auth.getUser();

            if (authError || !user) {
                 console.error("Auth error fetching items:", authError);
                 return;
            }

            const { data: userData, error: userError } = await supabase
                .from("users")
                .select("shop_id")
                .eq("id", user.id)
                .single();

            if (userError || !userData?.shop_id) {
                 console.error("Error fetching user shop_id for items:", userError);
                 return;
            }

            const fetch = async () => {
                const { data: itemsData, error: itemsError } = await supabase
                    .from("items")
                    .select("*")
                    .eq("shop_id", userData.shop_id);

                if (itemsError) {
                    console.error("Error fetching items:", itemsError);
                    Alert.alert("Error", "Failed to load shop items.");
                } else {
                    setItems(itemsData || []);
                }
            };

            await fetch();

            intervalId = setInterval(fetch, 10000);
        };

        const loadInitialData = async () => {
             setLoading(true);
             await fetchShopData();
             await fetchItems();
             setLoading(false);
        }

        loadInitialData();

        return () => clearInterval(intervalId);
    }, []);

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images as any,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            setProfileImage(result.assets[0].uri);
            Alert.alert("Image Selected", "Image selected. Remember to save changes to update profile picture.");
        } else if (!result.canceled) {
             console.log("Image picking cancelled.");
        } else {
             console.log("Image picking failed or no assets returned.");
        }
    };

    const handleHomePress = () => {
        router.push("/(tabs)/dashboard/DashboardScreen");
    };

    const handleOrderQueuePress = async () => {
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            Alert.alert("Authentication Required", "Please log in to view orders.");
            return;
        }

        const { data, error } = await supabase
            .from("users")
            .select("shop_id")
            .eq("id", user.id)
            .single();

        if (error || !data?.shop_id) {
            Alert.alert("Shop Not Found", "Shop not found for your account.");
            return;
        }

        router.push({
            pathname: "/(tabs)/shop_owner/OrderManagementScreen",
            params: { shopId: data.shop_id },
        });
    };

    const handleAddProduct = async () => {
         const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            Alert.alert("Authentication Required", "Please log in to add items.");
            return;
        }

        const { data, error } = await supabase
            .from("users")
            .select("shop_id")
            .eq("id", user.id)
            .single();

        if (error || !data?.shop_id) {
            Alert.alert("Create Shop First", "Please create a shop before adding items.");
            router.push("../../(auth)/CreateShopScreen");
            return;
        }

        router.push({
            pathname: "/(tabs)/shop_owner/AddItemScreen",
            params: { shopId: data.shop_id },
        });
    };

    const handleDeleteItem = async (itemId: string) => {
        Alert.alert(
            "Confirm Deletion",
            "Are you sure you want to delete this item?",
            [
                {
                    text: "Cancel",
                    style: "cancel"
                },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                         const {
                            data: { user },
                            error: authError,
                        } = await supabase.auth.getUser();

                        if (authError || !user) {
                            Alert.alert("Authentication Required", "Please log in to delete items.");
                            return;
                        }

                        const { data, error } = await supabase
                            .from("users")
                            .select("shop_id")
                            .eq("id", user.id)
                            .single();

                        if (error || !data?.shop_id) {
                            Alert.alert("Shop Not Found", "Shop not found for your account.");
                            return;
                        }

                        const { error: deleteError } = await supabase
                            .from("items")
                            .delete()
                            .eq("id", itemId)
                            .eq("shop_id", data.shop_id); // Ensure item belongs to the user's shop

                        if (deleteError) {
                            console.error("Error deleting item:", deleteError);
                            Alert.alert("Deletion Failed", "Failed to delete item.");
                        } else {
                            Alert.alert("Success", "Item deleted successfully.");
                            // Refresh the items list after deletion
                            const updatedItems = items.filter(item => item.id !== itemId);
                            setItems(updatedItems);
                        }
                    }
                }
            ]
        );
    };

    const handleSaveChanges = async () => {
         const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            Alert.alert("Authentication Required", "Please log in to save changes.");
            return;
        }

        const { data, error } = await supabase
            .from("users")
            .select("shop_id")
            .eq("id", user.id)
            .single();

        if (error || !data?.shop_id) {
            Alert.alert("Shop Not Found", "No shop found to save changes for.");
            return;
        }

        const { error: updateError } = await supabase
            .from("shops")
            .update({
                shop_name: shopName,
                status: status,
                updated_at: new Date().toISOString(),
            })
            .eq("id", data.shop_id);

        if (updateError) {
            console.error("Error updating shop:", updateError);
            Alert.alert("Update Failed", "Failed to update shop details.");
        } else {
            Alert.alert("Success", "Shop updated successfully!");
        }
    };

    const handleSaveNameModal = () => {
        if (tempShopName.trim() === "") {
            Alert.alert("Invalid Name", "Shop name cannot be empty.");
            return;
        }
        setShopName(tempShopName);
        setShowNameModal(false);
    };


    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.scrollViewContent}>
                <View style={styles.container}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={handleHomePress} style={styles.headerButton} accessibilityLabel="Go to Dashboard">
                            <Ionicons name="home-outline" size={24} color="#6F4E37" />
                        </TouchableOpacity>

                        <Text style={styles.headerTitle}>Edit Shop</Text>
                        <View style={styles.headerButtonsContainer}>
                            <TouchableOpacity
                                onPress={() => router.push("/(auth)/StripeConnectScreen")}
                                style={[styles.headerButton, styles.stripeButton]}
                                accessibilityLabel="Manage Payments"
                            >
                                <View style={styles.headerButtonContent}>
                                    <Ionicons
                                        name={stripeConnected ? "card" : "card-outline"}
                                        size={24}
                                        color={stripeConnected ? "#4CAF50" : "#6F4E37"}
                                    />
                                    <Text style={[styles.headerButtonText, stripeConnected && styles.stripeConnectedText]}>
                                        Payments
                                    </Text>
                                </View>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleOrderQueuePress} style={styles.headerButton} accessibilityLabel="View Orders">
                                <View style={styles.headerButtonContent}>
                                    <Ionicons name="list-outline" size={24} color="#6F4E37" />
                                    <Text style={styles.headerButtonText}>Orders</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {loading ? (
                         <ActivityIndicator size="large" color="#6F4E37" style={styles.loadingIndicator} />
                    ) : (
                        <>
                            <TouchableOpacity style={styles.imageContainer} onPress={pickImage} accessibilityLabel="Change Profile Image">
                                {profileImage ? (
                                    <Image source={{ uri: profileImage }} style={styles.profileImage} />
                                ) : (
                                    <View style={styles.imagePlaceholder}>
                                        <Ionicons name="camera-outline" size={40} color="#6F4E37" />
                                    </View>
                                )}
                            </TouchableOpacity>

                            <View style={styles.nameContainer}>
                                <Text style={styles.shopName}>{shopName}</Text>
                                <TouchableOpacity onPress={() => {
                                     setTempShopName(shopName);
                                     setShowNameModal(true);
                                }} accessibilityLabel="Edit Shop Name">
                                    <Ionicons name="pencil-outline" size={24} color="#6F4E37" />
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity
                                style={[styles.statusButton, status ? styles.openButton : styles.closedButton]}
                                onPress={() => setStatus(!status)}
                                accessibilityLabel={status ? 'Toggle shop status to Closed' : 'Toggle shop status to Open'}
                            >
                                <Text style={styles.statusButtonText}>
                                    {status ? 'OPEN' : 'CLOSED'}
                                </Text>
                            </TouchableOpacity>

                            <Text style={styles.sectionTitle}>Products</Text>
                            <View style={styles.productsList}>
                                {items.length === 0 ? (
                                    <Text style={styles.emptyText}>No products added yet.</Text>
                                ) : (
                                    items.map((item) => (
                                        <View key={item.id} style={styles.productCardContainer}>
                                            <TouchableOpacity
                                                style={styles.productCard}
                                                onPress={() => router.push({
                                                    pathname: "/(tabs)/shop_owner/EditItemScreen",
                                                    params: { shopId: item.shop_id, itemId: item.id }
                                                })}
                                                accessibilityLabel={`Edit ${item.name}`}
                                            >
                                                <Image
                                                    source={
                                                        item.images?.[0]
                                                            ? { uri: item.images[0] }
                                                            : require('../../assets/images/no_item_image.png')
                                                    }
                                                    style={styles.productImage}
                                                    defaultSource={require('../../assets/images/no_item_image.png')}
                                                />
                                                <View style={styles.productInfo}>
                                                    <Text style={styles.productName}>{item.name}</Text>
                                                    <Text style={styles.productPrice}>${item.price ? item.price.toFixed(2) : '0.00'}</Text>
                                                    <View style={styles.quantityInfo}>
                                                        <Text style={styles.quantityText}>In stock: {item.quantity !== undefined && item.quantity !== null ? item.quantity : 'Unlimited'}</Text>
                                                    </View>
                                                </View>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={styles.deleteButton}
                                                onPress={() => handleDeleteItem(item.id)}
                                                accessibilityLabel={`Delete ${item.name}`}
                                            >
                                                <Ionicons name="trash-outline" size={24} color="#FF6B6B" />
                                            </TouchableOpacity>
                                        </View>
                                    ))
                                )}
                            </View>

                            <TouchableOpacity style={styles.addProductButton} onPress={handleAddProduct} accessibilityLabel="Add New Product">
                                <Ionicons name="add-circle" size={32} color="#6F4E37" />
                                <Text style={styles.addProductText}>Add New Product</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </ScrollView>

            <Portal>
                <Modal
                    visible={showNameModal}
                    onDismiss={() => setShowNameModal(false)}
                    contentContainerStyle={styles.modalContainer}
                >
                    <Text style={styles.modalTitle}>Edit Shop Name</Text> {/* Add modal title */}
                    <TextInput
                        label="Shop Name"
                        value={tempShopName}
                        onChangeText={setTempShopName}
                        mode="outlined"
                        style={styles.modalInput}
                        theme={{ colors: { primary: '#6F4E37', background: '#FFFFFF' } }} // Consistent theme
                        outlineColor="#CCCCCC" // Consistent softer outline color
                        activeOutlineColor="#6F4E37" // Consistent accent color when active
                    />
                    <ScreenWideButton
                        text="Save Name" // More descriptive button text
                        onPress={handleSaveNameModal}
                        color="#6F4E37" // Consistent primary button color
                        textColor="#FFFFFF" // Consistent white text
                        style={styles.primaryButton} // Apply primary button styles
                         disabled={tempShopName.trim() === ""} // Disable if name is empty
                    />
                </Modal>
            </Portal>

            {/* Save Changes Button (Fixed at the bottom) */}
            {/* Only show save button when not loading */}
            {!loading && (
                <View style={styles.saveButtonContainer}>
                    <ScreenWideButton
                        text="Confirm Edits"
                        onPress={handleSaveChanges}
                        color="#6F4E37" // Consistent primary button color
                        textColor="#FFFFFF" // Consistent white text
                        style={styles.primaryButton} // Apply primary button styles
                    />
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    // Safe Area style for full screen coverage and consistent background
    safeArea: {
        flex: 1,
        backgroundColor: "#FFFFFF", // Consistent white background
    },
    // ScrollView content container style to allow padding at the bottom
    scrollViewContent: {
        flexGrow: 1, // Allow content to grow
        paddingBottom: 100, // Add extra padding at the bottom to prevent save button from covering content
    },
    // Main Container with consistent horizontal padding
    container: {
        flex: 1,
        paddingHorizontal: 24, // Consistent horizontal padding
        paddingTop: 0, // Adjust top padding as header has its own
    },
    // Header container for navigation and title
    header: {
        flexDirection: 'row', // Arrange items horizontally
        alignItems: 'center', // Align items vertically in the center
        justifyContent: 'space-between', // Space out elements
        marginBottom: 24, // Consistent space below header
        paddingTop: 20, // Consistent padding at the top for status bar/notch
    },
    // Header title text style
    headerTitle: {
        fontSize: 28, // Consistent header title font size
        fontWeight: 'bold', // Consistent bold font weight
        color: '#333333', // Consistent dark text color for titles
        flex: 1, // Allow title to take available space
        textAlign: 'center', // Center title
        marginHorizontal: 8, // Add horizontal margin to prevent overlap with buttons
    },
    // Style for individual header buttons
    headerButton: {
        padding: 8, // Consistent padding for touch area
    },
    // Container for the right-side header buttons
    headerButtonsContainer: {
        flexDirection: 'row', // Arrange buttons horizontally
        alignItems: 'center', // Align buttons vertically
    },
    // Style for the content inside header buttons (icon and text)
    headerButtonContent: {
        flexDirection: 'column', // Stack icon and text vertically
        alignItems: 'center', // Center icon and text horizontally
        justifyContent: 'center', // Center icon and text vertically
    },
    // Style for the text inside header buttons
    headerButtonText: {
        fontSize: 10, // Smaller font size for button text
        marginTop: 2, // Space between icon and text
        color: '#6F4E37', // Consistent accent color for button text
    },
    // Style for the text when Stripe is connected
    stripeConnectedText: {
        color: '#4CAF50', // Green color for connected status
    },
    // Style for the Stripe button (adds right margin)
    stripeButton: {
        marginRight: 8, // Space between Stripe and Orders buttons
    },
    // Loading indicator style
    loadingIndicator: {
        marginVertical: 40, // Add vertical margin around the indicator
    },
    // Container for the profile image section
    imageContainer: {
        alignItems: 'center', // Center the image horizontally
        marginTop: 16, // Consistent spacing above the image
        marginBottom: 24, // Consistent spacing below the image
    },
    // Style for the displayed profile image
    profileImage: {
        width: 120, // Consistent size
        height: 120, // Consistent size
        borderRadius: 60, // Make it circular
        borderWidth: 2, // Add a border
        borderColor: '#6F4E37', // Consistent accent color border
    },
    // Style for the image placeholder when no image is set
    imagePlaceholder: {
        width: 120, // Consistent size
        height: 120, // Consistent size
        borderRadius: 60, // Make it circular
        backgroundColor: '#FFFFFF', // Consistent white background
        justifyContent: 'center', // Center content vertically
        alignItems: 'center', // Center content horizontally
        borderWidth: 2, // Add a border
        borderColor: '#6F4E37', // Consistent accent color border
    },
    // Container for the shop name and edit button
    nameContainer: {
        flexDirection: 'row', // Arrange items horizontally
        alignItems: 'center', // Align items vertically in the center
        justifyContent: 'center', // Center the name and button horizontally
        marginBottom: 24, // Consistent spacing below the name section
        gap: 8, // Consistent space between name and edit button
    },
    // Style for the displayed shop name
    shopName: {
        fontSize: 24, // Consistent font size for shop name
        fontWeight: 'bold', // Consistent bold weight
        color: '#333333', // Consistent dark text color
    },
    // Style for the shop status toggle button
    statusButton: {
        alignItems: 'center', // Center text horizontally
        justifyContent: 'center', // Center text vertically
        paddingVertical: 14, // Consistent vertical padding (matching primary button)
        borderRadius: 12, // Consistent border radius (matching primary button)
        marginBottom: 24, // Consistent spacing below the status button
        width: '100%', // Take full width
    },
    // Background color for the OPEN status button
    openButton: {
        backgroundColor: '#4CAF50', // Green color for open
    },
    // Background color for the CLOSED status button
    closedButton: {
        backgroundColor: '#F44336', // Red color for closed
    },
    // Style for the text inside the status button
    statusButtonText: {
        fontSize: 18, // Consistent font size
        fontWeight: 'bold', // Consistent bold weight
        color: '#FFFFFF', // Consistent white text color
    },
    // Style for section titles (e.g., "Products")
    sectionTitle: {
        fontSize: 20, // Consistent section title font size
        fontWeight: 'bold', // Consistent bold weight
        color: '#333333', // Consistent dark text color
        marginTop: 16, // Consistent space above section title
        marginBottom: 12, // Consistent space below section title
        paddingHorizontal: 0, // Remove horizontal padding from here, handled by container
    },
    // Container for the list of products
    productsList: {
        marginTop: 0, // Adjusted margin top
        gap: 12, // Consistent space between product cards
    },
    // Container for an individual product card and delete button
    productCardContainer: {
        flexDirection: 'row', // Arrange card and delete button horizontally
        alignItems: 'center', // Align items vertically
        // marginBottom: 8, // Removed, using gap in productsList instead
    },
    // Style for an individual product card (touchable area)
    productCard: {
        flex: 1, // Allow card to take available space
        flexDirection: 'row', // Arrange image and info horizontally
        backgroundColor: '#FFFFFF', // Consistent white background
        borderRadius: 8, // Consistent border radius
        padding: 12, // Consistent padding inside the card
        alignItems: 'center', // Align items vertically within the card
        elevation: 1, // Add subtle shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0.5 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
    },
    // Style for the delete button next to the product card
    deleteButton: {
        padding: 10, // Consistent padding for touch area
        marginLeft: 8, // Space between card and delete button
    },
    // Container for quantity information
    quantityInfo: {
        marginTop: 4, // Space above quantity text
    },
    // Style for quantity text
    quantityText: {
        fontSize: 12, // Smaller font size
        color: '#555555', // Consistent gray text color
    },
    // Style for product images within cards
    productImage: {
        width: 60, // Consistent size
        height: 60, // Consistent size
        borderRadius: 4, // Slightly rounded corners
        marginRight: 12, // Space between image and product info
        backgroundColor: '#EEEEEE', // Placeholder background
    },
    // Container for product name and price
    productInfo: {
        flex: 1, // Allow product info to take available space
    },
    // Style for product name text
    productName: {
        fontSize: 16, // Consistent font size
        fontWeight: '500', // Semi-bold weight
        color: '#333333', // Consistent dark text color
    },
    // Style for product price text
    productPrice: {
        fontSize: 14, // Consistent font size
        color: '#6F4E37', // Consistent accent color
        marginTop: 4, // Space above price
    },
    // Style for the "Add New Product" button
    addProductButton: {
        flexDirection: 'row', // Arrange icon and text horizontally
        alignItems: 'center', // Align items vertically
        backgroundColor: '#FFFFFF', // Consistent white background
        padding: 16, // Consistent padding
        borderRadius: 8, // Consistent border radius
        marginTop: 24, // Consistent space above the button
        justifyContent: 'center', // Center content horizontally
        gap: 8, // Consistent space between icon and text
        elevation: 1, // Add subtle shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0.5 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
    },
    // Style for the text in the "Add New Product" button
    addProductText: {
        fontSize: 16, // Consistent font size
        color: '#6F4E37', // Consistent accent color
        fontWeight: '500', // Semi-bold weight
    },
    // Style for the modal container
    modalContainer: {
        backgroundColor: 'white', // White background
        padding: 24, // Consistent padding
        marginHorizontal: 24, // Consistent horizontal margin
        borderRadius: 12, // Consistent border radius
        gap: 16, // Consistent space between modal elements
    },
    // Style for the modal title
    modalTitle: {
        fontSize: 20, // Consistent title font size
        fontWeight: 'bold', // Consistent bold weight
        color: '#333333', // Consistent dark text color
        marginBottom: 8, // Space below title
        textAlign: 'center', // Center the title
    },
    // Style for the input field within the modal
    modalInput: {
        backgroundColor: '#FFFFFF', // Consistent white background
        // Theming is applied inline
    },
    // Container for the main "Confirm Edits" button at the bottom
    saveButtonContainer: {
        position: 'absolute', // Position absolutely
        bottom: 0, // Align to the bottom
        left: 0, // Align to the left
        right: 0, // Align to the right
        paddingHorizontal: 24, // Consistent horizontal padding
        paddingBottom: 20, // Add padding at the very bottom
        backgroundColor: '#FFFFFF', // Match background for seamless look
        borderTopWidth: 1, // Add a subtle border at the top
        borderColor: '#EEEEEE', // Light border color
    },
     // Primary button styles (replicated from the guide and other screens)
    primaryButton: {
        borderRadius: 12, // Consistent border radius
        paddingVertical: 14, // Consistent vertical padding
        elevation: 2, // Consistent shadow for Android
        shadowColor: '#000', // Consistent shadow color
        shadowOffset: { width: 0, height: 1 }, // Consistent shadow offset
        shadowOpacity: 0.2, // Consistent shadow opacity
        shadowRadius: 1.41, // Consistent shadow radius
        // Assuming ScreenWideButton handles width: "100%" or similar internally
    },
    // Style for empty state text
    emptyText: {
        textAlign: 'center', // Center empty state text
        color: '#555555', // Consistent gray text color
        marginTop: 8, // Add spacing above empty text
    },
});
