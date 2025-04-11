import { View, StyleSheet, KeyboardAvoidingView, ScrollView, Platform, Text, TouchableOpacity } from "react-native";
import { useState } from "react";
import { TextInput } from 'react-native-paper';
import { formatBirthday, formatPhoneNumber, validateForm } from "../utils/signUpUtils"
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
    const params = useLocalSearchParams();
    const isShopOwner = params.isShopOwner === 'true';

    const router = useRouter();

    const handleSignUp = async () => {
        if (!validateForm(firstName, lastName, email, password, phoneNumber)) {
            return;
        }
        const { data, error } = await signUpWithEmail(email, password);
        
        if (error) {
            console.log('Sign up error:', error.message)
            return
        }
        const user = data?.user;
        console.log(user)

        const {
            data: { session },
          } = await supabase.auth.getSession();
          
          if (!session?.user) {
            console.error("No session, cannot insert user");
            return;
          }
        console.log("Session: ", session);

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
                    is_shop_owner: false,
                    shop_id: null,
                }
            ])

            if (insertError) {
                console.log("Error inserting user profile: ", insertError.message)
            } else {
                console.log("User profile created");
            }
        }
        console.log("user created: ", user);
        if (isShopOwner) {
            router.push("./CreateShopScreen");
        } else {
            router.push("../(tabs)/dashboard/DashboardScreen");
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
                        onPress={handleSignUp}
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