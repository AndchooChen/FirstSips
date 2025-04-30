import { View, StyleSheet, TouchableOpacity, Text, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import ScreenWideButton from '../components/ScreenWideButton'; // Assuming this component exists
import { Ionicons } from '@expo/vector-icons'; // Assuming Ionicons are available

const AccountTypeScreen = () => {
    const router = useRouter();

    // Function to handle button presses and navigate
    const handleAccountTypeSelect = (isShopOwner: boolean) => {
        // Navigate to the SignUpScreen, passing the account type as a parameter
        router.push({
            pathname: "./SignUpScreen",
            params: { isShopOwner: String(isShopOwner) } // Ensure boolean is passed as string
        });
    };

    return (
        // Use a clean white background
        <SafeAreaView style={styles.safeArea}>
            {/* Main container */}
            <View style={styles.container}>
                {/* Back Button */}
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                    accessibilityLabel="Go back"
                >
                    <Ionicons name="arrow-back" size={24} color="#555555" /> {/* Slightly muted back arrow */}
                </TouchableOpacity>

                {/* Content Container */}
                <View style={styles.contentContainer}>
                    {/* Title Text */}
                    <Text style={styles.titleText}>How will you use FirstSips?</Text>
                    <Text style={styles.subtitleText}>Select your account type below.</Text>

                    {/* Shopowner Button (Primary Style) */}
                    <ScreenWideButton
                        text="I want to sell coffee (Shop Owner)"
                        onPress={() => handleAccountTypeSelect(true)}
                        color="#6F4E37" // Primary accent color
                        textColor="#FFFFFF"
                        style={styles.primaryButton}
                    />

                    {/* Customer Button (Secondary Style) */}
                    <ScreenWideButton
                        text="I want to buy coffee (Customer)"
                        onPress={() => handleAccountTypeSelect(false)}
                        color="#FFFFFF" // Outlined style
                        textColor="#6F4E37"
                        style={styles.secondaryButton}
                    />
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#FFFFFF", // Clean white background
    },
    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 24,
        paddingBottom: 40, // Padding at the bottom
    },
    backButton: {
        position: 'absolute',
        top: 50, // Adjust if needed based on device status bar height
        left: 16,
        padding: 8,
        zIndex: 1,
    },
    contentContainer: {
        width: "100%",
        alignItems: "center",
        maxWidth: 400,
        gap: 20, // Use gap for spacing between buttons
    },
    titleText: {
        fontSize: 28,
        fontWeight: "bold",
        textAlign: "center",
        color: "#333333", // Dark grey
        marginBottom: 8, // Reduced margin
    },
    subtitleText: {
        fontSize: 16,
        textAlign: "center",
        color: "#555555", // Medium grey
        marginBottom: 32, // More space before buttons
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
    secondaryButton: {
        borderRadius: 12,
        paddingVertical: 14,
        borderWidth: 1.5,
        borderColor: "#6F4E37",
    },
});

export default AccountTypeScreen;
