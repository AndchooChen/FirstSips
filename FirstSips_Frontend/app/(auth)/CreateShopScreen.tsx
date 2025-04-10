import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useState } from 'react';
import { TextInput } from "react-native-paper";
import { SelectList } from 'react-native-dropdown-select-list';
import { Ionicons } from "@expo/vector-icons";
import ScreenWideButton from "../components/ScreenWideButton";
import { useRouter } from "expo-router";
import { supabase } from "../utils/supabase";

export default function CreateShopScreen() {
    const [shopName, setShopName] = useState("");
    const [streetAddress, setStreetAddress] = useState("");
    const [optional, setOptional] = useState("");
    const [zipCode, setZipCode] = useState("");
    const [city, setCity] = useState("");
    const [state, setState] = useState("");

    const router = useRouter();

    const handleCreateShop = async () => {
        try {
            const {
                data: {user},
                error: authError,
            } = await supabase.auth.getUser();

            if (!user || authError) {
                alert("No authenticated user found");
                return;
            }

            const userId = user.id;

            // Insert new shop
            const { data: shopData, error: insertError } = await supabase
                .from("shops")
                .insert([
                    {
                        owner_id: userId,
                        shop_name: shopName,
                        description: "",
                        street_address: streetAddress,
                        optional,
                        city,
                        state,
                        zip: zipCode,
                        created_at: new Date().toISOString()
                    }
                ])
                .select();

            if (insertError) {
                throw insertError;
            }

            const CreatedShop = shopData[0]

            // Update user record with the shop's ID
            const { error: userUpdateError } = await supabase
                .from("user")
                .update({ shop_id: CreatedShop.id })
                .eq("id", userId)

                if (userUpdateError) {
                    throw userUpdateError
                  }
              
                alert("Shop created successfully")
                router.push("/(tabs)/shop_owner/EditShopScreen")
        } catch (error: any) {
            console.error("Error creating shop:", error)
            alert("Failed to create shop: " + error.message)
        }
    
    }

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
