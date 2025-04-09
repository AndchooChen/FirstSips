import { View, StyleSheet, KeyboardAvoidingView, ScrollView, Platform, Text, TouchableOpacity } from "react-native";
import { useState } from "react";
import { TextInput } from 'react-native-paper';
import { FIREBASE_AUTH, FIREBASE_DB } from "../auth/FirebaseConfig";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { formatBirthday, formatPhoneNumber, validateForm } from "../utils/signUpUtils"
import ScreenWideButton from "../components/ScreenWideButton";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from '@expo/vector-icons';

const SignUpScreen = () => {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    // const [birthday, setBirthday] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const params = useLocalSearchParams();
    const isShopOwner = params.isShopOwner === 'true';

    const router = useRouter();
    const auth = FIREBASE_AUTH;

    const signUp = async () => {
        if (!validateForm(firstName, lastName, email, password, phoneNumber)) {
            return;
        }

        try {
            if (isShopOwner) {
                router.push({
                    pathname: "../(tabs)/shop_owner/CreateShopScreen",
                    params: { 
                        firstName: firstName,
                        lastName: lastName,
                        email: email,
                        password: password,
                        phoneNumber: phoneNumber,
                        isShopOwner: params.isShopOwner,
                    }
                });
            } else {
                const userCrediential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCrediential.user;
                
                await setDoc(doc(FIREBASE_DB, "users", user.uid), {
                    firstName,
                    lastName,
                    email,
                    phoneNumber,
                    // birthday,
                    isShopOwner: params.isShopOwner,
                    createdAt: new Date().toISOString(),
                    shopId: null,
                });

                router.push("../(tabs)/dashboard/DashboardScreen");
            }
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
            {/* Add Back Button */}
            <TouchableOpacity 
                style={styles.backButton}
                onPress={() => router.back()}
            >
                <Ionicons name="arrow-back" size={24} color="#6F4E37" />
            </TouchableOpacity>
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
                        maxLength={14}
                    />
                    {/*
                    <TextInput 
                        label="Birthday"
                        value={birthday}
                        onChangeText={(text) => setBirthday(formatBirthday(text, setBirthday))}
                        mode="outlined"
                        placeholder="MM/DD/YYYY"
                        keyboardType="numeric"
                        maxLength={10}
                    />
                    */}
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
                    <View style={{padding: 4}}></View>
                    
                    {}
                    <ScreenWideButton
                        text={isShopOwner ? "Continue to shop" : "Sign up"}
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
    switchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 8,
    },
    input: {
        marginBottom: 8,
    },
    backButton: {
        position: 'absolute',
        top: 40,
        left: 16,
        padding: 8,
        zIndex: 1
    }
})

export default SignUpScreen;