import { View, StyleSheet, KeyboardAvoidingView, ScrollView, Platform, Text, TouchableOpacity, SafeAreaView, ActivityIndicator } from "react-native";
import { useState } from "react";
import { TextInput } from 'react-native-paper';
import { formatPhoneNumber, validateForm } from "../utils/signUpUtils"; // Assuming these utility functions exist
import ScreenWideButton from "../components/ScreenWideButton";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import { supabase } from "../utils/supabase";
import { signUpWithEmail } from "../auth/auth";

const SignUpScreen = () => {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [passwordVisible, setPasswordVisible] = useState(false);
    const params = useLocalSearchParams();
    const isShopOwner = params.isShopOwner === 'true';
    const router = useRouter();

    const handleSignUp = async () => {
        // Basic validation check - enhance validateForm for specific feedback
        if (!validateForm(firstName, lastName, email, password, phoneNumber)) {
            alert("Please fill in all fields correctly.");
            return;
        }

        setLoading(true);
        const { data, error: authError } = await signUpWithEmail(email, password);

        if (authError) {
            console.log('Sign up error:', authError.message);
            alert("Sign up failed: " + authError.message);
            setLoading(false);
            return;
        }

        const user = data?.user;

        if (user) {
            const { error: insertError } = await supabase
                .from('users')
                .insert([
                    {
                        id: user.id,
                        email: email,
                        first_name: firstName,
                        last_name: lastName,
                        phone_number: phoneNumber,
                        is_shop_owner: isShopOwner,
                        shop_id: null,
                    }
                ]);

            if (insertError) {
                console.log("Error inserting user profile: ", insertError.message);
                alert("Failed to create user profile: " + insertError.message);
                // TODO: Consider deleting the auth user if profile creation fails
                setLoading(false);
                return;
            } else {
                console.log("User profile created for:", user.id);
            }
        } else {
            // Handle case where user is null after successful signup (should not happen ideally)
            console.error("User object is null after successful sign up.");
            alert("An unexpected error occurred during sign up.");
            setLoading(false);
            return;
        }

        setLoading(false);
        console.log("Sign up successful, navigating...");

        // Navigate based on account type
        if (isShopOwner) {
            router.replace("./CreateShopScreen"); // Use replace to prevent back navigation
        } else {
            router.replace("../(tabs)/dashboard/DashboardScreen"); // Use replace
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                style={styles.keyboardAvoidingView}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
            >
                {/* Back Button */}
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                    accessibilityLabel="Go back"
                >
                    <Ionicons name="arrow-back" size={24} color="#555555" />
                </TouchableOpacity>

                <ScrollView
                    contentContainerStyle={styles.scrollContainer}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <Text style={styles.titleText}>
                        {isShopOwner ? "Create Shop Owner Account" : "Create Customer Account"}
                    </Text>
                    <Text style={styles.subtitleText}>Let's get you started!</Text>

                    {/* Form Container */}
                    <View style={styles.formContainer}>
                        <TextInput
                            label="First name"
                            value={firstName}
                            onChangeText={setFirstName}
                            mode="outlined"
                            style={styles.input}
                            theme={{ colors: { primary: '#6F4E37', background: '#FFFFFF' } }}
                            outlineColor="#CCCCCC"
                            activeOutlineColor="#6F4E37"
                        />
                        <TextInput
                            label="Last name"
                            value={lastName}
                            onChangeText={setLastName}
                            mode="outlined"
                            style={styles.input}
                            theme={{ colors: { primary: '#6F4E37', background: '#FFFFFF' } }}
                            outlineColor="#CCCCCC"
                            activeOutlineColor="#6F4E37"
                        />
                        <TextInput
                            label="Phone number"
                            value={phoneNumber}
                            onChangeText={(text) => setPhoneNumber(formatPhoneNumber(text))}
                            mode="outlined"
                            placeholder="(XXX) XXX-XXXX"
                            keyboardType="phone-pad" // Use phone-pad
                            maxLength={14}
                            style={styles.input}
                            theme={{ colors: { primary: '#6F4E37', background: '#FFFFFF' } }}
                            outlineColor="#CCCCCC"
                            activeOutlineColor="#6F4E37"
                        />
                        <TextInput
                            label="Email"
                            value={email}
                            onChangeText={setEmail}
                            mode="outlined"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            style={styles.input}
                            theme={{ colors: { primary: '#6F4E37', background: '#FFFFFF' } }}
                            outlineColor="#CCCCCC"
                            activeOutlineColor="#6F4E37"
                        />
                        <TextInput
                            label="Password"
                            value={password}
                            onChangeText={setPassword}
                            mode="outlined"
                            secureTextEntry={!passwordVisible}
                            style={styles.input}
                            theme={{ colors: { primary: '#6F4E37', background: '#FFFFFF' } }}
                            outlineColor="#CCCCCC"
                            activeOutlineColor="#6F4E37"
                            right={
                                <TextInput.Icon
                                    icon={passwordVisible ? "eye-off" : "eye"}
                                    onPress={() => setPasswordVisible(!passwordVisible)}
                                    color="#888888"
                                />
                            }
                        />

                        {/* Loading Indicator or Button */}
                        {loading ? (
                            <ActivityIndicator size="large" color="#6F4E37" style={styles.loadingIndicator} />
                        ) : (
                            <ScreenWideButton
                                text={isShopOwner ? "Continue to Shop Details" : "Sign up"}
                                onPress={handleSignUp}
                                color="#6F4E37" // Primary button style
                                textColor="#FFFFFF"
                                style={styles.primaryButton}
                                disabled={!firstName || !lastName || !email || !password || !phoneNumber}
                            />
                        )}
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#FFFFFF", // Clean white background
    },
    keyboardAvoidingView: {
        flex: 1,
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
        paddingBottom: 40,
        paddingTop: 80, // Extra padding for back button
    },
    backButton: {
        position: 'absolute',
        top: 50, // Adjust as needed
        left: 16,
        padding: 8,
        zIndex: 1,
    },
    titleText: {
        fontSize: 28,
        fontWeight: "bold",
        textAlign: "center",
        color: "#333333",
        marginBottom: 8,
    },
    subtitleText: {
        fontSize: 16,
        textAlign: "center",
        color: "#555555",
        marginBottom: 32,
    },
    formContainer: {
        width: '100%',
        gap: 16,
        maxWidth: 400,
        alignSelf: 'center',
    },
    input: {
        backgroundColor: '#FFFFFF',
    },
    loadingIndicator: {
        marginVertical: 20,
        alignSelf: 'center',
    },
    primaryButton: {
        borderRadius: 12,
        paddingVertical: 14,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
        marginTop: 16, // Add margin top to separate from inputs
    },
});

export default SignUpScreen;
