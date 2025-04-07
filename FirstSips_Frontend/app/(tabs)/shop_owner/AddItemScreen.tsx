import { View, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useState } from 'react';
import { TextInput, Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useAuth } from '../../auth/AuthContext';
import { shopService } from '../../services/shopService';
import ScreenWideButton from '../../components/ScreenWideButton';

const AddItemScreen = () => {
    const [name, setName] = useState('');
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [quantity, setQuantity] = useState('');
    const [images, setImages] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    const router = useRouter();
    const { user } = useAuth();

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

    const handleSubmit = async () => {
        if (!user) {
            alert('You must be logged in to add items');
            return;
        }

        if (!name || !category || !description || !price || !quantity) {
            alert('Please fill in all required fields');
            return;
        }

        setLoading(true);
        try {
            // TODO: Get the shopId from context or route params
            const shopId = 'YOUR_SHOP_ID';
            await shopService.addItem(shopId, {
                name,
                category,
                description,
                price: parseFloat(price),
                quantity: parseInt(quantity, 10),
                images
            });

            alert('Item added successfully');
            router.back();
        } catch (error) {
            console.error('Error adding item:', error);
            alert('Failed to add item. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <TouchableOpacity 
                style={styles.backButton}
                onPress={() => router.back()}
            >
                <Ionicons name="arrow-back" size={24} color="#6F4E37" />
            </TouchableOpacity>

            <View style={styles.content}>
                <Text style={styles.title}>Add New Item</Text>

                <TextInput
                    label="Item Name"
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
                    numberOfLines={3}
                    style={styles.input}
                />

                <TextInput
                    label="Price"
                    value={price}
                    onChangeText={text => setPrice(text.replace(/[^0-9.]/g, ''))}
                    mode="outlined"
                    keyboardType="decimal-pad"
                    style={styles.input}
                />

                <TextInput
                    label="Quantity"
                    value={quantity}
                    onChangeText={text => setQuantity(text.replace(/[^0-9]/g, ''))}
                    mode="outlined"
                    keyboardType="number-pad"
                    style={styles.input}
                />

                <TouchableOpacity onPress={pickImage} style={styles.imageButton}>
                    <Ionicons name="image" size={24} color="#6F4E37" />
                    <Text style={styles.imageButtonText}>Add Images</Text>
                </TouchableOpacity>

                <ScrollView horizontal style={styles.imagePreviewContainer}>
                    {images.map((uri, index) => (
                        <Image
                            key={index}
                            source={{ uri }}
                            style={styles.imagePreview}
                        />
                    ))}
                </ScrollView>

                <ScreenWideButton
                    text="Add Item"
                    onPress={handleSubmit}
                    color="#D4A373"
                    textColor="#000000"
                    disabled={loading}
                />
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FEFAE0',
    },
    content: {
        padding: 20,
        paddingTop: 60,
    },
    backButton: {
        position: 'absolute',
        top: 50,
        left: 20,
        zIndex: 1,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#6F4E37',
        marginBottom: 20,
    },
    input: {
        marginBottom: 16,
        backgroundColor: 'white',
    },
    imageButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
    },
    imageButtonText: {
        marginLeft: 8,
        fontSize: 16,
        color: '#6F4E37',
    },
    imagePreviewContainer: {
        marginBottom: 16,
    },
    imagePreview: {
        width: 100,
        height: 100,
        marginRight: 8,
        borderRadius: 8,
    },
});

export default AddItemScreen;