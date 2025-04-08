import { View, StyleSheet, ScrollView, TouchableOpacity, Image, Switch } from 'react-native';
import { useState } from 'react';
import { TextInput, Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { FIREBASE_DB, FIREBASE_AUTH } from '../../auth/FirebaseConfig';
import { doc, collection, setDoc, getDoc } from 'firebase/firestore';
import { useRouter } from 'expo-router';
import ScreenWideButton from '../../components/ScreenWideButton';

const AddItemScreen = () => {
    const [name, setName] = useState('');
    const [category, setCategory] = useState('');
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

        if (!result.canceled) {
            setImages([...images, result.assets[0].uri]);
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
        try {
            // Validate inputs
            if (!name || !category || !description || !price) {
                alert('Please fill in all required fields');
                return;
            }

            if (!isUnlimited && !isHidden && !quantity) {
                alert('Please specify a quantity or select Unlimited/Hidden');
                return;
            }

            // Get current user's shop ID
            const userId = FIREBASE_AUTH.currentUser?.uid;
            if (!userId) {
                alert('Not authenticated');
                return;
            }

            const userDoc = await getDoc(doc(FIREBASE_DB, "users", userId));
            const shopId = userDoc.data()?.shopId;

            if (!shopId) {
                alert('No shop found for this user');
                return;
            }

            // Create item in shop's items subcollection
            const itemRef = doc(collection(FIREBASE_DB, `shops/${shopId}/items`));

            let finalQuantity: number;

            if (isUnlimited) {
                finalQuantity = -1; // Use -1 to represent unlimited
            } else if (isHidden) {
                finalQuantity = -2; // Use -2 to represent hidden
            } else {
                finalQuantity = quantity === '' ? 0 : parseInt(quantity);
            }

            await setDoc(itemRef, {
                itemId: itemRef.id,
                shopId,
                name,
                category,
                description,
                price: parseFloat(price),
                quantity: finalQuantity,
                images,
                createdAt: new Date().toISOString()
            });

            alert('Product added successfully!');
            router.push({
                pathname: "/(tabs)/shop_owner/EditShopScreen",
                params: { shopId }
            });
        } catch (error) {
            console.error('Error adding product:', error);
            alert('Failed to add product');
        }
    };

    return (
        <ScrollView style={styles.background}>
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color="#6F4E37" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Add Product</Text>
                </View>

                {/* Product Info */}
                <TextInput
                    label="Product Name"
                    value={name}
                    onChangeText={setName}
                    mode="outlined"
                    style={styles.input}
                />

                <TextInput
                    label="Category"
                    value={category}
                    onChangeText={setCategory}
                    mode="outlined"
                    style={styles.input}
                />

                <TextInput
                    label="Description"
                    value={description}
                    onChangeText={setDescription}
                    mode="outlined"
                    multiline
                    numberOfLines={4}
                    style={[styles.input, styles.multilineInput]}
                />

                <TextInput
                    label="Price ($)"
                    value={price}
                    onChangeText={setPrice}
                    mode="outlined"
                    keyboardType="decimal-pad"
                    style={styles.input}
                />

                {/* Quantity Section */}
                <Text style={styles.sectionTitle}>Inventory Management</Text>

                <View style={styles.toggleContainer}>
                    <Text>Unlimited Stock</Text>
                    <Switch
                        value={isUnlimited}
                        onValueChange={toggleUnlimited}
                        trackColor={{ false: '#767577', true: '#D4A373' }}
                        thumbColor={isUnlimited ? '#f5dd4b' : '#f4f3f4'}
                        disabled={isHidden}
                    />
                </View>

                <View style={styles.toggleContainer}>
                    <Text>Hide Item</Text>
                    <Switch
                        value={isHidden}
                        onValueChange={toggleHidden}
                        trackColor={{ false: '#767577', true: '#D4A373' }}
                        thumbColor={isHidden ? '#f5dd4b' : '#f4f3f4'}
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
                            >
                                <Ionicons name="remove" size={20} color="#6F4E37" />
                            </TouchableOpacity>

                            <TextInput
                                value={quantity}
                                onChangeText={handleQuantityChange}
                                keyboardType="number-pad"
                                style={styles.quantityInput}
                                mode="outlined"
                            />

                            <TouchableOpacity
                                style={styles.quantityButton}
                                onPress={incrementQuantity}
                            >
                                <Ionicons name="add" size={20} color="#6F4E37" />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Image Section */}
                <Text style={styles.sectionTitle}>Product Images</Text>
                <View style={styles.imageContainer}>
                    {images.map((uri, index) => (
                        <Image key={index} source={{ uri }} style={styles.imagePreview} />
                    ))}
                    <TouchableOpacity style={styles.addImageButton} onPress={pickImage}>
                        <Ionicons name="add-circle" size={24} color="#6F4E37" />
                    </TouchableOpacity>
                </View>

                {/* Submit Button */}
                <ScreenWideButton
                    text="Add Product"
                    onPress={handleAddItem}  // Changed from handleCreateItem to handleAddItem
                    color="#D4A373"
                    textColor="#FFFFFF"
                />
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    background: {
        flex: 1,
        backgroundColor: '#F5EDD8',
    },
    container: {
        padding: 16,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
        paddingTop: 40,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginLeft: 16,
        color: '#6F4E37',
    },
    input: {
        marginBottom: 16,
        backgroundColor: '#FFFFFF',
    },
    multilineInput: {
        height: 100,
    },
    toggleContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 8,
        marginBottom: 12,
    },
    quantityContainer: {
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 8,
        marginBottom: 16,
    },
    quantityLabel: {
        fontSize: 16,
        marginBottom: 12,
        color: '#6F4E37',
    },
    quantityControls: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    quantityButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    quantityInput: {
        width: 80,
        textAlign: 'center',
        marginHorizontal: 12,
        backgroundColor: '#FFFFFF',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 12,
        color: '#6F4E37',
    },
    imageContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 24,
    },
    imagePreview: {
        width: 100,
        height: 100,
        borderRadius: 8,
    },
    addImageButton: {
        width: 100,
        height: 100,
        borderRadius: 8,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#6F4E37',
    },
});

export default AddItemScreen;