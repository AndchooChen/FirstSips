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
    const [loading, setLoading] = useState(false);
    const [passwordVisible, setPasswordVisible] = useState(false); // State for password visibility
    const router = useRouter();

    const handleSignIn = async () => {
        setLoading(true);
        const { data, error } = await signInWithEmail(email, password);
        setLoading(false); // Stop loading regardless of outcome

        if (error) {
            alert("Login failed: " + error.message);
            return;
        }

        console.log("Logged in user: ", data);
        router.replace("../(tabs)/dashboard/DashboardScreen"); // Use replace to prevent going back to login
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                style={styles.keyboardAvoidingView}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0} // Adjust offset as needed
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContainer}
                    keyboardShouldPersistTaps="handled" // Dismiss keyboard on tap outside inputs
                >
                    {/* Back Button */}
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                        accessibilityLabel="Go back"
                    >
                        <Ionicons name="arrow-back" size={24} color="#555555" />
                    </TouchableOpacity>

                    {/* Form Container */}
                    <View style={styles.form}>
                        <Text style={styles.titleText}>Welcome Back!</Text>
                        <Text style={styles.subtitleText}>Log in to continue your coffee journey.</Text>

                        {/* Email Input */}
                        <TextInput
                            label="Email"
                            value={email}
                            onChangeText={setEmail}
                            mode="outlined"
                            style={styles.input}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            theme={{ colors: { primary: '#6F4E37', background: '#FFFFFF' } }} // Theme for outline color and background
                            outlineColor="#CCCCCC" // Softer outline color
                            activeOutlineColor="#6F4E37" // Accent color when active
                        />

                        {/* Password Input */}
                        <TextInput
                            label="Password"
                            value={password}
                            onChangeText={setPassword}
                            mode="outlined"
                            secureTextEntry={!passwordVisible} // Toggle based on state
                            style={styles.input}
                            theme={{ colors: { primary: '#6F4E37', background: '#FFFFFF' } }}
                            outlineColor="#CCCCCC"
                            activeOutlineColor="#6F4E37"
                            right={ // Add eye icon to toggle visibility
                                <TextInput.Icon
                                    icon={passwordVisible ? "eye-off" : "eye"}
                                    onPress={() => setPasswordVisible(!passwordVisible)}
                                    color="#888888" // Icon color
                                />
                            }
                        />

                        {/* Loading Indicator or Buttons */}
                        {loading ? (
                            <ActivityIndicator size="large" color="#6F4E37" style={styles.loadingIndicator} />
                        ) : (
                            <>
                                {/* Login Button (Primary) */}
                                <ScreenWideButton
                                    text="Login"
                                    onPress={handleSignIn}
                                    color="#6F4E37"
                                    textColor="#FFFFFF"
                                    style={styles.primaryButton}
                                    disabled={!email || !password} // Disable if fields are empty
                                />
                                {/* Create Account Button (Secondary) */}
                                <ScreenWideButton
                                    text="Create an account instead"
                                    onPress={() => router.push("./AccountTypeScreen")}
                                    color="#FFFFFF" // Outlined style
                                    textColor="#6F4E37"
                                    style={styles.secondaryButton}
                                />
                            </>
                        )}
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

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
        justifyContent: "center",
        paddingHorizontal: 24,
        paddingBottom: 40,
        paddingTop: 60, // Ensure space for back button
    },
    backButton: {
        position: 'absolute',
        top: 50, // Adjust as needed
        left: 16,
        padding: 8,
        zIndex: 1,
    },
    form: {
        width: "100%",
        alignItems: "center",
        maxWidth: 400,
        alignSelf: 'center',
        gap: 16, // Use gap for spacing between elements
    },
    titleText: {
        fontSize: 32, // Slightly larger title
        fontWeight: "bold",
        textAlign: "center",
        color: "#333333",
        marginBottom: 8,
    },
    subtitleText: {
        fontSize: 16,
        textAlign: "center",
        color: "#555555",
        marginBottom: 24, // More space before inputs
    },
    input: {
        width: "100%",
        backgroundColor: '#FFFFFF', // Ensure input background is white
    },
    loadingIndicator: {
        marginVertical: 20,
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
    secondaryButton: {
        borderRadius: 12,
        paddingVertical: 14,
        borderWidth: 1.5,
        borderColor: "#6F4E37",
    },
});

export default LoginScreen;
