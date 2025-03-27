import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useState, useEffect } from 'react';
import { Switch, TextInput, Portal, Modal } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import ScreenWideButton from '../../components/ScreenWideButton';
import * as ImagePicker from 'expo-image-picker';
import { FIREBASE_AUTH, FIREBASE_DB } from '../../auth/FirebaseConfig';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { useRouter } from "expo-router";
import { collection, query, onSnapshot } from 'firebase/firestore';

export default function EditShopScreen() {
    const [shopName, setShopName] = useState("My Coffee Shop");
    const [isOpen, setIsOpen] = useState(false);
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const [showNameModal, setShowNameModal] = useState(false);
    const [tempShopName, setTempShopName] = useState(shopName);
    const [items, setItems] = useState([]);

    const router = useRouter();

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
        });

        if (!result.canceled) {
            setProfileImage(result.assets[0].uri);
        }
    };

    const handleHomePress = () => {
        router.push("/(tabs)/dashboard/DashboardScreen");
    };

    const handleAddProduct = async () => {
        const userId = FIREBASE_AUTH.currentUser?.uid;
        if (!userId) {
            alert('Not authenticated');
            return;
        }
    
        const userDoc = await getDoc(doc(FIREBASE_DB, "users", userId));
        const shopId = userDoc.data()?.shopId;
    
        if (!shopId) {
            alert('Please create a shop first');
            router.push("/(tabs)/shop/CreateShopScreen");
            return;
        }
    
        router.push("/(tabs)/shop/AddItemScreen");
    };

    const handleSaveChanges = async () => {
        try {
            const userId = FIREBASE_AUTH.currentUser?.uid;
            if (!userId) {
                alert('Not authenticated');
                return;
            }

            // Get user's shop ID
            const userDoc = await getDoc(doc(FIREBASE_DB, "users", userId));
            const shopId = userDoc.data()?.shopId;

            if (!shopId) {
                alert('No shop found');
                return;
            }

            // Update shop document
            await updateDoc(doc(FIREBASE_DB, "shops", shopId), {
                shopName,
                isOpen,
                profileImage,
                updatedAt: new Date().toISOString()
            });

            alert('Shop updated successfully!');
            router.push("/(tabs)/dashboard/DashboardScreen");
        } catch (error) {
            console.error('Error updating shop:', error);
            alert('Failed to update shop');
        }
    };

    useEffect(() => {
        const fetchItems = async () => {
            const userId = FIREBASE_AUTH.currentUser?.uid;
            if (!userId) return;

            const userDoc = await getDoc(doc(FIREBASE_DB, "users", userId));
            const shopId = userDoc.data()?.shopId;
            if (!shopId) return;

            const itemsQuery = query(collection(FIREBASE_DB, `shops/${shopId}/items`));
            
            const unsubscribe = onSnapshot(itemsQuery, (snapshot) => {
                const itemsList = [];
                snapshot.forEach((doc) => {
                    itemsList.push({ id: doc.id, ...doc.data() });
                });
                setItems(itemsList);
            });

            return () => unsubscribe();
        };

        fetchItems();
    }, []);

    return (
        <View style={styles.background}>
            <View style={styles.header}>
                <TouchableOpacity onPress={handleHomePress}>
                    <Ionicons name="home" size={24} color="#6F4E37" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Edit Shop</Text>
            </View>

            {/* Profile Image Section */}
            <TouchableOpacity style={styles.imageContainer} onPress={pickImage}>
                {profileImage ? (
                    <Image source={{ uri: profileImage }} style={styles.profileImage} />
                ) : (
                    <View style={styles.imagePlaceholder}>
                        <Ionicons name="camera" size={40} color="#6F4E37" />
                    </View>
                )}
            </TouchableOpacity>

            {/* Shop Name Section */}
            <View style={styles.nameContainer}>
                <Text style={styles.shopName}>{shopName}</Text>
                <TouchableOpacity onPress={() => setShowNameModal(true)}>
                    <Ionicons name="pencil" size={24} color="#6F4E37" />
                </TouchableOpacity>
            </View>

            {/* Shop Status Section */}
            <View style={styles.statusContainer}>
                <Text style={styles.statusText}>Shop is {isOpen ? 'Open' : 'Closed'}</Text>
                <Switch
                    value={isOpen}
                    onValueChange={setIsOpen}
                    color="#D4A373"
                />
            </View>

            {/* Products List */}
            <Text style={styles.sectionTitle}>Products</Text>
            <View style={styles.productsList}>
                {items.map((item) => (
                    <TouchableOpacity 
                        key={item.id} 
                        style={styles.productCard}
                        onPress={async () => {
                            const userId = FIREBASE_AUTH.currentUser?.uid;
                            if (!userId) return;
                            
                            // Fetch user document
                            const userDoc = await getDoc(doc(FIREBASE_DB, "users", userId));
                            const shopId = userDoc.data()?.shopId;
                            
                            if (!shopId) {
                                alert('Shop not found');
                                return;
                            }
                
                            router.push({
                                pathname: "/(tabs)/shop/EditItemScreen",
                                params: { shopId: shopId, itemId: item.id }
                            });
                        }}
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
                            <Text style={styles.productPrice}>${item.price}</Text>
                        </View>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Add Product Button */}
            <TouchableOpacity style={styles.addProductButton} onPress={() => {handleAddProduct()}}>
                <Ionicons name="add-circle" size={32} color="#D4A373" />
                <Text style={styles.addProductText}>Add New Product</Text>
            </TouchableOpacity>

            {/* Shop Name Edit Modal */}
            <Portal>
                <Modal
                    visible={showNameModal}
                    onDismiss={() => setShowNameModal(false)}
                    contentContainerStyle={styles.modal}
                >
                    <TextInput
                        label="Shop Name"
                        value={tempShopName}
                        onChangeText={setTempShopName}
                        mode="outlined"
                        style={styles.modalInput}
                    />
                    <ScreenWideButton
                        text="Save"
                        onPress={() => {
                            setShopName(tempShopName);
                            setShowNameModal(false);
                        }}
                        color="#D4A373"
                        textColor="#FFFFFF"
                    />
                </Modal>
            </Portal>

            <View style={styles.saveButtonContainer}>
                <ScreenWideButton
                    text="Confirm Edits"
                    onPress={handleSaveChanges}
                    color="#D4A373"
                    textColor="#FFFFFF"
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    background: {
        backgroundColor: "#F5EDD8",
        flex: 1,
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
    imageContainer: {
        alignItems: 'center',
        marginTop: 32,
    },
    profileImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
    },
    imagePlaceholder: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#6F4E37',
    },
    nameContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 16,
        gap: 8,
    },
    shopName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#6F4E37',
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 8,
        marginTop: 24,
    },
    statusText: {
        fontSize: 16,
        color: '#6F4E37',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#6F4E37',
        marginTop: 20,
        marginBottom: 10,
        paddingHorizontal: 10,
    },
    productsList: {
        marginTop: 16,
        gap: 12,
    },
    productCard: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        padding: 12,
        alignItems: 'center',
    },
    productImage: {
        width: 60,
        height: 60,
        borderRadius: 4,
        marginRight: 12,
    },
    productInfo: {
        flex: 1,
    },
    productName: {
        fontSize: 16,
        fontWeight: '500',
        color: '#6F4E37',
    },
    productPrice: {
        fontSize: 14,
        color: '#6F4E37',
        marginTop: 4,
    },
    addProductButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 8,
        marginTop: 16,
        gap: 8,
    },
    addProductText: {
        fontSize: 16,
        color: '#6F4E37',
    },
    modal: {
        backgroundColor: 'white',
        padding: 20,
        margin: 20,
        borderRadius: 8,
    },
    modalInput: {
        marginBottom: 16,
    },
    saveButtonContainer: {
        position: 'absolute',
        bottom: 20,
        left: 16,
        right: 16,
    }
});