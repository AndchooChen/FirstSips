import { View, StyleSheet, TouchableOpacity, Text, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import ScreenWideButton from '../components/ScreenWideButton';
import { Ionicons } from '@expo/vector-icons';

const AccountTypeScreen = () => {
    const router = useRouter();

    const handleAccountTypeSelect = (isShopOwner: boolean) => {
        router.push({
            pathname: "./SignUpScreen",
        });
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                    accessibilityLabel="Go back"
                >
                    <Ionicons name="arrow-back" size={24} color="#555555" />
                </TouchableOpacity>

                <View style={styles.contentContainer}>
                    <Text style={styles.titleText}>How will you use FirstSips?</Text>
                    <Text style={styles.subtitleText}>Select your account type below.</Text>

                    <ScreenWideButton
                        text="I want to sell coffee (Shop Owner)"
                        onPress={() => handleAccountTypeSelect(true)}
                        color="#6F4E37"
                        textColor="#FFFFFF"
                        style={styles.primaryButton}
                    />

                    <ScreenWideButton
                        text="I want to buy coffee (Customer)"
                        onPress={() => handleAccountTypeSelect(false)}
                        color="#FFFFFF"
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
        backgroundColor: "#FFFFFF",
    },
    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    backButton: {
        position: 'absolute',
        top: 50,
        left: 16,
        padding: 8,
        zIndex: 1,
    },
    contentContainer: {
        width: "100%",
        alignItems: "center",
        maxWidth: 400,
        gap: 20, 
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
