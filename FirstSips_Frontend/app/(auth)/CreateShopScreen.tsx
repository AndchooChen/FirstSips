import { View, StyleSheet, KeyboardAvoidingView, ScrollView, Platform, Text, TouchableOpacity, SafeAreaView } from "react-native";
import { useState } from "react";
import { TextInput } from 'react-native-paper'; // Assuming react-native-paper TextInput
import { formatBirthday, formatPhoneNumber, validateForm } from "../utils/signUpUtils"; // Assuming these utility functions exist
import ScreenWideButton from "../components/ScreenWideButton"; // Assuming this component exists
import { useLocalSearchParams, useRouter } from "expo-router"; // Assuming expo-router is used
import { Ionicons } from '@expo/vector-icons'; // Assuming Ionicons are available
import { supabase } from "../utils/supabase"; // Assuming Supabase client
import { signUpWithEmail } from "../auth/auth"; // Assuming this auth function exists

const SignUpScreen = () => {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const params = useLocalSearchParams();
    // Determine if the user is signing up as a shop owner based on the parameter
    const isShopOwner = params.isShopOwner === 'true';

    const router = useRouter();

    // Function to handle the sign-up process
    const handleSignUp = async () => {
        // Validate the form inputs
        if (!validateForm(firstName, lastName, email, password, phoneNumber)) {
            // validateForm should ideally show specific error messages to the user
            alert("Please fill in all fields correctly."); // Basic alert for now
            return;
        }

        // Attempt to sign up with email and password
        const { data, error } = await signUpWithEmail(email, password);

        if (error) {
            console.log('Sign up error:', error.message);
            alert("Sign up failed: " + error.message); // Display sign-up error
            return;
        }

        const user = data?.user; // Get the newly created user

        if (user) {
            // Insert user profile into the 'users' table
            const { error: insertError } = await supabase
            .from('users')
            .insert([
                {
                    id: user.id,
                    email: email,
                    first_name: firstName,
                    last_name: lastName,
                    phone_number: phoneNumber,
                    is_shop_owner: isShopOwner, // Set is_shop_owner based on the selected type
                    shop_id: null, // Shop ID is null initially for both types
                }
            ]);

            if (insertError) {
                console.log("Error inserting user profile: ", insertError.message);
                alert("Failed to create user profile: " + insertError.message); // Display profile creation error
                // Consider rolling back the auth creation if profile creation fails
                return;
            } else {
                console.log("User profile created");
            }
        }

        console.log("user created: ", user);

        // Navigate based on account type
        if (isShopOwner) {
            router.push("./CreateShopScreen"); // Navigate to create shop screen for shop owners
        } else {
            router.push("../(tabs)/dashboard/DashboardScreen"); // Navigate to dashboard for customers
        }
    };

    return (
        // KeyboardAvoidingView to prevent keyboard from covering inputs
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"} // Adjust behavior based on platform
            style={styles.safeArea} // Apply styles to the main container
        >
            {/* Back Button */}
            <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
                accessibilityLabel="Go back" // Accessibility label
            >
                <Ionicons name="arrow-back" size={24} color="#6F4E37" /> {/* Consistent back arrow color */}
            </TouchableOpacity>
            {/* ScrollView for content that might exceed screen height */}
            <ScrollView
                contentContainerStyle={styles.scrollContainer}
                showsVerticalScrollIndicator={false} // Hide scroll indicator
            >
                {/* Title */}
                <Text style={styles.titleText}>{isShopOwner ? "Create Your Shop Account" : "Create Your Customer Account"}</Text>

                {/* Form Container */}
                <View style={styles.formContainer}>
                    {/* First Name Input */}
                    <TextInput
                        label = "First name"
                        value = {firstName}
                        onChangeText = {(firstName) => {setFirstName(firstName)}}
                        mode = "outlined" // Outlined style
                        style={styles.input}
                    />
                    {/* Last Name Input */}
                    <TextInput
                        label = "Last name"
                        value = {lastName}
                        onChangeText = {(lastName) => {setLastName(lastName)}}
                        mode = "outlined" // Outlined style
                        style={styles.input}
                    />
                    {/* Phone Number Input */}
                    <TextInput
                        label="Phone number"
                        value={phoneNumber}
                        onChangeText={(text) => setPhoneNumber(formatPhoneNumber(text))} // Format phone number
                        mode="outlined" // Outlined style
                        placeholder="(XXX)XXX-XXXX"
                        keyboardType="numeric" // Numeric keyboard
                        maxLength={14} // Limit input length
                        style={styles.input}
                    />
                    {/* Email Input */}
                    <TextInput
                        label = "Email"
                        value = {email}
                        onChangeText = {(email) => {setEmail(email)}}
                        mode = "outlined" // Outlined style
                        keyboardType="email-address" // Suggest email keyboard
                        autoCapitalize="none" // Prevent auto-capitalization
                        style={styles.input}
                    />
                    {/* Password Input */}
                    <TextInput
                        label = "Password"
                        value = {password}
                        onChangeText = {(password) => {setPassword(password)}}
                        mode = "outlined" // Outlined style
                        secureTextEntry = {true} // Hide password
                        style={styles.input}
                    />

                    {/* Spacer */}
                    <View style={{ height: 16 }}></View>

                    {/* Sign Up Button */}
                    <ScreenWideButton
                        text={isShopOwner ? "Continue to Shop Details" : "Sign up"} // Button text changes based on account type
                        onPress={handleSignUp} // Call sign-up function
                        color="#D4A373" // Primary color
                        textColor="#FFFFFF" // White text
                    />
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#F5EDD8", // Consistent background color
    },
    background: { // This style is redundant with safeArea
        flex: 1,
        backgroundColor: "#F5EDD8",
        justifyContent:"center",
    },
    scrollContainer: {
        flexGrow: 1, // Allow content to grow
        justifyContent: 'center', // Center content vertically
        padding: 24, // Consistent padding
        paddingTop: 80, // Padding at the top for back button
    },
    titleText: {
        fontSize: 28, // Title font size
        fontWeight: "bold", // Bold font weight
        marginBottom: 32, // Space below title
        textAlign: "center", // Center text
        color: "#333", // Dark text color
    },
    formContainer: {
        width: '100%', // Full width of scroll container
        gap: 16, // Space between form elements
        maxWidth: 400, // Optional: Limit max width
        alignSelf: 'center', // Center the form container itself
    },
    switchContainer: { // This style is not used in the current component
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 8,
    },
    input: {
        // marginBottom: 8, // Removed individual input margin, using gap in formContainer instead
        backgroundColor: '#FFFFFF', // White background for inputs
    },
    backButton: {
        position: 'absolute', // Absolute positioning
        top: 40, // Position from top
        left: 16, // Position from left
        padding: 8, // Padding for touch area
        zIndex: 1 // Ensure it's above other content
    }
});

export default SignUpScreen;
