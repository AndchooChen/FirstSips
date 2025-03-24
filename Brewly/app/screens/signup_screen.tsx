import { View, StyleSheet, KeyboardAvoidingView, ScrollView, Platform } from "react-native";
import { useState } from "react";
import ScreenWideButton from "../components/screen_wide_button";
import { useRouter } from "expo-router";
import { TextInput } from 'react-native-paper';
import { FIREBASE_AUTH, FIREBASE_DB } from "../auth/FirebaseConfig";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore"

export default function Home() {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [birthday, setBirthday] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const router = useRouter();
    const auth = FIREBASE_AUTH;

    const formatBirthday = (text: string) => {
        // Remove any non-digit characters
        const cleaned = text.replace(/\D/g, '');
        
        // Add slashes after MM and DD
        let formatted = cleaned;
        if (cleaned.length >= 4) {
            formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4, 8)}`;
        } else if (cleaned.length >= 2) {
            formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
        }

        // Validate month and day
        const month = parseInt(formatted.slice(0, 2));
        const day = parseInt(formatted.slice(3, 5));
        
        if (month > 12) setBirthday('12' + formatted.slice(2));
        if (day > 31) setBirthday(formatted.slice(0, 3) + '31' + formatted.slice(5));
        
        return formatted;
    };

    const formatPhoneNumber = (text: string) => {
        // Remove all non-digit characters
        const cleaned = text.replace(/\D/g, '');
        
        // Format the number
        let formatted = cleaned;
        if (cleaned.length >= 6) {
            formatted = `(${cleaned.slice(0, 3)})${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
        } else if (cleaned.length >= 3) {
            formatted = `(${cleaned.slice(0, 3)})${cleaned.slice(3)}`;
        } else if (cleaned.length > 0) {
            formatted = `(${cleaned}`;
        }
        
        return formatted;
    };

    const validateForm = () => {
        if (!firstName || !lastName || !email || !password || !phoneNumber) {
            alert('Please fill in all fields');
            return false;
        }
        
        // Add email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            alert('Please enter a valid email address');
            return false;
        }
    
        // Add phone number format validation
        const phoneRegex = /^\(\d{3}\)\d{3}-\d{4}$/;
        if (!phoneRegex.test(phoneNumber)) {
            alert('Please enter a valid phone number');
            return false;
        }
    
        return true;
    };

    const signUp = async () => {
        if (!validateForm()) {
            return;
        }

        try {
            const userCrediential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCrediential.user;

            await setDoc(doc(FIREBASE_DB, "users", user.uid), {
                firstName: firstName,
                lastName: lastName,
                email: email,
                phoneNumber: phoneNumber,
                userType: "storeowner",
                createdAt: new Date().toISOString(),
                storeId: null,
            }),

            // Check to see if the correct user is signed up
            console.log(userCrediential);

            alert('Account created successfully');
            router.push("/screens/dashboard_screen");
        }
        catch (error: any) {
            alert('Sign up failed: ' + error.message);
            console.log(error);
        }
    }

    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.background}
        >
            <ScrollView 
                contentContainerStyle={styles.scrollContainer}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.formContainer}>
                    <TextInput 
                        label = "First name"
                        value = {firstName}
                        onChangeText = {(firstName) => {setFirstName(firstName)}}
                        mode = "outlined"
                    />
                    <TextInput 
                        label = "Last name"
                        value = {lastName}
                        onChangeText = {(lastName) => {setLastName(lastName)}}
                        mode = "outlined"
                    />
                    <TextInput 
                        label="Phone number"
                        value={phoneNumber}
                        onChangeText={(text) => setPhoneNumber(formatPhoneNumber(text))}
                        mode="outlined"
                        placeholder="(XXX)XXX-XXXX"
                        keyboardType="numeric"
                        maxLength={14}  // Length of (XXX)XXX-XXXX
                    />
                    <TextInput 
                        label="Birthday"
                        value={birthday}
                        onChangeText={(text) => setBirthday(formatBirthday(text))}
                        mode="outlined"
                        placeholder="MM/DD/YYYY"
                        keyboardType="numeric"
                        maxLength={10}
                    />
                    <TextInput 
                        label = "Email"
                        value = {email}
                        onChangeText = {(email) => {setEmail(email)}}
                        mode = "outlined"
                    />
                    <TextInput 
                        label = "Password"
                        value = {password}
                        onChangeText = {(password) => {setPassword(password)}}
                        mode = "outlined"
                        secureTextEntry = {true}
                    />
                    <ScreenWideButton
                        text="Create Account"
                        onPress={signUp}
                        color="#D4A373"
                        textColor="#000000"
                    />
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    background: {
        flex: 1,
        backgroundColor: "#F5EDD8",
        justifyContent:"center",
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 16,
    },
    formContainer: {
        width: '100%',
        gap: 12,
    },
    input: {
        marginBottom: 8,
    },
})