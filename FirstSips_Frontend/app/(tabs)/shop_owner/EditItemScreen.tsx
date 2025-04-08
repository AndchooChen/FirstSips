<<<<<<< HEAD
import { View, StyleSheet, ScrollView, TouchableOpacity, Image, Switch } from 'react-native';
import { useState, useEffect } from 'react';
import { TextInput, Text, Button } from 'react-native-paper';
=======
import { View, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useState, useEffect } from 'react';
import { TextInput, Text } from 'react-native-paper';
>>>>>>> 68fb1e5fa391f1bdac2f665bb27bc781ec148f7d
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
<<<<<<< HEAD
    const [isUnlimited, setIsUnlimited] = useState(false);
    const [isHidden, setIsHidden] = useState(false);
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
=======
    const [images, setImages] = useState<string[]>([]);
    
    const router = useRouter();

    useEffect(() => {
>>>>>>> 68fb1e5fa391f1bdac2f665bb27bc781ec148f7d
        const fetchItem = async () => {
            const itemDoc = await getDoc(doc(FIREBASE_DB, `shops/${shopId}/items/${itemId}`));
            if (itemDoc.exists()) {
                const data = itemDoc.data();
                setName(data.name);
                setCategory(data.category);
                setDescription(data.description);
                setPrice(data.price.toString());
<<<<<<< HEAD
                if (data.quantity === -1) {
                    setIsUnlimited(true);
                    setQuantity('');
                } else if (data.quantity === -2) {
                    setIsHidden(true);
                    setQuantity('');
                } else {
                    setQuantity(data.quantity.toString());
                }
=======
                setQuantity(data.quantity.toString());
>>>>>>> 68fb1e5fa391f1bdac2f665bb27bc781ec148f7d
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

<<<<<<< HEAD
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

    const handleUpdateItem = async () => {
        try {
            let finalQuantity: number;

            if (isUnlimited) {
                finalQuantity = -1; // Use -1 to represent unlimited
            } else if (isHidden) {
                finalQuantity = -2; // Use -2 to represent hidden
            } else {
                finalQuantity = quantity === '' ? 0 : parseInt(quantity);
            }

=======
    const handleUpdateItem = async () => {
        try {
>>>>>>> 68fb1e5fa391f1bdac2f665bb27bc781ec148f7d
            await updateDoc(doc(FIREBASE_DB, `shops/${shopId}/items/${itemId}`), {
                name,
                category,
                description,
                price: parseFloat(price),
<<<<<<< HEAD
                quantity: finalQuantity,
=======
                quantity: parseInt(quantity),
>>>>>>> 68fb1e5fa391f1bdac2f665bb27bc781ec148f7d
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

<<<<<<< HEAD
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
=======
                <TextInput
                    label="Quantity"
                    value={quantity}
                    onChangeText={setQuantity}
                    mode="outlined"
                    keyboardType="number-pad"
                    style={styles.input}
                />
>>>>>>> 68fb1e5fa391f1bdac2f665bb27bc781ec148f7d

                {/* Image Section */}
                <Text style={styles.sectionTitle}>Product Images</Text>
                <View style={styles.imageContainer}>
                    {images.map((uri, index) => (
                        <View key={index} style={styles.imageWrapper}>
                            <Image source={{ uri }} style={styles.imagePreview} />
<<<<<<< HEAD
                            <TouchableOpacity
=======
                            <TouchableOpacity 
>>>>>>> 68fb1e5fa391f1bdac2f665bb27bc781ec148f7d
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
<<<<<<< HEAD
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
=======
>>>>>>> 68fb1e5fa391f1bdac2f665bb27bc781ec148f7d
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