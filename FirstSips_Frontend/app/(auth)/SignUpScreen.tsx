import { View, StyleSheet, KeyboardAvoidingView, ScrollView, Platform, Text, TouchableOpacity } from "react-native";
import { useState } from "react";
import { TextInput, Switch } from 'react-native-paper';
import { FIREBASE_AUTH } from "../auth/FirebaseConfig";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { formatBirthday, formatPhoneNumber, validateForm } from "../utils/signUpUtils"
import ScreenWideButton from "../components/ScreenWideButton";
import { useRouter } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import { userService } from '../services/userService';

const SignUpScreen = () => {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [birthday, setBirthday] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isShopOwner, setIsShopOwner] = useState(false);
    const [loading, setLoading] = useState(false);

    const router = useRouter();
    const auth = FIREBASE_AUTH;

    const signUp = async () => {
        if (!validateForm(firstName, lastName, email, password, phoneNumber)) {
            return;
        }

        setLoading(true);
        try {
            // First create the Firebase auth user
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            
            // Then create the user profile in our backend
            await userService.updateProfile({
                firstName,
                lastName,
                email,
                phoneNumber,
                birthday,
                isShopOwner
            });

            alert('Account created successfully');

            if (isShopOwner) {
                router.push("../(tabs)/shop_owner/CreateShopScreen");
            } else {
                router.push("../(tabs)/dashboard/DashboardScreen");
            }
        } catch (error: any) {
            alert('Sign up failed: ' + error.message);
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.background}
        >
            {/* Add Back Button */}
            <TouchableOpacity 
                style={styles.backButton}
                onPress={() => router.back()}
            >
                <Ionicons name="arrow-back" size={24} color="#6F4E37" />
            </TouchableOpacity>

            <ScrollView>
                <View style={styles.container}>
                    <TextInput 
                        label="First Name"
                        value={firstName}
                        onChangeText={(text) => setFirstName(text)}
                        mode="outlined"
                    />
                    <TextInput 
                        label="Last Name"
                        value={lastName}
                        onChangeText={(text) => setLastName(text)}
                        mode="outlined"
                    />
                    <TextInput 
                        label="Phone Number"
                        value={phoneNumber}
                        onChangeText={(text) => setPhoneNumber(formatPhoneNumber(text))}
                        mode="outlined"
                        keyboardType="numeric"
                        maxLength={14}
                    />
                    <TextInput 
                        label="Birthday"
                        value={birthday}
                        onChangeText={(text) => setBirthday(formatBirthday(text, setBirthday))}
                        mode="outlined"
                        placeholder="MM/DD/YYYY"
                        keyboardType="numeric"
                        maxLength={10}
                    />
                    <TextInput 
                        label="Email"
                        value={email}
                        onChangeText={(email) => setEmail(email)}
                        mode="outlined"
                    />
                    <TextInput 
                        label="Password"
                        value={password}
                        onChangeText={(password) => setPassword(password)}
                        mode="outlined"
                        secureTextEntry={true}
                    />
                    <View style={styles.switchContainer}>
                        <Text>I want to create a coffee shop</Text>
                        <Switch
                            value={isShopOwner}
                            onValueChange={setIsShopOwner}
                        />
                    </View>
                    <ScreenWideButton
                        text="Create Account"
                        onPress={signUp}
                        color="#D4A373"
                        textColor="#000000"
                        disabled={loading}
                    />
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    background: {
        flex: 1,
        backgroundColor: '#FEFAE0',
    },
    container: {
        padding: 20,
        gap: 10,
    },
    backButton: {
        position: 'absolute',
        top: 50,
        left: 20,
        zIndex: 1,
    },
    switchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginVertical: 10,
    }
});

export default SignUpScreen;