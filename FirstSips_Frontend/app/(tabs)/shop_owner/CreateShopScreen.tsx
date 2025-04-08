<<<<<<< HEAD
import {View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, KeyboardAvoidingView } from "react-native";
import { useState } from 'react';
import { TextInput } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { doc, setDoc, collection } from "firebase/firestore";
import { FIREBASE_AUTH, FIREBASE_DB } from "../../auth/FirebaseConfig";
import ScreenWideButton from "../../components/ScreenWideButton";
import { useRouter, useLocalSearchParams } from "expo-router";
import { createUserWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
=======
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useState } from 'react';
import { TextInput } from "react-native-paper";
import { SelectList } from 'react-native-dropdown-select-list';
import { Ionicons } from "@expo/vector-icons";
import { doc, setDoc, collection, updateDoc } from "firebase/firestore";
import { FIREBASE_AUTH, FIREBASE_DB } from "../../auth/FirebaseConfig";
import ScreenWideButton from "../../components/ScreenWideButton";
import { useRouter } from "expo-router";
>>>>>>> 68fb1e5fa391f1bdac2f665bb27bc781ec148f7d

export default function CreateShopScreen() {
    const [shopName, setShopName] = useState("");
    const [description, setDescription] = useState("");
<<<<<<< HEAD
=======

>>>>>>> 68fb1e5fa391f1bdac2f665bb27bc781ec148f7d
    const [streetAddress, setStreetAddress] = useState("");
    const [optional, setOptional] = useState("");
    const [zipCode, setZipCode] = useState("");
    const [city, setCity] = useState("");
    const [state, setState] = useState("");

<<<<<<< HEAD
    const router = useRouter();
    const params = useLocalSearchParams();
    const auth = FIREBASE_AUTH;

    const handleCreateShop = async () => {
        try {
            // Step 1: Create user
            await createUserWithEmailAndPassword(auth, params.email, params.password);

            // Step 2: Wait for auth to update
            onAuthStateChanged(auth, async (user) => {
                if (user) {
                    const userId = user.uid;

                    // Step 4: Create user profile
                    await setDoc(doc(FIREBASE_DB, "users", userId), {
                        firstName: params.firstName,
                        lastName: params.lastName,
                        email: params.email,
                        phoneNumber: params.phoneNumber,
                        isShopOwner: params.isShopOwner,
                        createdAt: new Date().toISOString(),
                        shopId: null,
                    });

                    // Step 3: Create shop document reference with auto-generated ID
                    const shopRef = doc(collection(FIREBASE_DB, "shops"));
                    const shopId = shopRef.id;

                    // Step 5: Create shop
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
                        createdAt: new Date().toISOString()
                    });

                    alert("Shop created successfully");
                    router.push("/(auth)/StripeConnectScreen");
                } else {
                    alert("User not authenticated after sign-up.");
                }
            });

=======
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
            router.push("/(tabs)/shop_owner/EditShopScreen");
>>>>>>> 68fb1e5fa391f1bdac2f665bb27bc781ec148f7d
        } catch (error: any) {
            console.error("error creating shop:", error);
            alert("Failed to create shop: " + error.message);
        }
    };

    return (
<<<<<<< HEAD
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.keyboardAvoiding}
            keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.container}>
                    <View style={styles.header}>
                        <TouchableOpacity
                            onPress={() => router.back()}
                            style={styles.backButton}
                        >
                            <Ionicons name="arrow-back" size={24} color="#6F4E37" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Create shop</Text>
                    </View>

                    <Text style={styles.sectionTitle}>Shop</Text>
                    <View style={styles.shopContainer}>
                        <TextInput
                            label="Shop Name"
                            value={shopName}
                            onChangeText={setShopName}
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
                            style={[styles.input, styles.multilineInput]}
                        />
                    </View>

                    <Text style={styles.sectionTitle}>Address</Text>
                    <View style={styles.addressContainer}>
                        <TextInput
                            label="Street Address"
                            value={streetAddress}
                            onChangeText={setStreetAddress}
                            mode="outlined"
                            style={styles.input}
                        />
                        <TextInput
                            label="Apt/Suite/Other (optional)"
                            value={optional}
                            onChangeText={setOptional}
                            mode="outlined"
                            style={styles.input}
                        />
                        <TextInput
                            label="ZIP Code"
                            value={zipCode}
                            onChangeText={setZipCode}
                            mode="outlined"
                            style={styles.input}
                        />
                        <TextInput
                            label="City"
                            value={city}
                            onChangeText={setCity}
                            mode="outlined"
                            style={styles.input}
                        />
                        <TextInput
                            label="State"
                            value={state}
                            onChangeText={setState}
                            mode="outlined"
                            style={styles.input}
                        />
                    </View>

                    <View style={styles.buttonContainer}>
                        <ScreenWideButton
                            text="Create shop"
                            onPress={handleCreateShop}
                            color="#D4A373"
                            textColor="#FFFFFF"
                        />
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
=======
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
>>>>>>> 68fb1e5fa391f1bdac2f665bb27bc781ec148f7d
    );
}

const styles = StyleSheet.create({
<<<<<<< HEAD
    keyboardAvoiding: {
        flex: 1,
        backgroundColor: "#F5EDD8",
    },
    scrollContent: {
        flexGrow: 1,
    },
=======
    background: {
        flex: 1,
        backgroundColor: "#F5EDD8",
    },
>>>>>>> 68fb1e5fa391f1bdac2f665bb27bc781ec148f7d
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
<<<<<<< HEAD
    },
    input: {
        marginBottom: 8,
=======
        gap: 12,
    },
    deliveryContainer: {
        marginBottom: 24,
    },
    input: {
        marginBottom: 12,
        backgroundColor: '#FFFFFF',
>>>>>>> 68fb1e5fa391f1bdac2f665bb27bc781ec148f7d
    },
    multilineInput: {
        height: 100,
    },
    buttonContainer: {
        marginTop: 24,
        marginBottom: 40,
<<<<<<< HEAD
    },
});
=======
    }
});
>>>>>>> 68fb1e5fa391f1bdac2f665bb27bc781ec148f7d
