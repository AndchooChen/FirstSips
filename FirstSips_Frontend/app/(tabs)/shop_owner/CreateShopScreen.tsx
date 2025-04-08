import {View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, KeyboardAvoidingView } from "react-native";
import { useState } from 'react';
import { TextInput } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { doc, setDoc, collection } from "firebase/firestore";
import { FIREBASE_AUTH, FIREBASE_DB } from "../../auth/FirebaseConfig";
import ScreenWideButton from "../../components/ScreenWideButton";
import { useRouter, useLocalSearchParams } from "expo-router";
import { createUserWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";

export default function CreateShopScreen() {
    const [shopName, setShopName] = useState("");
    const [description, setDescription] = useState("");
    const [streetAddress, setStreetAddress] = useState("");
    const [optional, setOptional] = useState("");
    const [zipCode, setZipCode] = useState("");
    const [city, setCity] = useState("");
    const [state, setState] = useState("");

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

        } catch (error: any) {
            console.error("error creating shop:", error);
            alert("Failed to create shop: " + error.message);
        }
    };

    return (
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
    );
}

const styles = StyleSheet.create({
    keyboardAvoiding: {
        flex: 1,
        backgroundColor: "#F5EDD8",
    },
    scrollContent: {
        flexGrow: 1,
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
    },
    input: {
        marginBottom: 8,
    },
    multilineInput: {
        height: 100,
    },
    buttonContainer: {
        marginTop: 24,
        marginBottom: 40,
    },
});
