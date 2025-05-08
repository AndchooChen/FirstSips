import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert } from "react-native";
import { useState } from 'react';
import { TextInput } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import ScreenWideButton from "../components/ScreenWideButton";
import { useRouter } from "expo-router";
import { supabase } from "../utils/supabase";

export default function CreateShopScreen() {
    const [shopName, setShopName] = useState("");
    const [streetAddress, setStreetAddress] = useState("");
    const [zipCode, setZipCode] = useState("");
    const [city, setCity] = useState("");
    const [state, setState] = useState("");
    const [loading, setLoading] = useState(false);

    const router = useRouter();

    const handleCreateShop = async () => {
        if (!shopName || !streetAddress || !zipCode || !city || !state) {
            Alert.alert("Missing Information", "Please fill in all shop and address details.");
            return;
        }

        setLoading(true);

        try {
            const {
                data: { user },
                error: authError,
            } = await supabase.auth.getUser();

            if (!user || authError) {
                Alert.alert("Authentication Error", "No authenticated user found. Please log in again.");
                setLoading(false);
                return;
            }

            const user_Id = user.id;

            const { data: userData, error: userError } = await supabase
                .from("users")
                .select("is_shop_owner")
                .eq("id", user_Id)
                .single();

            if (userError) {
                console.error("Error checking user shop status:", userError);
                Alert.alert("Database Error", "Failed to check your shop status.");
                setLoading(false);
                return;
            }

            if (userData?.is_shop_owner) {
                Alert.alert("Already Own a Shop", "You already own a shop!");
                setLoading(false);
                router.push("/(tabs)/shop_owner/EditShopScreen");
                return;
            }

            const { data: shopData, error: insertError } = await supabase
                .from("shops")
                .insert([
                    {
                        owner_id: user_Id,
                        shop_name: shopName,
                        description: "",
                        street_address: streetAddress,
                        city,
                        state,
                        zip: zipCode,
                        status: false,
                        created_at: new Date().toISOString(),
                    },
                ])
                .select();

            if (insertError) {
                console.error("Error inserting shop data:", insertError);
                Alert.alert("Database Error", "Failed to create your shop.");
                setLoading(false);
                return;
            }

            const CreatedShop = shopData?.[0];

            if (!CreatedShop) {
                console.error("Shop creation failed, no data returned.");
                Alert.alert("Creation Failed", "Shop creation failed, please try again.");
                setLoading(false);
                return;
            }

            const { error: userUpdateError } = await supabase
                .from("users")
                .update({ shop_id: CreatedShop.id, is_shop_owner: true })
                .eq("id", user_Id);

            if (userUpdateError) {
                console.error("Error updating user record:", userUpdateError);
                Alert.alert("Database Error", "Failed to update your user profile.");
                setLoading(false);
                return;
            }

            Alert.alert("Success", "Shop created successfully!");
            setLoading(false);
            router.push("/(tabs)/shop_owner/EditShopScreen");

        } catch (error: any) {
            console.error("Unexpected error creating shop:", error);
            Alert.alert("Error", error.message || "An unexpected error occurred while creating the shop.");
            setLoading(false);
        }
    };


    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.scrollViewContent}>
                <View style={styles.container}>
                    <View style={styles.header}>
                        <TouchableOpacity
                            onPress={() => router.back()}
                            style={styles.backButton}
                            accessibilityLabel="Go back"
                        >
                            <Ionicons name="arrow-back" size={24} color="#6F4E37"/>
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Create Your Shop</Text>
                    </View>

                    <Text style={styles.sectionTitle}>Shop Details</Text>
                    <View style={styles.formSection}>
                        <TextInput
                            style={styles.input}
                            label="Shop Name"
                            value={shopName}
                            onChangeText={setShopName}
                            mode="outlined"
                            theme={{ colors: { primary: '#6F4E37', background: '#FFFFFF' } }}
                            outlineColor="#CCCCCC"
                            activeOutlineColor="#6F4E37"
                        />
                    </View>

                    <Text style={styles.sectionTitle}>Shop Address</Text>
                    <View style={styles.formSection}>
                        <TextInput
                            label="Street Address"
                            value={streetAddress}
                            onChangeText={setStreetAddress}
                            mode="outlined"
                            style={styles.input}
                            theme={{ colors: { primary: '#6F4E37', background: '#FFFFFF' } }}
                            outlineColor="#CCCCCC"
                            activeOutlineColor="#6F4E37"
                        />
                        <TextInput
                            label="ZIP Code"
                            value={zipCode}
                            onChangeText={setZipCode}
                            mode="outlined"
                            style={styles.input}
                            keyboardType="number-pad"
                            theme={{ colors: { primary: '#6F4E37', background: '#FFFFFF' } }}
                            outlineColor="#CCCCCC"
                            activeOutlineColor="#6F4E37"
                        />
                        <TextInput
                            label="City"
                            value={city}
                            onChangeText={setCity}
                            mode="outlined"
                            style={styles.input}
                            theme={{ colors: { primary: '#6F4E37', background: '#FFFFFF' } }}
                            outlineColor="#CCCCCC"
                            activeOutlineColor="#6F4E37"
                        />
                        <TextInput
                            label="State"
                            value={state}
                            onChangeText={setState}
                            mode="outlined"
                            style={styles.input}
                            autoCapitalize="characters"
                            maxLength={2}
                            theme={{ colors: { primary: '#6F4E37', background: '#FFFFFF' } }}
                            outlineColor="#CCCCCC"
                            activeOutlineColor="#6F4E37"
                        />
                    </View>
                    {loading ? (
                       <ActivityIndicator size="large" color="#6F4E37" style={styles.loadingIndicator} />
                    ) : (
                       <View style={styles.buttonContainer}>
                           <ScreenWideButton
                                text="Create Shop"
                                onPress={handleCreateShop}
                                color="#6F4E37"
                                textColor="#FFFFFF"
                                style={styles.primaryButton}
                                disabled={!shopName || !streetAddress || !zipCode || !city || !state}
                           />
                       </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#FFFFFF",
    },
    scrollViewContent: {
        flexGrow: 1,
        paddingBottom: 40,
    },
    container: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 0, 
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
        paddingTop: 20,
    },
    backButton: {
        padding: 8,
        marginRight: 16,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333333',
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 12,
        marginTop: 16,
        color: '#333333',
    },
    formSection: {
        marginBottom: 24,
        gap: 16,
    },
    input: {
        backgroundColor: '#FFFFFF',
    },
    loadingIndicator: {
        marginVertical: 20,
    },
    buttonContainer: {
        marginTop: 24,
        marginBottom: 40,
    },
    primaryButton: {
        borderRadius: 12,
        paddingVertical: 14,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
    },
});
