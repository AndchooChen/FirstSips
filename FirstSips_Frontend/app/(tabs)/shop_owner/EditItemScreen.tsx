import { View, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useState, useEffect } from 'react';
import { TextInput, Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { FIREBASE_DB } from '../../auth/FirebaseConfig';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { useRouter, useLocalSearchParams } from 'expo-router';
import ScreenWideButton from '../../components/ScreenWideButton';

export default function EditItemScreen() {
    const { shopId, itemId } = useLocalSearchParams();
    const [name, setName] = useState('');
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [quantity, setQuantity] = useState('');
    const [images, setImages] = useState<string[]>([]);
    
    const router = useRouter();

    useEffect(() => {
        const checkStripeAccountStatus = async () => {
            const response = await fetch('http://192.168.50.84:5000/stripe/check-account-status', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });
            const data = await response.json();

            if (data.chargesEnabled && data.payoutsEnabled) {
                console.log("Stripe account fully set up!");
            } else {
                alert("Your Stripe account is not fully set up. Please complete onboarding.");
                router.back();
            }
        };

        checkStripeAccountStatus();
    }, []);

    useEffect(() => {
        const fetchItem = async () => {
            const itemDoc = await getDoc(doc(FIREBASE_DB, `shops/${shopId}/items/${itemId}`));
            if (itemDoc.exists()) {
                const data = itemDoc.data();
                setName(data.name);
                setCategory(data.category);
                setDescription(data.description);
                setPrice(data.price.toString());
                setQuantity(data.quantity.toString());
                setImages(data.images || []);
            }
        };
        fetchItem();
    }, [shopId, itemId]);

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

    const removeImage = (index: number) => {
        setImages(images.filter((_, i) => i !== index));
    };

    const handleUpdateItem = async () => {
        try {
            await updateDoc(doc(FIREBASE_DB, `shops/${shopId}/items/${itemId}`), {
                name,
                category,
                description,
                price: parseFloat(price),
                quantity: parseInt(quantity),
                images,
                updatedAt: new Date().toISOString()
            });

            alert('Item updated successfully!');
            router.back();
        } catch (error) {
            console.error('Error updating item:', error);
            alert('Failed to update item');
        }
    };

    return (
        <ScrollView style={styles.background}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color="#6F4E37" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Edit Product</Text>
                </View>

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
                        <View key={index} style={styles.imageWrapper}>
                            <Image source={{ uri }} style={styles.imagePreview} />
                            <TouchableOpacity 
                                style={styles.removeImageButton}
                                onPress={() => removeImage(index)}
                            >
                                <Ionicons name="close-circle" size={24} color="#FF6B6B" />
                            </TouchableOpacity>
                        </View>
                    ))}
                    <TouchableOpacity style={styles.addImageButton} onPress={pickImage}>
                        <Ionicons name="add-circle" size={24} color="#6F4E37" />
                    </TouchableOpacity>
                </View>

                <ScreenWideButton
                    text="Save Changes"
                    onPress={handleUpdateItem}
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
    imageWrapper: {
        position: 'relative',
    },
    imagePreview: {
        width: 100,
        height: 100,
        borderRadius: 8,
    },
    removeImageButton: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
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
        borderStyle: 'dashed',
    },
});