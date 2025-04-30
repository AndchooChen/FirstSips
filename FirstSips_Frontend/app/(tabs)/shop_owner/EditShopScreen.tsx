import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, SafeAreaView, ActivityIndicator, Alert, Platform } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { TextInput, Portal, Modal, Switch } from 'react-native-paper'; // Added Switch
import { Ionicons } from '@expo/vector-icons';
import ScreenWideButton from '../../components/ScreenWideButton';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from "expo-router";
import { supabase } from '@/app/utils/supabase';

interface ShopItem {
    id: string;
    name: string;
    price: number;
    quantity: number; // -1 unlimited, -2 hidden
    images?: string[];
    description?: string;
    shop_id: string;
}

interface ShopData {
    id: string;
    shop_name: string;
    status: boolean;
    profile_image: string | null;
    stripe_account_id: string | null;
    stripe_enabled: boolean;
    payouts_enabled: boolean;
    details_submitted: boolean;
}

export default function EditShopScreen() {
    const [shopData, setShopData] = useState<ShopData | null>(null);
    const [tempShopName, setTempShopName] = useState('');
    const [tempProfileImage, setTempProfileImage] = useState<string | null>(null);
    const [tempStatus, setTempStatus] = useState(false); // Temporary state for switch
    const [showNameModal, setShowNameModal] = useState(false);
    const [items, setItems] = useState<ShopItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const router = useRouter();

    // Fetch Shop and Item Data
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            if (authError || !user) throw new Error("Not authenticated");

            const { data: userData, error: userError } = await supabase
                .from("users").select("shop_id").eq("id", user.id).single();
            if (userError || !userData?.shop_id) throw new Error("No shop found for this user");

            const shopId = userData.shop_id;

            // Fetch Shop Data
            const { data: shopResult, error: shopError } = await supabase
                .from("shops").select("*").eq("id", shopId).single();
            if (shopError) throw shopError;

            setShopData(shopResult as ShopData);
            setTempShopName(shopResult.shop_name || '');
            setTempProfileImage(shopResult.profile_image || null);
            setTempStatus(shopResult.status || false);

            // Fetch Items
            const { data: itemsData, error: itemsError } = await supabase
                .from("items").select("*").eq("shop_id", shopId).order('created_at', { ascending: false });
            if (itemsError) throw itemsError;
            setItems(itemsData as ShopItem[]);

        } catch (error: any) {
            console.error("Error fetching data:", error);
            Alert.alert("Error", error.message || "Could not load shop data.");
            // Optionally navigate back or show retry option
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Image Picker
    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') { Alert.alert('Permission Required', 'Camera roll access needed.'); return; }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true,
            aspect: [1, 1], quality: 0.8,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            setTempProfileImage(result.assets[0].uri);
            // TODO: Implement image upload logic here if storing in Supabase Storage
            // For now, just updating local state
        }
    };

    // Navigation Handlers
    const handleHomePress = () => router.push("/(tabs)/dashboard/DashboardScreen");
    const handleOrderQueuePress = () => {
        if (shopData?.id) {
            router.push({ pathname: "/(tabs)/shop_owner/OrderManagementScreen", params: { shopId: shopData.id } });
        }
    };
    const handleAddProduct = () => router.push("/(tabs)/shop_owner/AddItemScreen");
    const handleEditItem = (itemId: string) => {
        if (shopData?.id) {
            router.push({ pathname: "/(tabs)/shop_owner/EditItemScreen", params: { shopId: shopData.id, itemId: itemId } });
        }
    };
    const handleStripeConnect = () => router.push("/(auth)/StripeConnectScreen");

    // Delete Item
    const handleDeleteItem = async (itemId: string) => {
        Alert.alert("Confirm Deletion", "Delete this item permanently?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete", style: "destructive",
                onPress: async () => {
                    try {
                        const { error } = await supabase.from("items").delete().eq("id", itemId).eq("shop_id", shopData?.id);
                        if (error) throw error;
                        setItems(prevItems => prevItems.filter(item => item.id !== itemId)); // Update UI immediately
                        Alert.alert("Success", "Item deleted.");
                    } catch (error: any) {
                        console.error("Error deleting item:", error);
                        Alert.alert("Error", "Failed to delete item.");
                    }
                }
            }
        ]);
    };

    // Save Changes
    const handleSaveChanges = async () => {
        setSaving(true);
        try {
            if (!shopData?.id) throw new Error("Shop ID not found.");
            if (!tempShopName.trim()) throw new Error("Shop name cannot be empty.");

            // TODO: Handle profile image upload if tempProfileImage is a local URI
            const finalProfileImage = tempProfileImage; // Replace with uploaded URL if needed

            const { error } = await supabase
                .from("shops")
                .update({
                    shop_name: tempShopName.trim(),
                    status: tempStatus,
                    profile_image: finalProfileImage,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", shopData.id);

            if (error) throw error;

            // Update local state to reflect saved changes
            setShopData(prev => prev ? { ...prev, shop_name: tempShopName.trim(), status: tempStatus, profile_image: finalProfileImage } : null);
            Alert.alert("Success", "Shop updated successfully!");
            // Optionally navigate away or just show success

        } catch (error: any) {
            console.error("Error updating shop:", error);
            Alert.alert("Error", error.message || "Failed to update shop");
        } finally {
            setSaving(false);
        }
    };

    // --- Render Logic ---

    if (loading) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#6F4E37" />
                </View>
            </SafeAreaView>
        );
    }

    if (!shopData) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.loadingContainer}>
                    <Text style={styles.errorText}>Could not load shop data.</Text>
                    {/* Optionally add a retry button */}
                </View>
            </SafeAreaView>
        );
    }

    const isStripeFullyEnabled = shopData.stripe_enabled && shopData.payouts_enabled && shopData.details_submitted;

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleHomePress} style={styles.headerButton}>
                    <Ionicons name="home-outline" size={24} color="#555555" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Manage Shop</Text>
                <View style={styles.headerButtonsContainer}>
                    <TouchableOpacity onPress={handleStripeConnect} style={styles.headerButton}>
                        <Ionicons name={isStripeFullyEnabled ? "card" : "card-outline"} size={24} color={isStripeFullyEnabled ? "#4CAF50" : "#D32F2F"} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleOrderQueuePress} style={styles.headerButton}>
                        <Ionicons name="list-outline" size={24} color="#555555" />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Profile Image & Name */}
                <View style={styles.profileSection}>
                    <TouchableOpacity style={styles.imageContainer} onPress={pickImage}>
                        <Image
                            source={tempProfileImage ? { uri: tempProfileImage } : require('../../assets/images/no_shop_image.png')}
                            style={styles.profileImage}
                        />
                        <View style={styles.cameraIconOverlay}>
                            <Ionicons name="camera-outline" size={20} color="#FFFFFF" />
                        </View>
                    </TouchableOpacity>
                    <View style={styles.nameContainer}>
                        <Text style={styles.shopName}>{tempShopName}</Text>
                        <TouchableOpacity onPress={() => setShowNameModal(true)}>
                            <Ionicons name="pencil-outline" size={20} color="#555555" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Shop Status Toggle */}
                <View style={styles.statusContainer}>
                    <Text style={styles.statusLabel}>Shop Status:</Text>
                    <View style={styles.switchRow}>
                        <Text style={[styles.statusText, !tempStatus && styles.statusTextActive]}>Closed</Text>
                        <Switch
                            value={tempStatus}
                            onValueChange={setTempStatus}
                            color="#66BB6A" // Accent color for switch
                            ios_backgroundColor="#E0E0E0"
                        />
                        <Text style={[styles.statusText, tempStatus && styles.statusTextActive]}>Open</Text>
                    </View>
                </View>

                {/* Products List */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Products</Text>
                    {items.length === 0 ? (
                         <Text style={styles.emptyItemsText}>No products added yet.</Text>
                    ) : (
                        items.map((item) => (
                            <View key={item.id} style={styles.productCardContainer}>
                                <TouchableOpacity style={styles.productCard} onPress={() => handleEditItem(item.id)}>
                                    <Image
                                        source={item.images?.[0] ? { uri: item.images[0] } : require('../../assets/images/no_item_image.png')}
                                        style={styles.productImage}
                                    />
                                    <View style={styles.productInfo}>
                                        <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
                                        <Text style={styles.productPrice}>${item.price.toFixed(2)}</Text>
                                        <Text style={styles.quantityText}>
                                            {item.quantity === -1 ? 'Unlimited' : item.quantity === -2 ? 'Hidden' : `Stock: ${item.quantity}`}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteItem(item.id)}>
                                    <Ionicons name="trash-outline" size={22} color="#D32F2F" />
                                </TouchableOpacity>
                            </View>
                        ))
                    )}
                    {/* Add Product Button */}
                    <TouchableOpacity style={styles.addProductButton} onPress={handleAddProduct}>
                        <Ionicons name="add-circle-outline" size={24} color="#6F4E37" />
                        <Text style={styles.addProductText}>Add New Product</Text>
                    </TouchableOpacity>
                </View>

                {/* Save Changes Button */}
                <ScreenWideButton
                    text="Save Shop Changes"
                    onPress={handleSaveChanges}
                    color="#6F4E37"
                    textColor="#FFFFFF"
                    style={styles.primaryButton}
                    disabled={saving}
                    loading={saving}
                />
            </ScrollView>

            {/* Shop Name Edit Modal */}
            <Portal>
                <Modal visible={showNameModal} onDismiss={() => setShowNameModal(false)} contentContainerStyle={styles.modalContainer}>
                    <Text style={styles.modalTitle}>Edit Shop Name</Text>
                    <TextInput
                        label="Shop Name"
                        value={tempShopName}
                        onChangeText={setTempShopName}
                        mode="outlined"
                        style={styles.modalInput}
                        theme={{ colors: { primary: '#6F4E37', background: '#FFFFFF' } }}
                        outlineColor="#CCCCCC" activeOutlineColor="#6F4E37"
                    />
                    <View style={styles.modalButtonContainer}>
                         <ScreenWideButton text="Cancel" onPress={() => { setTempShopName(shopData?.shop_name || ''); setShowNameModal(false); }} color="#FFFFFF" textColor="#555555" style={styles.secondaryButton} />
                         <ScreenWideButton text="Save" onPress={() => setShowNameModal(false)} color="#6F4E37" textColor="#FFFFFF" style={styles.primaryButtonModal} />
                    </View>
                </Modal>
            </Portal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#FFFFFF', // White background
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
    errorText: {
        color: '#D32F2F',
        fontSize: 16,
    },
    scrollView: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#EEEEEE',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#333333',
    },
    headerButton: {
        padding: 8,
    },
    headerButtonsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8, // Space between header buttons
    },
    profileSection: {
        alignItems: 'center',
        paddingVertical: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#EEEEEE',
    },
    imageContainer: {
        position: 'relative', // For camera icon overlay
    },
    profileImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#F0F0F0',
    },
    cameraIconOverlay: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        padding: 6,
        borderRadius: 15,
    },
    nameContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 16,
        gap: 8,
    },
    shopName: {
        fontSize: 22, // Slightly smaller
        fontWeight: 'bold',
        color: '#333333',
    },
    statusContainer: {
        paddingHorizontal: 16,
        paddingVertical: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#EEEEEE',
    },
    statusLabel: {
        fontSize: 16,
        fontWeight: '500',
        color: '#555555',
        marginBottom: 12,
        textAlign: 'center',
    },
    switchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    statusText: {
        fontSize: 14,
        color: '#888888',
        fontWeight: '500',
    },
    statusTextActive: {
        color: '#333333',
        fontWeight: 'bold',
    },
    section: {
        padding: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333333',
        marginBottom: 16,
    },
    productsList: {
        gap: 12, // Space between product cards
    },
    productCardContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#EEEEEE',
        overflow: 'hidden', // Ensure delete button doesn't overflow weirdly
    },
    productCard: {
        flex: 1, // Take available space
        flexDirection: 'row',
        padding: 12,
        alignItems: 'center',
    },
    productImage: {
        width: 50, // Smaller image
        height: 50,
        borderRadius: 8,
        marginRight: 12,
        backgroundColor: '#F0F0F0',
    },
    productInfo: {
        flex: 1, // Allow text to take space
    },
    productName: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333333',
        marginBottom: 2,
    },
    productPrice: {
        fontSize: 14,
        color: '#555555',
        marginBottom: 2,
    },
    quantityText: {
        fontSize: 12,
        color: '#888888',
    },
    deleteButton: {
        paddingHorizontal: 16, // Increase touch area
        paddingVertical: 20, // Match card height roughly
        alignSelf: 'stretch', // Make it fill height
        justifyContent: 'center',
        borderLeftWidth: 1,
        borderLeftColor: '#EEEEEE',
    },
    addProductButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F8F8F8', // Light grey background
        paddingVertical: 14,
        borderRadius: 12,
        marginTop: 16,
        borderWidth: 1.5,
        borderColor: '#E0E0E0',
        borderStyle: 'dashed',
        gap: 8,
    },
    addProductText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#6F4E37',
    },
    emptyItemsText: {
        textAlign: 'center',
        color: '#888888',
        fontSize: 16,
        marginVertical: 20,
    },
    primaryButton: { // Save Changes Button
        borderRadius: 12,
        paddingVertical: 14,
        margin: 16, // Add margin around the button
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
    },
    // Modal Styles
    modalContainer: {
        backgroundColor: 'white',
        padding: 24,
        marginHorizontal: 20, // Side margins
        borderRadius: 16, // More rounded
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '600',
        marginBottom: 20,
        textAlign: 'center',
        color: '#333333',
    },
    modalInput: {
        backgroundColor: '#FFFFFF',
        marginBottom: 24,
    },
    modalButtonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between', // Space out buttons
        gap: 12, // Gap between buttons
    },
    primaryButtonModal: { // Style for modal primary button
        flex: 1, // Allow buttons to share space
        borderRadius: 12,
        paddingVertical: 6, // Smaller padding for modal buttons
    },
    secondaryButton: { // Style for modal secondary button
        flex: 1,
        borderRadius: 12,
        paddingVertical: 14, // Match ScreenWideButton default
        borderWidth: 1.5,
        borderColor: "#CCCCCC", // Lighter border for cancel
    },
});
