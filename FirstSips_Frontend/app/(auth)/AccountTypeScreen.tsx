import { View, StyleSheet, TouchableOpacity, Text, SafeAreaView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import ScreenWideButton from '../components/ScreenWideButton'; // Assuming this component exists
import { Ionicons } from '@expo/vector-icons'; // Assuming Ionicons are available

const AccountTypeScreen = () => {
    const router = useRouter();
    const params = useLocalSearchParams(); // Keeping this in case it's used elsewhere, though not in this component's logic

    // Function to handle button presses and navigate
    const handleAccountTypeSelect = (isShopOwner: any) => {
        // Navigate to the SignUpScreen, passing the account type as a parameter
        router.push({
            pathname: "./SignUpScreen",
            params: { isShopOwner }
        });
    };

    return (
        // SafeAreaView helps handle notches and status bars
        <SafeAreaView style={styles.safeArea}>
            {/* Main container with background color */}
            <View style={styles.container}>
                {/* Back Button */}
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                    accessibilityLabel="Go back" // Accessibility label
                >
                    <Ionicons name="arrow-back" size={24} color="#6F4E37" /> {/* Consistent back arrow color */}
                </TouchableOpacity>

                {/* Content Container */}
                <View style={styles.contentContainer}>
                    {/* Title Text */}
                    <Text style={styles.titleText}>Select an account type</Text>

                    {/* Shopowner Button */}
                    <ScreenWideButton
                        text="Shopowner"
                        onPress={() => handleAccountTypeSelect(true)}
                        color="#D4A373" // Primary color for the more involved account type
                        textColor="#FFFFFF" // White text for contrast
                    />

                    {/* Spacer View (can be replaced with gap in container if preferred) */}
                    <View style={{ height: 16 }}></View>

                    {/* Customer Button */}
                    <ScreenWideButton
                        text="Customer"
                        onPress={() => handleAccountTypeSelect(false)}
                        color="#F5EDD8" // Secondary color for the less involved account type
                        textColor="#000000" // Dark text for contrast
                    />
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#F5EDD8", // Consistent background color
    },
    container: {
        flex: 1,
        backgroundColor: "#F5EDD8", // Consistent background color
        alignItems: "center", // Center content horizontally
        justifyContent: "center", // Center content vertically
        paddingHorizontal: 24, // Add horizontal padding
    },
    backButton: {
        position: 'absolute', // Absolute positioning
        top: 40, // Position from the top
        left: 16, // Position from the left
        padding: 8, // Padding for touch area
        zIndex: 1, // Ensure it's above other content
    },
    contentContainer: {
        width: "100%", // Take full width of the container
        alignItems: "center", // Center items within this container
        maxWidth: 400, // Optional: Limit max width on larger screens
    },
    titleText: {
        marginBottom: 32, // More space below the title
        fontSize: 28, // Slightly smaller font size than landing page title
        fontWeight: "bold", // Bold font weight
        textAlign: "center", // Center the text
        color: "#333", // Dark text color
    },
});

export default AccountTypeScreen;
