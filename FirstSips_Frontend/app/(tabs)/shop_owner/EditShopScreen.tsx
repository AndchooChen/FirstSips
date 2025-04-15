import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useState, useEffect } from 'react';
import { TextInput, Portal, Modal } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import ScreenWideButton from '../../components/ScreenWideButton';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from "expo-router";
import { supabase } from '@/app/utils/supabase';

interface ShopItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
    images?: string[];
    description?: string;
    shop_id: string;
}

export default function EditShopScreen() {
    const [shopName, setShopName] = useState("My Coffee Shop");
    const [status, setStatus] = useState(false);
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const [showNameModal, setShowNameModal] = useState(false);
    const [tempShopName, setTempShopName] = useState(shopName);
    const [items, setItems] = useState<ShopItem[]>([]);
    const [stripeConnected, setStripeConnected] = useState(false);
    const router = useRouter();

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images as any,
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

    const handleOrderQueuePress = async () => {
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            alert("Not authenticated");
            return;
        }

        const { data, error } = await supabase
            .from("users")
            .select("shop_id")
            .eq("id", user.id)
            .single();

        if (error || !data?.shop_id) {
            alert("Shop not found");
            return;
        }

        router.push({
            pathname: "/(tabs)/shop_owner/OrderManagementScreen",
            params: { shopId: data.shop_id },
        });
    };


    const handleAddProduct = async () => {
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            alert("Not authenticated");
            return;
        }

        const { data, error } = await supabase
            .from("users")
            .select("shop_id")
            .eq("id", user.id)
            .single();

        if (error || !data?.shop_id) {
            alert("Please create a shop first");
            router.push("/shop_owner/CreateShopScreen" as any);
            return;
        }

        router.push("/(tabs)/shop_owner/AddItemScreen");
      };


    const handleDeleteItem = async (itemId: string) => {
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;

        const { data, error } = await supabase
            .from("users")
            .select("shop_id")
            .eq("id", user.id)
            .single();

        if (error || !data?.shop_id) {
            alert("Shop not found");
            return;
        }

        if (confirm("Are you sure you want to delete this item?")) {
            const { error: deleteError } = await supabase
                .from("items")
                .delete()
                .eq("id", itemId)
                .eq("shop_id", data.shop_id);

            if (deleteError) {
                console.error("Error deleting item:", deleteError);
                alert("Failed to delete item");
            } else {
                alert("Item deleted successfully");
            }
        }
    };

    const handleSaveChanges = async () => {
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            alert("Not authenticated");
            return;
        }

        const { data, error } = await supabase
            .from("users")
            .select("shop_id")
            .eq("id", user.id)
            .single();

        if (error || !data?.shop_id) {
            alert("No shop found");
            return;
        }

        const { error: updateError } = await supabase
            .from("shops")
            .update({
                shop_name: shopName,
                status: status,
                profile_image: profileImage || null,
                updated_at: new Date().toISOString(),
            })
            .eq("id", data.shop_id);

        if (updateError) {
            console.error("Error updating shop:", updateError);
            alert("Failed to update shop");
        } else {
            alert("Shop updated successfully!");
            router.push("/(tabs)/dashboard/DashboardScreen");
        }
    };


    useEffect(() => {
        let intervalId: any;

        const fetchShopData = async () => {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) return;

            const { data: userData } = await supabase
                .from("users")
                .select("shop_id")
                .eq("id", user.id)
                .single();

            if (!userData?.shop_id) return;

            const { data: shopData } = await supabase
                .from("shops")
                .select("*")
                .eq("id", userData.shop_id)
                .single();

            setShopName(shopData?.shop_name || "My Coffee Shop");
            setStatus(shopData?.status || false);
            setProfileImage(shopData?.profile_image || null);
            setStripeConnected(shopData?.stripe_account_id ? true : false);

            console.log(shopData);
        };

        const fetchItems = async () => {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) return;

            const { data: userData } = await supabase
                .from("users")
                .select("shop_id")
                .eq("id", user.id)
                .single();

            if (!userData?.shop_id) return;

            const fetch = async () => {
                const { data: itemsData, error } = await supabase
                    .from("items")
                    .select("*")
                    .eq("shop_id", userData.shop_id);

                if (error) {
                    console.error("Error fetching items:", error);
                } else {
                    setItems(itemsData);
                }
            };

            await fetch();

            // Poll every 10 seconds (optional)
            intervalId = setInterval(fetch, 10000);
        };

        fetchShopData();
        fetchItems();

        return () => clearInterval(intervalId);
      }, []);


    return (
        <View style={styles.background}>
            <View style={styles.header}>
                <TouchableOpacity onPress={handleHomePress} style={styles.headerButton}>
                    <Ionicons name="home" size={24} color="#6F4E37" />
                </TouchableOpacity>

                <Text style={styles.headerTitle}>Edit Shop</Text>

                <View style={styles.headerButtonsContainer}>
                    <TouchableOpacity
                        onPress={() => router.push("/(auth)/StripeConnectScreen")}
                        style={[styles.headerButton, styles.stripeButton]}
                    >
                        <View style={styles.stripeButtonContent}>
                            <Ionicons
                                name={stripeConnected ? "card" : "card-outline"}
                                size={24}
                                color={stripeConnected ? "#4CAF50" : "#6F4E37"}
                            />
                            <Text style={[styles.stripeButtonText, stripeConnected && styles.stripeConnectedText]}>
                                {stripeConnected ? "Payments" : "Payments"}
                            </Text>
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleOrderQueuePress} style={styles.headerButton}>
                        <View style={styles.stripeButtonContent}>
                            <Ionicons name="list" size={24} color="#6F4E37" />
                            <Text style={styles.stripeButtonText}>Orders</Text>
                        </View>
                    </TouchableOpacity>
                </View>
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
            <TouchableOpacity
                style={[styles.statusButton, status ? styles.openButton : styles.closedButton]}
                onPress={() => setStatus(!status)}
            >
                <Text style={styles.statusButtonText}>
                    {status ? 'OPEN' : 'CLOSED'}
                </Text>
            </TouchableOpacity>

            {/* Products List */}
            <Text style={styles.sectionTitle}>Products</Text>
            <View style={styles.productsList}>
                {items.map((item) => (
                    <View key={item.id} style={styles.productCardContainer}>
                        <TouchableOpacity
                            style={styles.productCard}
                            onPress={async () => {
                                const {
                                    data: { user },
                                } = await supabase.auth.getUser();
                                if (!user) return;

                                const { data } = await supabase
                                .from("users")
                                .select("shop_id")
                                .eq("id", user.id)
                                .single();

                                const shopId = data?.shop_id;

                                router.push({
                                    pathname: "/(tabs)/shop_owner/EditItemScreen",
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
                                <View style={styles.quantityInfo}>
                                    <Text style={styles.quantityText}>In stock: {item.quantity || 'Unlimited'}</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.deleteButton}
                            onPress={() => handleDeleteItem(item.id)}
                        >
                            <Ionicons name="trash-outline" size={24} color="#FF6B6B" />
                        </TouchableOpacity>
                    </View>
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
        justifyContent: 'space-between',
        marginBottom: 24,
        paddingTop: 40,
        paddingHorizontal: 16,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#6F4E37',
        flex: 1,
        textAlign: 'center',
    },
    headerButton: {
        padding: 8,
    },
    headerButtonsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    stripeButton: {
        marginRight: 8,
    },
    stripeButtonContent: {
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
    },
    stripeButtonText: {
        fontSize: 10,
        marginTop: 2,
        color: '#6F4E37',
    },
    stripeConnectedText: {
        color: '#4CAF50',
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
    statusButton: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 8,
        marginTop: 24,
        height: 60,
        width: '100%',
    },
    openButton: {
        backgroundColor: '#4CAF50',
    },
    closedButton: {
        backgroundColor: '#F44336',
    },
    statusButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
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
    productCardContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    productCard: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        padding: 12,
        alignItems: 'center',
    },
    deleteButton: {
        padding: 10,
        marginLeft: 8,
    },
    quantityInfo: {
        marginTop: 4,
    },
    quantityText: {
        fontSize: 12,
        color: '#666666',
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