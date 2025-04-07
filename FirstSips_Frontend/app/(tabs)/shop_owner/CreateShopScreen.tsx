import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useState } from 'react';
import { TextInput } from "react-native-paper";
import { SelectList } from 'react-native-dropdown-select-list';
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../auth/AuthContext";
import { shopService } from "../../services/shopService";
import ScreenWideButton from "../../components/ScreenWideButton";
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
    const [loading, setLoading] = useState(false);

    const { user } = useAuth();
    const router = useRouter();

    const deliveryOptions = [
        { label: "Pickup", value: "pickup" },
        { label: "Delivery", value: "delivery" },
        { label: "Pickup and Delivery", value: "both" }
    ];

    const validateForm = () => {
        if (!shopName.trim()) {
            alert("Please enter a shop name");
            return false;
        }
        if (!description.trim()) {
            alert("Please enter a description");
            return false;
        }
        if (!streetAddress.trim()) {
            alert("Please enter a street address");
            return false;
        }
        if (!zipCode.trim()) {
            alert("Please enter a ZIP code");
            return false;
        }
        if (!city.trim()) {
            alert("Please enter a city");
            return false;
        }
        if (!state.trim()) {
            alert("Please enter a state");
            return false;
        }
        if (!deliveryMethod) {
            alert("Please select a delivery method");
            return false;
        }
        return true;
    };

    const handleCreateShop = async () => {
        if (!user) {
            alert("No authenticated user found");
            return;
        }

        if (!validateForm()) {
            return;
        }

        setLoading(true);
        try {
            const location = `${streetAddress}${optional ? `, ${optional}` : ''}, ${city}, ${state} ${zipCode}`;
            
            await shopService.createShop({
                shopName,
                description,
                location,
                deliveryMethod,
                profileImage: undefined, // Optional profile image can be added later
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });

            alert("Shop created successfully");
            router.push("/(auth)/StripeConnectScreen");
        } catch (error: any) {
            console.error("Error creating shop:", error);
            alert("Failed to create shop: " + error.message);
        } finally {
            setLoading(false);
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
                        onChangeText={setShopName}
                        mode="outlined"
                        disabled={loading}
                    />
                    <TextInput
                        style={[styles.input, styles.multilineInput]}
                        label="Description"
                        value={description}
                        onChangeText={setDescription}
                        mode="outlined"
                        multiline
                        numberOfLines={3}
                        disabled={loading}
                    />
                </View>

                {/* Address Section */}
                <Text style={styles.sectionTitle}>Address</Text>
                <View style={styles.addressContainer}>
                    <TextInput
                        label="Street Address"
                        value={streetAddress}
                        onChangeText={setStreetAddress}
                        mode="outlined"
                        style={styles.input}
                        disabled={loading}
                    />
                    <TextInput
                        label="Apt/Suite/Other (optional)"
                        value={optional}
                        onChangeText={setOptional}
                        mode="outlined"
                        style={styles.input}
                        disabled={loading}
                    />
                    <TextInput
                        label="ZIP Code"
                        value={zipCode}
                        onChangeText={zipCode => setZipCode(zipCode.replace(/[^0-9]/g, ''))}
                        mode="outlined"
                        style={styles.input}
                        keyboardType="numeric"
                        disabled={loading}
                    />
                    <TextInput
                        label="City"
                        value={city}
                        onChangeText={setCity}
                        mode="outlined"
                        style={styles.input}
                        disabled={loading}
                    />
                    <TextInput
                        label="State"
                        value={state}
                        onChangeText={setState}
                        mode="outlined"
                        style={styles.input}
                        disabled={loading}
                    />
                </View>
            
                {/* Delivery Method Section */}
                <Text style={styles.sectionTitle}>Delivery Options</Text>
                <View style={styles.deliveryContainer}>
                    <SelectList
                        setSelected={setDeliveryMethod}
                        data={loading ? [] : deliveryOptions}
                        save="value"
                        placeholder={loading ? "Loading..." : "Select delivery method"}
                        boxStyles={{
                            backgroundColor: '#FFFFFF',
                            borderRadius: 4,
                            borderWidth: 1,
                            borderColor: '#6F4E37',
                            opacity: loading ? 0.5 : 1,
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
                        search={false}
                    />
                </View>
            
                {/* Create Button */}
                <View style={styles.buttonContainer}>
                    <ScreenWideButton
                        text={loading ? "Creating Shop..." : "Create Shop"}
                        onPress={handleCreateShop}
                        color="#D4A373"
                        textColor="#FFFFFF"
                        disabled={loading}
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
        color: '#6F4E37',
        marginLeft: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#6F4E37',
        marginBottom: 16,
    },
    shopContainer: {
        marginBottom: 24,
    },
    addressContainer: {
        marginBottom: 24,
    },
    deliveryContainer: {
        marginBottom: 32,
    },
    input: {
        marginBottom: 16,
        backgroundColor: 'white',
    },
    multilineInput: {
        height: 100,
    },
    buttonContainer: {
        marginBottom: 32,
    },
});