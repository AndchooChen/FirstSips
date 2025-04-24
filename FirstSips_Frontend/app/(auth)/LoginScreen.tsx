import { View, StyleSheet, KeyboardAvoidingView, TouchableOpacity, Platform, ScrollView, ActivityIndicator, Text, SafeAreaView } from "react-native";
import { useState } from "react";
import ScreenWideButton from "../components/ScreenWideButton"; // Assuming this component exists
import { useRouter } from "expo-router"; // Assuming expo-router is used
import { TextInput } from "react-native-paper"; // Assuming react-native-paper TextInput
import { Ionicons } from '@expo/vector-icons'; // Assuming Ionicons are available
import { signInWithEmail } from "../auth/auth"; // Assuming this auth function exists

const LoginScreen = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false); // State to manage loading indicator
    const router = useRouter();

    // Function to handle sign-in logic
    const handleSignIn = async () => {
        setLoading(true); // Start loading

        // Call the sign-in function (replace with your actual auth logic)
        const { data, error } = await signInWithEmail(email, password);

        if (error) {
            // Display error message (consider using a more user-friendly modal/toast)
            alert("Login failed: " + error.message);
            setLoading(false); // Stop loading
            return;
        }

        console.log("Logged in user: ", data); // Log success
        setLoading(false); // Stop loading
        router.push("../(tabs)/dashboard/DashboardScreen"); // Navigate on success
    };

    return (
        // KeyboardAvoidingView to prevent keyboard from covering inputs
        <KeyboardAvoidingView
          style={styles.safeArea} // Apply styles to the main container
          behavior={Platform.OS === "ios" ? "padding" : "height"} // Adjust behavior based on platform
          keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0} // Offset for iOS keyboard
        >
          {/* ScrollView for content that might exceed screen height */}
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            {/* Back Button */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              accessibilityLabel="Go back" // Accessibility label
            >
              <Ionicons name="arrow-back" size={24} color="#6F4E37" /> {/* Consistent back arrow color */}
            </TouchableOpacity>

            {/* Form Container */}
            <View style={styles.form}>
              {/* Title */}
              <Text style={styles.titleText}>Welcome Back!</Text>

              {/* Email Input */}
              <TextInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                mode="outlined" // Outlined style
                style={styles.input}
                autoCapitalize="none" // Prevent auto-capitalization for email
                keyboardType="email-address" // Suggest email keyboard
              />

              {/* Password Input */}
              <TextInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                mode="outlined" // Outlined style
                secureTextEntry // Hide password input
                style={styles.input}
              />

              {/* Loading Indicator or Buttons */}
              {loading ? (
                // Show activity indicator when loading
                <ActivityIndicator size="large" color="#D4A373" style={styles.loadingIndicator} />
              ) : (
                // Show buttons when not loading
                <>
                  {/* Login Button */}
                  <ScreenWideButton
                    text="Login"
                    onPress={handleSignIn}
                    color="#D4A373" // Primary color
                    textColor="#FFFFFF" // White text
                  />
                  {/* Spacer */}
                  <View style={{ height: 16 }} />
                  {/* Create Account Button */}
                  <ScreenWideButton
                    text="Create an account instead"
                    onPress={() => router.push("./AccountTypeScreen")}
                    color="#F5EDD8" // Secondary color
                    textColor="#000000" // Dark text
                  />
                </>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#F5EDD8", // Consistent background color
    },
    container: {
        flex: 1,
        backgroundColor: "#F5EDD8", // Consistent background color
    },
    scrollContainer: {
        flexGrow: 1, // Allow content to grow
        justifyContent: "center", // Center content vertically
        paddingHorizontal: 24, // Horizontal padding
        paddingTop: 80, // Padding at the top to make space for back button
        paddingBottom: 40, // Padding at the bottom
    },
    backButton: {
        position: 'absolute', // Absolute positioning
        top: 40, // Position from top
        left: 16, // Position from left
        padding: 8, // Padding for touch area
        zIndex: 1, // Ensure it's above other content
    },
    form: {
        width: "100%", // Take full width
        alignItems: "center", // Center form elements horizontally
        maxWidth: 400, // Optional: Limit max width
        alignSelf: 'center', // Center the form container itself
    },
    titleText: {
        fontSize: 28, // Title font size
        fontWeight: "bold", // Bold font weight
        marginBottom: 32, // Space below title
        textAlign: "center", // Center text
        color: "#333", // Dark text color
    },
    input: {
        width: "100%", // Inputs take full width of form container
        marginBottom: 16, // Space below each input
        backgroundColor: '#FFFFFF', // White background for inputs
    },
    loadingIndicator: {
        marginVertical: 20, // Vertical margin for loading indicator
    }
});

export default LoginScreen;
