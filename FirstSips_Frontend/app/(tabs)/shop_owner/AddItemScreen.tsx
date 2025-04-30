import { View, StyleSheet, ScrollView, TouchableOpacity, Image, Switch, SafeAreaView, Platform, KeyboardAvoidingView, Alert } from 'react-native';
import { useState } from 'react';
import { TextInput, Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/app/utils/supabase';
import { useRouter } from 'expo-router';
import ScreenWideButton from '../../components/ScreenWideButton';

const AddItemScreen = () => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [quantity, setQuantity] = useState('');
    const [isUnlimited, setIsUnlimited] = useState(false);
    const [isHidden, setIsHidden] = useState(false);
    const [images, setImages] = useState<string[]>([]);
    const [loading, setLoading] = useState(false); // Add loading state

    const router = useRouter();

    const pickImage = async () => {
        // Request permissions if not granted
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Required', 'Sorry, we need camera roll permissions to make this work!');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1], // Square aspect ratio for consistency
            quality: 0.8, // Slightly reduce quality for faster uploads
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            // Limit number of images if desired (e.g., max 3)
            if (images.length < 3) {
                setImages([...images, result.assets[0].uri]);
            } else {
                Alert.alert('Limit Reached', 'You can add a maximum of 3 images.');
            }
        }
    };

    const removeImage = (index: number) => {
        setImages(images.filter((_, i) => i !== index));
    };

    const incrementQuantity = () => {
        if (isUnlimited || isHidden) return;
        const currentQuantity = quantity === '' ? 0 : parseInt(quantity, 10);
        setQuantity((currentQuantity + 1).toString());
    };

    const decrementQuantity = () => {
        if (isUnlimited || isHidden) return;
        const currentQuantity = quantity === '' ? 0 : parseInt(quantity, 10);
        if (currentQuantity > 0) {
            setQuantity((currentQuantity - 1).toString());
        }
    };

    const handleQuantityChange = (text: string) => {
        // Only allow numbers
        if (/^\d*$/.test(text)) {
            setQuantity(text);
        }
    };

    const toggleUnlimited = (value: boolean) => {
        setIsUnlimited(value);
        if (value) {
            setIsHidden(false);
            setQuantity('');
        }
    };

    const toggleHidden = (value: boolean) => {
        setIsHidden(value);
        if (value) {
            setIsUnlimited(false);
            setQuantity('');
        }
    };

    const handleAddItem = async () => {
        setLoading(true); // Start loading
        try {
            if (!name.trim() || !description.trim() || !price.trim()) {
                Alert.alert("Validation Error", "Please fill in Name, Description, and Price.");
                setLoading(false);
                return;
            }

            if (!isUnlimited && !isHidden && quantity.trim() === '') {
                Alert.alert("Validation Error", "Please specify a quantity or select Unlimited/Hidden.");
                setLoading(false);
                return;
            }

            const parsedPrice = parseFloat(price);
            if (isNaN(parsedPrice) || parsedPrice < 0) {
                Alert.alert("Validation Error", "Please enter a valid positive price.");
                setLoading(false);
                return;
            }

            const { data: { user }, error: authError } = await supabase.auth.getUser();
            if (authError || !user) { throw new Error("Not authenticated"); }

            const { data: userData, error: userError } = await supabase
                .from("users").select("shop_id").eq("id", user.id).single();
            if (userError || !userData?.shop_id) { throw new Error("No shop found for this user"); }

            const shopId = userData.shop_id;

            let finalQuantity: number;
            if (isUnlimited) finalQuantity = -1;
            else if (isHidden) finalQuantity = -2;
            else finalQuantity = quantity.trim() === "" ? 0 : parseInt(quantity, 10);

            // TODO: Implement image uploading to Supabase Storage if needed
            // For now, assuming 'images' state holds URIs or placeholders
            const imageURLsToSave = images; // Replace with actual uploaded URLs if implementing uploads

            const { error: insertError } = await supabase.from("items").insert([
                {
                    shop_id: shopId,
                    name: name.trim(),
                    description: description.trim(),
                    price: parsedPrice,
                    quantity: finalQuantity,
                    images: imageURLsToSave, // Save the URLs
                    created_at: new Date().toISOString(),
                },
            ]);

            if (insertError) throw insertError;

            Alert.alert("Success", "Product added successfully!");
            // Navigate back to EditShopScreen, potentially passing a flag to refresh
            router.back();

        } catch (error: any) {
            console.error("Error adding product:", error);
            Alert.alert("Error", error.message || "Failed to add product");
        } finally {
            setLoading(false); // Stop loading
        }
    };

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
                    <Text style={styles.headerTitle}>Add New Item</Text>
                    <View style={styles.headerSpacer} />
                </View>

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContainer}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Product Info */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Item Details</Text>
                        <TextInput
                            label="Item Name"
                            value={name}
                            onChangeText={setName}
                            mode="outlined"
                            style={styles.input}
                            theme={{ colors: { primary: '#6F4E37', background: '#FFFFFF' } }}
                            outlineColor="#CCCCCC" activeOutlineColor="#6F4E37"
                        />
                        <TextInput
                            label="Description"
                            value={description}
                            onChangeText={setDescription}
                            mode="outlined"
                            multiline
                            numberOfLines={4}
                            style={[styles.input, styles.multilineInput]}
                            theme={{ colors: { primary: '#6F4E37', background: '#FFFFFF' } }}
                            outlineColor="#CCCCCC" activeOutlineColor="#6F4E37"
                        />
                        <TextInput
                            label="Price ($)"
                            value={price}
                            onChangeText={setPrice}
                            mode="outlined"
                            keyboardType="decimal-pad"
                            style={styles.input}
                            theme={{ colors: { primary: '#6F4E37', background: '#FFFFFF' } }}
                            outlineColor="#CCCCCC" activeOutlineColor="#6F4E37"
                        />
                    </View>

                    {/* Inventory Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Inventory</Text>
                        <View style={styles.toggleContainer}>
                            <Text style={styles.toggleLabel}>Unlimited Stock</Text>
                            <Switch
                                value={isUnlimited}
                                onValueChange={toggleUnlimited}
                                trackColor={{ false: '#CCCCCC', true: '#A5D6A7' }} // Softer green
                                thumbColor={isUnlimited ? '#66BB6A' : '#f4f3f4'}
                                ios_backgroundColor="#CCCCCC"
                                disabled={isHidden}
                            />
                        </View>
                        <View style={styles.toggleContainer}>
                            <Text style={styles.toggleLabel}>Hide Item (Not Visible to Customers)</Text>
                            <Switch
                                value={isHidden}
                                onValueChange={toggleHidden}
                                trackColor={{ false: '#CCCCCC', true: '#FFCCBC' }} // Softer red/orange
                                thumbColor={isHidden ? '#FF8A65' : '#f4f3f4'}
                                ios_backgroundColor="#CCCCCC"
                                disabled={isUnlimited}
                            />
                        </View>
                        {!isUnlimited && !isHidden && (
                            <View style={styles.quantityRow}>
                                <Text style={styles.quantityLabel}>Quantity in Stock:</Text>
                                <View style={styles.quantityControls}>
                                    <TouchableOpacity style={styles.quantityButton} onPress={decrementQuantity}>
                                        <Ionicons name="remove-outline" size={20} color="#6F4E37" />
                                    </TouchableOpacity>
                                    <TextInput
                                        value={quantity}
                                        onChangeText={handleQuantityChange}
                                        keyboardType="number-pad"
                                        style={styles.quantityInput}
                                        mode="outlined" // Use outlined for consistency
                                        dense // Make it smaller
                                        textAlign="center"
                                        theme={{ colors: { primary: '#6F4E37', background: '#FFFFFF' } }}
                                        outlineColor="#CCCCCC" activeOutlineColor="#6F4E37"
                                    />
                                    <TouchableOpacity style={styles.quantityButton} onPress={incrementQuantity}>
                                        <Ionicons name="add-outline" size={20} color="#6F4E37" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </View>

                    {/* Image Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Item Images (Max 3)</Text>
                        <View style={styles.imageContainer}>
                            {images.map((uri, index) => (
                                <View key={index} style={styles.imageWrapper}>
                                    <Image source={{ uri }} style={styles.imagePreview} />
                                    <TouchableOpacity style={styles.removeImageButton} onPress={() => removeImage(index)}>
                                        <Ionicons name="close-circle" size={24} color="#D32F2F" />
                                    </TouchableOpacity>
                                </View>
                            ))}
                            {images.length < 3 && ( // Only show add button if limit not reached
                                <TouchableOpacity style={styles.addImageButton} onPress={pickImage}>
                                    <Ionicons name="add-outline" size={32} color="#AAAAAA" />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    {/* Submit Button */}
                    <ScreenWideButton
                        text="Add Item"
                        onPress={handleAddItem}
                        color="#6F4E37" // Primary accent color
                        textColor="#FFFFFF"
                        style={styles.primaryButton}
                        disabled={loading} // Disable button while loading
                        loading={loading} // Show loading indicator on button
                    />
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#FFFFFF', // White background
    },
    keyboardAvoidingView: {
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
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#333333',
    },
    headerSpacer: {
        width: 40, // Match back button touch area
    },
    scrollView: {
        flex: 1,
    },
    scrollContainer: {
        padding: 16,
        paddingBottom: 40, // Extra padding at bottom
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 16,
        color: '#333333',
    },
    input: {
        backgroundColor: '#FFFFFF',
        marginBottom: 16, // Space between inputs
    },
    multilineInput: {
        height: 100,
        textAlignVertical: 'top',
    },
    toggleContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12, // Vertical padding
        borderBottomWidth: 1,
        borderBottomColor: '#F5F5F5', // Light separator
    },
    toggleLabel: {
        fontSize: 16,
        color: '#555555',
        flexShrink: 1, // Allow text to wrap
        marginRight: 8,
    },
    quantityRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 16, // Space above quantity controls
        paddingVertical: 8,
    },
    quantityLabel: {
        fontSize: 16,
        color: '#555555',
    },
    quantityControls: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    quantityButton: {
        width: 36, // Slightly larger button
        height: 36,
        borderRadius: 18,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    quantityInput: {
        width: 60, // Adjust width
        height: 40, // Adjust height to match buttons better
        textAlign: 'center',
        marginHorizontal: 10,
        backgroundColor: '#FFFFFF',
        fontSize: 16,
    },
    imageContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12, // Space between images
    },
    imageWrapper: {
        position: 'relative',
    },
    imagePreview: {
        width: 80, // Smaller preview
        height: 80,
        borderRadius: 8,
        backgroundColor: '#F0F0F0',
    },
    removeImageButton: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: 'rgba(255, 255, 255, 0.8)', // Semi-transparent white
        borderRadius: 12,
        padding: 2,
    },
    addImageButton: {
        width: 80,
        height: 80,
        borderRadius: 8,
        backgroundColor: '#F8F8F8', // Lighter grey
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#E0E0E0',
        borderStyle: 'dashed',
    },
    primaryButton: {
        borderRadius: 12,
        paddingVertical: 14,
        marginTop: 24, // Space above button
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
    },
});

export default AddItemScreen;
