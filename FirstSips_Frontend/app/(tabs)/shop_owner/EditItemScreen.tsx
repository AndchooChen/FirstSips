import { View, StyleSheet, ScrollView, TouchableOpacity, Image, Switch, SafeAreaView, Platform, KeyboardAvoidingView, Alert, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { TextInput, Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/app/utils/supabase';
import { useRouter, useLocalSearchParams } from 'expo-router';
import ScreenWideButton from '../../components/ScreenWideButton';

export default function EditItemScreen() {
    const { shopId, itemId } = useLocalSearchParams();
    const [name, setName] = useState('');
    // const [category, setCategory] = useState(''); // Category seems unused, removing for now
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [quantity, setQuantity] = useState('');
    const [isUnlimited, setIsUnlimited] = useState(false);
    const [isHidden, setIsHidden] = useState(false);
    const [images, setImages] = useState<string[]>([]);
    const [loading, setLoading] = useState(true); // For initial fetch
    const [saving, setSaving] = useState(false); // For saving changes

    const router = useRouter();

    // Fetch Item Data on Mount
    useEffect(() => {
        const fetchItem = async () => {
            setLoading(true);
            if (!itemId || !shopId || typeof itemId !== 'string' || typeof shopId !== 'string') {
                Alert.alert("Error", "Invalid item or shop ID.");
                setLoading(false);
                router.back();
                return;
            }

            try {
                const { data, error } = await supabase
                    .from("items")
                    .select("*")
                    .eq("id", itemId)
                    .eq("shop_id", shopId)
                    .single();

                if (error) throw error;

                setName(data.name || '');
                // setCategory(data.category || ''); // If category is needed later
                setDescription(data.description || '');
                setPrice(data.price?.toString() || '');
                setImages(data.images || []);

                if (data.quantity === -1) {
                    setIsUnlimited(true); setIsHidden(false); setQuantity('');
                } else if (data.quantity === -2) {
                    setIsHidden(true); setIsUnlimited(false); setQuantity('');
                } else {
                    setIsUnlimited(false); setIsHidden(false); setQuantity(data.quantity?.toString() || '');
                }
            } catch (error: any) {
                console.error("Error fetching item:", error);
                Alert.alert("Error", "Could not fetch item details.");
                router.back();
            } finally {
                setLoading(false);
            }
        };

        fetchItem();
    }, [shopId, itemId, router]);

    // Image Picker Logic (same as AddItemScreen)
    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') { Alert.alert('Permission Required', 'Camera roll access is needed.'); return; }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true,
            aspect: [1, 1], quality: 0.8,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            if (images.length < 3) { setImages([...images, result.assets[0].uri]); }
            else { Alert.alert('Limit Reached', 'Maximum 3 images allowed.'); }
        }
    };

    const removeImage = (index: number) => {
        setImages(images.filter((_, i) => i !== index));
    };

    // Quantity Logic (same as AddItemScreen)
    const incrementQuantity = () => { /* ... */ };
    const decrementQuantity = () => { /* ... */ };
    const handleQuantityChange = (text: string) => { /* ... */ };
    const toggleUnlimited = (value: boolean) => { /* ... */ };
    const toggleHidden = (value: boolean) => { /* ... */ };

    // Handle Update Item
    const handleUpdateItem = async () => {
        setSaving(true);
        try {
            // Validation (similar to AddItemScreen)
            if (!name.trim() || !description.trim() || !price.trim()) { throw new Error("Please fill in Name, Description, and Price."); }
            if (!isUnlimited && !isHidden && quantity.trim() === '') { throw new Error("Please specify quantity or select Unlimited/Hidden."); }
            const parsedPrice = parseFloat(price);
            if (isNaN(parsedPrice) || parsedPrice < 0) { throw new Error("Please enter a valid positive price."); }

            let finalQuantity: number;
            if (isUnlimited) finalQuantity = -1;
            else if (isHidden) finalQuantity = -2;
            else finalQuantity = quantity.trim() === "" ? 0 : parseInt(quantity, 10);

            // TODO: Handle image uploads/updates if necessary
            const imageURLsToSave = images;

            const { error } = await supabase
                .from("items")
                .update({
                    name: name.trim(),
                    // category, // Add back if needed
                    description: description.trim(),
                    price: parsedPrice,
                    quantity: finalQuantity,
                    images: imageURLsToSave,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", itemId)
                .eq("shop_id", shopId); // Ensure update is for the correct shop

            if (error) throw error;

            Alert.alert("Success", "Item updated successfully!");
            router.back(); // Go back after successful update

        } catch (error: any) {
            console.error("Error updating item:", error);
            Alert.alert("Error", error.message || "Failed to update item");
        } finally {
            setSaving(false);
        }
    };

    // Handle Delete Item
    const handleDeleteItem = async () => {
        Alert.alert(
            "Confirm Deletion",
            "Are you sure you want to permanently delete this item?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete", style: "destructive",
                    onPress: async () => {
                        setSaving(true); // Use saving state for deletion as well
                        try {
                            const { error } = await supabase
                                .from("items")
                                .delete()
                                .eq("id", itemId)
                                .eq("shop_id", shopId); // Important: ensure correct shop

                            if (error) throw error;

                            Alert.alert("Success", "Item deleted successfully.");
                            router.back(); // Go back after deletion
                        } catch (error: any) {
                            console.error("Error deleting item:", error);
                            Alert.alert("Error", error.message || "Failed to delete item.");
                            setSaving(false);
                        }
                        // No finally here, as navigation happens on success
                    }
                }
            ]
        );
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

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                style={styles.keyboardAvoidingView}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#555555" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Edit Item</Text>
                    {/* Delete Button in Header */}
                    <TouchableOpacity onPress={handleDeleteItem} style={styles.deleteButtonHeader} disabled={saving}>
                        <Ionicons name="trash-outline" size={24} color="#D32F2F" />
                    </TouchableOpacity>
                </View>

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContainer}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Item Details Section (similar to AddItemScreen) */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Item Details</Text>
                        <TextInput label="Item Name" value={name} onChangeText={setName} mode="outlined" style={styles.input} theme={{ colors: { primary: '#6F4E37', background: '#FFFFFF' } }} outlineColor="#CCCCCC" activeOutlineColor="#6F4E37" />
                        {/* <TextInput label="Category" value={category} onChangeText={setCategory} mode="outlined" style={styles.input} theme={{ colors: { primary: '#6F4E37', background: '#FFFFFF' } }} outlineColor="#CCCCCC" activeOutlineColor="#6F4E37" /> */}
                        <TextInput label="Description" value={description} onChangeText={setDescription} mode="outlined" multiline numberOfLines={4} style={[styles.input, styles.multilineInput]} theme={{ colors: { primary: '#6F4E37', background: '#FFFFFF' } }} outlineColor="#CCCCCC" activeOutlineColor="#6F4E37" />
                        <TextInput label="Price ($)" value={price} onChangeText={setPrice} mode="outlined" keyboardType="decimal-pad" style={styles.input} theme={{ colors: { primary: '#6F4E37', background: '#FFFFFF' } }} outlineColor="#CCCCCC" activeOutlineColor="#6F4E37" />
                    </View>

                    {/* Inventory Section (same as AddItemScreen) */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Inventory</Text>
                        {/* ... Switches and Quantity Controls ... */}
                         <View style={styles.toggleContainer}>
                            <Text style={styles.toggleLabel}>Unlimited Stock</Text>
                            <Switch value={isUnlimited} onValueChange={toggleUnlimited} trackColor={{ false: '#CCCCCC', true: '#A5D6A7' }} thumbColor={isUnlimited ? '#66BB6A' : '#f4f3f4'} ios_backgroundColor="#CCCCCC" disabled={isHidden} />
                        </View>
                        <View style={styles.toggleContainer}>
                            <Text style={styles.toggleLabel}>Hide Item</Text>
                            <Switch value={isHidden} onValueChange={toggleHidden} trackColor={{ false: '#CCCCCC', true: '#FFCCBC' }} thumbColor={isHidden ? '#FF8A65' : '#f4f3f4'} ios_backgroundColor="#CCCCCC" disabled={isUnlimited} />
                        </View>
                        {!isUnlimited && !isHidden && (
                            <View style={styles.quantityRow}>
                                <Text style={styles.quantityLabel}>Quantity:</Text>
                                <View style={styles.quantityControls}>
                                    <TouchableOpacity style={styles.quantityButton} onPress={decrementQuantity}><Ionicons name="remove-outline" size={20} color="#6F4E37" /></TouchableOpacity>
                                    <TextInput value={quantity} onChangeText={handleQuantityChange} keyboardType="number-pad" style={styles.quantityInput} mode="outlined" dense textAlign="center" theme={{ colors: { primary: '#6F4E37', background: '#FFFFFF' } }} outlineColor="#CCCCCC" activeOutlineColor="#6F4E37" />
                                    <TouchableOpacity style={styles.quantityButton} onPress={incrementQuantity}><Ionicons name="add-outline" size={20} color="#6F4E37" /></TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </View>

                    {/* Image Section (same as AddItemScreen) */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Item Images (Max 3)</Text>
                        <View style={styles.imageContainer}>
                            {images.map((uri, index) => (
                                <View key={index} style={styles.imageWrapper}>
                                    <Image source={{ uri }} style={styles.imagePreview} />
                                    <TouchableOpacity style={styles.removeImageButton} onPress={() => removeImage(index)}><Ionicons name="close-circle" size={24} color="#D32F2F" /></TouchableOpacity>
                                </View>
                            ))}
                            {images.length < 3 && (<TouchableOpacity style={styles.addImageButton} onPress={pickImage}><Ionicons name="add-outline" size={32} color="#AAAAAA" /></TouchableOpacity>)}
                        </View>
                    </View>

                    {/* Save Button */}
                    <ScreenWideButton
                        text="Save Changes"
                        onPress={handleUpdateItem}
                        color="#6F4E37" // Primary accent color
                        textColor="#FFFFFF"
                        style={styles.primaryButton}
                        disabled={saving} // Disable while saving/deleting
                        loading={saving} // Show loading indicator
                    />
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

// Use the same styles as AddItemScreen, potentially adding specific ones if needed
const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
    keyboardAvoidingView: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#EEEEEE' },
    backButton: { padding: 8 },
    headerTitle: { fontSize: 20, fontWeight: '600', color: '#333333' },
    deleteButtonHeader: { padding: 8, width: 40, alignItems: 'center' }, // Ensure consistent width
    scrollView: { flex: 1 },
    scrollContainer: { padding: 16, paddingBottom: 40 },
    section: { marginBottom: 24 },
    sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 16, color: '#333333' },
    input: { backgroundColor: '#FFFFFF', marginBottom: 16 },
    multilineInput: { height: 100, textAlignVertical: 'top' },
    toggleContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
    toggleLabel: { fontSize: 16, color: '#555555', flexShrink: 1, marginRight: 8 },
    quantityRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingVertical: 8 },
    quantityLabel: { fontSize: 16, color: '#555555' },
    quantityControls: { flexDirection: 'row', alignItems: 'center' },
    quantityButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E0E0E0' },
    quantityInput: { width: 60, height: 40, textAlign: 'center', marginHorizontal: 10, backgroundColor: '#FFFFFF', fontSize: 16 },
    imageContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    imageWrapper: { position: 'relative' },
    imagePreview: { width: 80, height: 80, borderRadius: 8, backgroundColor: '#F0F0F0' },
    removeImageButton: { position: 'absolute', top: -8, right: -8, backgroundColor: 'rgba(255, 255, 255, 0.8)', borderRadius: 12, padding: 2 },
    addImageButton: { width: 80, height: 80, borderRadius: 8, backgroundColor: '#F8F8F8', justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: '#E0E0E0', borderStyle: 'dashed' },
    primaryButton: { borderRadius: 12, paddingVertical: 14, marginTop: 24, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 1.41 },
});
