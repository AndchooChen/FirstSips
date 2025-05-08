import { View, StyleSheet, ScrollView, TouchableOpacity, Image, Switch } from 'react-native';
import { useState } from 'react';
import { TextInput, Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/app/utils/supabase';
import { useRouter } from 'expo-router';
import ScreenWideButton from '../../components/ScreenWideButton';
import { Alert } from 'react-native'; // Use Alert for user feedback

const AddItemScreen = () => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [quantity, setQuantity] = useState('');
    const [isUnlimited, setIsUnlimited] = useState(false);
    const [isHidden, setIsHidden] = useState(false);
    const [images, setImages] = useState<string[]>([]);

    const router = useRouter();

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            setImages([...images, result.assets[0].uri]);
        } else if (!result.canceled) {
             console.log("Image picking cancelled.");
        } else {
             console.log("Image picking failed or no assets returned.");
        }
    };

    const incrementQuantity = () => {
        if (isUnlimited || isHidden) return;
        const currentQuantity = quantity === '' ? 0 : parseInt(quantity);
        setQuantity((currentQuantity + 1).toString());
    };

    const decrementQuantity = () => {
        if (isUnlimited || isHidden) return;
        const currentQuantity = quantity === '' ? 0 : parseInt(quantity);
        if (currentQuantity > 0) {
            setQuantity((currentQuantity - 1).toString());
        }
    };

    const handleQuantityChange = (text: string) => {
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
        try {
          if (!name || !description || !price) {
            Alert.alert("Missing Information", "Please fill in all required fields: Name, Description, and Price.");
            return;
          }

          if (!isUnlimited && !isHidden && (quantity === '' || parseInt(quantity) < 0)) {
            Alert.alert("Missing Information", "Please specify a valid quantity or select Unlimited/Hidden.");
            return;
          }

          const { data: { user }, error: authError } = await supabase.auth.getUser();

          if (authError || !user) {
            Alert.alert("Authentication Required", "Please log in to add items.");
            return;
          }

          const userId = user.id;

          const { data: userData, error: userError } = await supabase
            .from("users")
            .select("shop_id")
            .eq("id", userId)
            .single();

          if (userError || !userData?.shop_id) {
            Alert.alert("Shop Not Found", "No shop found for this user. Please create a shop first.");
             router.push("../../(auth)/CreateShopScreen"); // Navigate to create shop screen
            return;
          }

          const shopId = userData.shop_id;

          let finalQuantity: number | null = null;
          if (isUnlimited) finalQuantity = -1; // Use -1 for unlimited
          else if (isHidden) finalQuantity = -2; // Use -2 for hidden
          else finalQuantity = quantity === "" ? 0 : parseInt(quantity); // Use parsed quantity or 0

          const { error: insertError } = await supabase.from("items").insert([
            {
              shop_id: shopId,
              name,
              description,
              price: parseFloat(price),
              quantity: finalQuantity,
              images, // Assuming images are stored as URLs or paths
              created_at: new Date().toISOString(),
            },
          ]);

          if (insertError) {
             console.error("Error inserting item:", insertError);
             Alert.alert("Insertion Failed", "Failed to add product.");
             return;
          }

          Alert.alert("Success", "Product added successfully!");
          router.push({
            pathname: "/(tabs)/shop_owner/EditShopScreen",
            params: { shopId },
          });
        } catch (error: any) {
          console.error("Error adding product:", error);
          Alert.alert("Error", error.message || "An unexpected error occurred while adding the product.");
        }
      };


    return (
        <ScrollView contentContainerStyle={styles.scrollViewContent}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} accessibilityLabel="Go back">
                        <Ionicons name="arrow-back" size={24} color="#6F4E37" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Add Product</Text>
                </View>

                <Text style={styles.sectionTitle}>Product Details</Text>
                <View style={styles.formSection}>
                    <TextInput
                        label="Product Name"
                        value={name}
                        onChangeText={setName}
                        mode="outlined"
                        style={styles.input}
                        theme={{ colors: { primary: '#6F4E37', background: '#FFFFFF' } }}
                        outlineColor="#CCCCCC"
                        activeOutlineColor="#6F4E37"
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
                        outlineColor="#CCCCCC"
                        activeOutlineColor="#6F4E37"
                    />

                    <TextInput
                        label="Price ($)"
                        value={price}
                        onChangeText={setPrice}
                        mode="outlined"
                        keyboardType="decimal-pad"
                        style={styles.input}
                        theme={{ colors: { primary: '#6F4E37', background: '#FFFFFF' } }}
                        outlineColor="#CCCCCC"
                        activeOutlineColor="#6F4E37"
                    />
                </View>

                <Text style={styles.sectionTitle}>Inventory Management</Text>
                <View style={styles.formSection}>
                    <View style={styles.toggleContainer}>
                        <Text style={styles.toggleLabel}>Unlimited Stock</Text>
                        <Switch
                            value={isUnlimited}
                            onValueChange={toggleUnlimited}
                            trackColor={{ false: '#CCCCCC', true: '#6F4E37' }}
                            thumbColor={isUnlimited ? '#FFFFFF' : '#FFFFFF'}
                            disabled={isHidden}
                        />
                    </View>

                    <View style={styles.toggleContainer}>
                        <Text style={styles.toggleLabel}>Hide Item</Text>
                        <Switch
                            value={isHidden}
                            onValueChange={toggleHidden}
                            trackColor={{ false: '#CCCCCC', true: '#6F4E37' }}
                            thumbColor={isHidden ? '#FFFFFF' : '#FFFFFF'}
                            disabled={isUnlimited}
                        />
                    </View>

                    {!isUnlimited && !isHidden && (
                        <View style={styles.quantityContainer}>
                            <Text style={styles.quantityLabel}>Quantity in Stock:</Text>
                            <View style={styles.quantityControls}>
                                <TouchableOpacity
                                    style={styles.quantityButton}
                                    onPress={decrementQuantity}
                                    accessibilityLabel="Decrease quantity"
                                >
                                    <Ionicons name="remove-outline" size={20} color="#6F4E37" />
                                </TouchableOpacity>

                                <TextInput
                                    value={quantity}
                                    onChangeText={handleQuantityChange}
                                    keyboardType="number-pad"
                                    style={styles.quantityInput}
                                    mode="outlined"
                                    theme={{ colors: { primary: '#6F4E37', background: '#FFFFFF' } }}
                                    outlineColor="#CCCCCC"
                                    activeOutlineColor="#6F4E37"
                                />

                                <TouchableOpacity
                                    style={styles.quantityButton}
                                    onPress={incrementQuantity}
                                    accessibilityLabel="Increase quantity"
                                >
                                    <Ionicons name="add-outline" size={20} color="#6F4E37" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </View>

                <Text style={styles.sectionTitle}>Product Images</Text>
                <View style={styles.imageContainer}>
                    {images.map((uri, index) => (
                        <Image key={index} source={{ uri }} style={styles.imagePreview} />
                    ))}
                    <TouchableOpacity style={styles.addImageButton} onPress={pickImage} accessibilityLabel="Add image">
                        <Ionicons name="add-circle-outline" size={32} color="#6F4E37" />
                    </TouchableOpacity>
                </View>

                <View style={styles.buttonContainer}>
                    <ScreenWideButton
                        text="Add Product"
                        onPress={handleAddItem}
                        color="#6F4E37"
                        textColor="#FFFFFF"
                        style={styles.primaryButton}
                        disabled={!name || !description || !price || (!isUnlimited && !isHidden && quantity === '')}
                    />
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    scrollViewContent: {
        flexGrow: 1,
        backgroundColor: '#FFFFFF',
        paddingBottom: 40,
    },
    container: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 40,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
        paddingTop: 20,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        marginLeft: 16,
        color: '#333333',
    },
    formSection: {
        marginBottom: 24,
        gap: 16,
    },
    input: {
        backgroundColor: '#FFFFFF',
    },
    multilineInput: {
        minHeight: 100,
        textAlignVertical: 'top',
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 12,
        marginTop: 16,
        color: '#333333',
    },
    toggleContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#EEEEEE',
    },
     toggleLabel: {
        fontSize: 16,
        color: '#333333',
    },
    quantityContainer: {
        backgroundColor: '#FFFFFF',
        paddingVertical: 12,
    },
    quantityLabel: {
        fontSize: 16,
        marginBottom: 12,
        color: '#333333',
    },
    quantityControls: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        gap: 12,
    },
    quantityButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#CCCCCC',
    },
    quantityInput: {
        width: 80,
        textAlign: 'center',
        backgroundColor: '#FFFFFF',
    },
    imageContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 24,
    },
    imagePreview: {
        width: 80,
        height: 80,
        borderRadius: 8,
        backgroundColor: '#EEEEEE',
    },
    addImageButton: {
        width: 80,
        height: 80,
        borderRadius: 8,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#CCCCCC',
    },
    buttonContainer: {
        marginTop: 24,
        marginBottom: 40,
    },
    primaryButton: {
        borderRadius: 12,
        paddingVertical: 14,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
    },
});

export default AddItemScreen;
