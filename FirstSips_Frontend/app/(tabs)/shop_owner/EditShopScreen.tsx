import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import { useState, useEffect } from 'react';
import { Switch, TextInput, Portal, Modal } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import ScreenWideButton from '../../components/ScreenWideButton';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../auth/AuthContext';
import { shopService } from '../../services/shopService';
import { useRouter } from "expo-router";
import { Shop, ShopItem } from '../../types/shop';

export default function EditShopScreen() {
    const [shop, setShop] = useState<Shop | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [profileImage, setProfileImage] = useState<string | undefined>(undefined);
    const [showNameModal, setShowNameModal] = useState(false);
    const [tempShopName, setTempShopName] = useState('');
    const [items, setItems] = useState<ShopItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const { user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        fetchShopData();
    }, []);

    const fetchShopData = async () => {
        if (!user) {
            alert('Not authenticated');
            router.push('/(auth)/LoginScreen');
            return;
        }

        try {
            // For now, we'll assume the user has only one shop
            const shops = await shopService.getAllShops();
            const userShop = shops.find(shop => shop.ownerId === user.uid);
            
            if (!userShop) {
                alert('No shop found');
                router.push('/(tabs)/shop_owner/CreateShopScreen');
                return;
            }

            setShop(userShop);
            setIsOpen(userShop.isOpen);
            setProfileImage(userShop.profileImage);
            setTempShopName(userShop.shopName);

            // Fetch shop items
            const shopItems = await shopService.getShopItems(userShop.id);
            setItems(shopItems);
        } catch (error) {
            console.error('Error fetching shop data:', error);
            alert('Failed to load shop data');
        } finally {
            setLoading(false);
        }
    };

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

    const handleOrderQueuePress = () => {
        if (!shop) return;
        router.push({
            pathname: '/(tabs)/shop_owner/OrderManagementScreen',
            params: { shopId: shop.id }
        });
    };

    const handleAddProduct = () => {
        if (!shop) {
            alert('Please create a shop first');
            router.push("/(tabs)/shop_owner/CreateShopScreen");
            return;
        }
        
        router.push("/(tabs)/shop_owner/AddItemScreen");
    };

    const handleSaveChanges = async () => {
        if (!shop) return;

        setSaving(true);
        try {
            await shopService.updateShop(shop.id, {
                shopName: tempShopName,
                isOpen,
                profileImage,
                updatedAt: new Date().toISOString()
            });

            setShop({
                ...shop,
                shopName: tempShopName,
                isOpen,
                profileImage,
                updatedAt: new Date().toISOString()
            });

            alert('Shop updated successfully!');
            router.push("/(tabs)/dashboard/DashboardScreen");
        } catch (error) {
            console.error('Error updating shop:', error);
            alert('Failed to update shop');
        } finally {
            setSaving(false);
        }
    };

    const handleEditItem = (item: ShopItem) => {
        if (!shop) return;
        
        router.push({
            pathname: "/(tabs)/shop_owner/EditItemScreen",
            params: { shopId: shop.id, itemId: item.id }
        });
    };

    if (loading) {
        return (
            <View style={styles.background}>
                <Text style={styles.loadingText}>Loading shop data...</Text>
            </View>
        );
    }

    if (!shop) {
        return (
            <View style={styles.background}>
                <Text style={styles.errorText}>Shop not found</Text>
                <ScreenWideButton
                    text="Create Shop"
                    onPress={() => router.push("/(tabs)/shop_owner/CreateShopScreen")}
                    color="#D4A373"
                    textColor="#000000"
                />
            </View>
        );
    }

    return (
        <ScrollView style={styles.background}>
            <View style={styles.header}>
                <TouchableOpacity onPress={handleHomePress}>
                    <Ionicons name="home" size={24} color="#6F4E37" />
                </TouchableOpacity>

                <Text style={styles.headerTitle}>Edit Shop</Text>

                <TouchableOpacity onPress={handleOrderQueuePress} style={styles.queueButton}>
                    <Ionicons name="list" size={24} color="#6F4E37" />
                </TouchableOpacity>
            </View>

            {/* Profile Image Section */}
            <TouchableOpacity style={styles.imageContainer} onPress={pickImage} disabled={saving}>
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
                <Text style={styles.shopName}>{shop.shopName}</Text>
                <TouchableOpacity onPress={() => setShowNameModal(true)} disabled={saving}>
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
                    disabled={saving}
                />
            </View>

            {/* Products List */}
            <View style={styles.productsHeader}>
                <Text style={styles.sectionTitle}>Products</Text>
                <TouchableOpacity onPress={handleAddProduct} disabled={saving}>
                    <Ionicons name="add-circle" size={24} color="#6F4E37" />
                </TouchableOpacity>
            </View>

            <View style={styles.productsList}>
                {items.length === 0 ? (
                    <Text style={styles.noProductsText}>No products added yet</Text>
                ) : (
                    items.map((item) => (
                        <TouchableOpacity 
                            key={item.id} 
                            style={styles.productCard}
                            onPress={() => handleEditItem(item)}
                            disabled={saving}
                        >
                            {item.images && item.images[0] && (
                                <Image source={{ uri: item.images[0] }} style={styles.productImage} />
                            )}
                            <View style={styles.productInfo}>
                                <Text style={styles.productName}>{item.name}</Text>
                                <Text style={styles.productPrice}>${item.price.toFixed(2)}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={24} color="#6F4E37" />
                        </TouchableOpacity>
                    ))
                )}
            </View>

            {/* Save Changes Button */}
            <View style={styles.buttonContainer}>
                <ScreenWideButton
                    text={saving ? "Saving..." : "Save Changes"}
                    onPress={handleSaveChanges}
                    color="#D4A373"
                    textColor="#000000"
                    disabled={saving}
                />
            </View>

            {/* Shop Name Edit Modal */}
            <Portal>
                <Modal
                    visible={showNameModal}
                    onDismiss={() => setShowNameModal(false)}
                    contentContainerStyle={styles.modal}
                >
                    <Text style={styles.modalTitle}>Edit Shop Name</Text>
                    <TextInput
                        label="Shop Name"
                        value={tempShopName}
                        onChangeText={setTempShopName}
                        mode="outlined"
                        style={styles.modalInput}
                    />
                    <View style={styles.modalButtons}>
                        <ScreenWideButton
                            text="Cancel"
                            onPress={() => {
                                setTempShopName(shop.shopName);
                                setShowNameModal(false);
                            }}
                            color="#CCCCCC"
                            textColor="#000000"
                        />
                        <ScreenWideButton
                            text="Save"
                            onPress={() => {
                                if (tempShopName.trim()) {
                                    setShowNameModal(false);
                                } else {
                                    alert('Shop name cannot be empty');
                                }
                            }}
                            color="#D4A373"
                            textColor="#000000"
                        />
                    </View>
                </Modal>
            </Portal>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    background: {
        flex: 1,
        backgroundColor: "#F5EDD8",
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        paddingTop: 48,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#6F4E37',
    },
    queueButton: {
        padding: 8,
    },
    imageContainer: {
        alignItems: 'center',
        marginVertical: 16,
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
        backgroundColor: '#E9EDC9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    nameContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 16,
    },
    shopName: {
        fontSize: 20,
        fontWeight: '600',
        color: '#6F4E37',
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        marginBottom: 24,
    },
    statusText: {
        fontSize: 16,
        color: '#6F4E37',
    },
    productsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#6F4E37',
    },
    productsList: {
        paddingHorizontal: 16,
        gap: 12,
    },
    productCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 12,
        borderRadius: 8,
        elevation: 2,
    },
    productImage: {
        width: 50,
        height: 50,
        borderRadius: 8,
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
        color: '#666666',
    },
    buttonContainer: {
        padding: 16,
        marginTop: 16,
    },
    modal: {
        backgroundColor: 'white',
        padding: 20,
        margin: 20,
        borderRadius: 8,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#6F4E37',
        marginBottom: 16,
    },
    modalInput: {
        marginBottom: 16,
        backgroundColor: 'white',
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    loadingText: {
        textAlign: 'center',
        marginTop: 24,
        fontSize: 16,
        color: '#6F4E37',
    },
    errorText: {
        textAlign: 'center',
        marginTop: 24,
        marginBottom: 16,
        fontSize: 16,
        color: '#6F4E37',
    },
    noProductsText: {
        textAlign: 'center',
        fontSize: 16,
        color: '#666666',
        marginTop: 24,
    },
});