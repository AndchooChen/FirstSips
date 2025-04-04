import { View, StyleSheet, KeyboardAvoidingView, TouchableOpacity } from "react-native";
import { useState } from "react";
import ScreenWideButton from "../components/ScreenWideButton";
import { useRouter } from "expo-router";
import { TextInput } from "react-native-paper";
import { FIREBASE_AUTH } from "../auth/FirebaseConfig";
import { signInWithEmailAndPassword } from "firebase/auth";
import { Ionicons } from '@expo/vector-icons';

const LoginScreen = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const auth = FIREBASE_AUTH;

    const signIn = async () => {
        setLoading(true);
        try {
            const userCrediential = await signInWithEmailAndPassword(auth, email, password);

            // Check to see if the correct user is signed in
            console.log(userCrediential);

            setLoading(false);
            router.push("../(tabs)/dashboard/DashboardScreen");
        }
        catch (error: any) {
            setLoading(false);
            alert('Login failed: ' + error.message);
            //console.log(error);
        }
    }
    
    return (
        <View style={styles.background}>
            {/* Add Back Button */}
            <TouchableOpacity 
                style={styles.backButton}
                onPress={() => router.back()}
            >
                <Ionicons name="arrow-back" size={24} color="#6F4E37" />
            </TouchableOpacity>
            <View>
                <KeyboardAvoidingView>
                    
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
                    <ScreenWideButton
                        text="Login"
                        onPress={signIn}
                        color="#D4A373"
                        textColor="#000000"
                    />
                    <ScreenWideButton
                        text="Sign up here"
                        onPress={() => router.push("./SignUpScreen")}
                        color="#D4A373"
                        textColor="#000000"
                    />
                </KeyboardAvoidingView>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    background: {
        backgroundColor: "#F5EDD8",
        flex: 1,
        justifyContent: "center",
    },
    backButton: {
        position: 'absolute',
        top: 40,
        left: 16,
        padding: 8,
        zIndex: 1
    }
})

export default LoginScreen;