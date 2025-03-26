import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useState } from 'react';
import { TextInput } from "react-native-paper";
import { SelectList } from 'react-native-dropdown-select-list';
import { Ionicons } from "@expo/vector-icons";
import { doc, setDoc, collection, updateDoc } from "firebase/firestore";
import { FIREBASE_AUTH, FIREBASE_DB } from "../../auth/FirebaseConfig";
import ScreenWideButton from "../../components/screen_wide_button";
import { useRouter } from "expo-router";

export default function CreateShopScreen() {
    const [shopName, setShopName] = useState("");
    const [description, setDescription] = useState("");

    const [streetAddress, setStreetAddress] = useState("");
    const [optional, setOptional] = useState("");
    const [zipCode, setZipCode] = useState("");
    const [city, setCity] = useState("");
    const [state, setState] = useState("");

    const [deliveryMethod, setDeliveryMethod] = useState("");

    const deliveryOptions = [
        { label: "Pickup", value: "pickup" },
        { label: "Delivery", value: "delivery" },
        { label: "Pickup and Delivery", value: "both" }
    ];

    const router = useRouter();

    const handleCreateShop = async () => {
        try {
            
            const userId = FIREBASE_AUTH.currentUser?.uid;
            if (!userId) {
                alert("No authenticated user found");
                return;
            }

            // Create a new shop document with auto-generated ID
            const shopRef = doc(collection(FIREBASE_DB, "shops"));
            const shopId = shopRef.id;

            await setDoc(shopRef, {
                shopId,
                ownerId: userId,
                shopName,
                description,
                streetAddress,
                optional,
                city,
                state,
                zipCode,
                deliveryMethod,
                createdAt: new Date().toISOString()
            });

            // Update user's document with the shop ID
            await updateDoc(doc(FIREBASE_DB, "users", userId), {
                shopId
            });

            alert("Shop created successfully");
            router.push("/(tabs)/shop/EditShopScreen");
        } catch (error: any) {
            console.error("error creating shop:", error);
            alert("Failed to create shop: " + error.message);
        }
    };

    return (
        <ScrollView style={styles.background}>
            <View style={styles.container}>
                {/* Header Section */}
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={styles.backButton}
                    >
                        <Ionicons name="arrow-back" size={24} color="#6F4E37"/>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Create Shop</Text>
                </View>

                {/* Shop Info Section */}
                <Text style={styles.sectionTitle}>Shop</Text>
            <View style={styles.shopContainer}>
                <TextInput
                    style={styles.input}
                    label="Shop Name"
                    value={shopName}
                    onChangeText={shopName => setShopName(shopName)}
                    mode="outlined"
                />
                <TextInput
                    style={[styles.input, styles.multilineInput]}
                    label="Description"
                    value={description}
                    onChangeText={description => setDescription(description)}
                    mode="outlined"
                    multiline
                    numberOfLines={3}
                />
            </View>
            {/* Address Section */}
            <Text style={styles.sectionTitle}>Address</Text>
            <View style={styles.addressContainer}>
                <TextInput
                    label="Street Address"
                    value={streetAddress}
                    onChangeText={streetAddress => setStreetAddress(streetAddress)}
                    mode="outlined"
                    style={styles.input}
                />
                <TextInput
                    label="Apt/Suite/Other (optional)"
                    value={optional}
                    onChangeText={optional => setOptional(optional)}
                    mode="outlined"
                    style={styles.input}
                />
                <TextInput
                    label="ZIP Code"
                    value={zipCode}
                    onChangeText={zipCode => setZipCode(zipCode)}
                    mode="outlined"
                    style={styles.input}
                />
                <TextInput
                    label="City"
                    value={city}
                    onChangeText={city => setCity(city)}
                    mode="outlined"
                    style={styles.input}
                />
                <TextInput
                    label="State"
                    value={state}
                    onChangeText={state => setState(state)}
                    mode="outlined"
                    style={styles.input}
                />
            </View>
            
            {/* Delivery Method Section */}
            <Text style={styles.sectionTitle}>Delivery Options</Text>
                <View style={styles.deliveryContainer}>
                    <SelectList
                        setSelected={setDeliveryMethod}
                        data={deliveryOptions}
                        save="key"
                        placeholder="Select delivery method"
                        boxStyles={{
                            backgroundColor: '#FFFFFF',
                            borderRadius: 4,
                            borderWidth: 1,
                            borderColor: '#6F4E37',
                        }}
                        inputStyles={{
                            color: '#6F4E37',
                        }}
                        dropdownStyles={{
                            backgroundColor: '#FFFFFF',
                            borderColor: '#6F4E37',
                        }}
                        dropdownTextStyles={{
                            color: '#6F4E37',
                        }}
                    />
                </View>
            
            {/* Create Button */}
            <View style={styles.buttonContainer}>
                <ScreenWideButton
                    text="Create Shop"
                    onPress={handleCreateShop}
                    color="#D4A373"
                    textColor="#FFFFFF"
                />
            </View>
        </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    background: {
        flex: 1,
        backgroundColor: "#F5EDD8",
    },
    container: {
        flex: 1,
        padding: 16,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
        paddingTop: 40,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginLeft: 16,
        color: '#6F4E37',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 12,
        color: '#6F4E37',
    },
    shopContainer: {
        marginBottom: 24,
    },
    addressContainer: {
        marginBottom: 24,
        gap: 12,
    },
    deliveryContainer: {
        marginBottom: 24,
    },
    input: {
        marginBottom: 12,
        backgroundColor: '#FFFFFF',
    },
    multilineInput: {
        height: 100,
    },
    buttonContainer: {
        marginTop: 24,
        marginBottom: 40,
    }
});