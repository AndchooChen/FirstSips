import { View, Text, StyleSheet, KeyboardAvoidingView } from "react-native";
import { useState } from "react";
import ScreenWideButton from "../components/screen_wide_button";
import { useRouter } from "expo-router";
import { TextInput } from 'react-native-paper';
import { FIREBASE_AUTH } from "../../FirebaseConfig";
import { createUserWithEmailAndPassword } from "firebase/auth";

export default function Home() {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [birthday, setBirthday] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const router = useRouter();
    const auth = FIREBASE_AUTH;

    const signUp = async () => {
        try {
            const userCrediential = await createUserWithEmailAndPassword(auth, email, password);

            // Check to see if the correct user is signed up
            console.log(userCrediential);

            alert('Check your email!');
            router.push("/screens/home_screen");
        }
        catch (error: any) {
            alert('Sign up failed: ' + error.message);
            console.log(error);
        }
    }

    return (
        <View style={styles.background}>
            <KeyboardAvoidingView>
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
                    label = "Phone number"
                    value = {phoneNumber}
                    onChangeText = {(phoneNumber) => {setPhoneNumber(phoneNumber)}}
                    mode = "outlined"
                />
                <TextInput 
                    label = "Birthday"
                    value = {birthday}
                    onChangeText = {(birthday) => {setBirthday(birthday)}}
                    mode = "outlined"
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
            </KeyboardAvoidingView>
        </View>
    )
}

const styles = StyleSheet.create({
    background: {
        flex: 1,
        backgroundColor: "#F5EDD8",
        justifyContent:"center",
    },
})