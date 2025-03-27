import { View, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
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

    const handleAddItem = async () => {
        try {
            // Validate inputs
            if (!name || !category || !description || !price || !quantity) {
                alert('Please fill in all required fields');
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
            
            await setDoc(itemRef, {
                itemId: itemRef.id,
                shopId,
                name,
                category,
                description,
                price: parseFloat(price),
                quantity: parseInt(quantity),
                images,
                createdAt: new Date().toISOString()
            });
    
            alert('Product added successfully!');
            router.push({
                pathname: "/(tabs)/shop/EditShopScreen",
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

                <TextInput
                    label="Quantity"
                    value={quantity}
                    onChangeText={setQuantity}
                    mode="outlined"
                    keyboardType="number-pad"
                    style={styles.input}
                />

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