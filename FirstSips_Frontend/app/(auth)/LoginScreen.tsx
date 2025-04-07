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
        if (!email || !password) {
            alert('Please enter both email and password');
            return;
        }

        setLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
            router.push("/(tabs)/dashboard/DashboardScreen");
        } catch (error: any) {
            setLoading(false);
            alert('Login failed: ' + error.message);
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
                <KeyboardAvoidingView style={styles.container}>
                    
                    <TextInput
                        label="Email"
                        value={email}
                        onChangeText={(email) => setEmail(email)}
                        mode="outlined"
                        style={styles.input}
                    />
                    <TextInput
                        label="Password"
                        value={password}
                        onChangeText={(password) => setPassword(password)}
                        mode="outlined"
                        secureTextEntry={true}
                        style={styles.input}
                    />
                    <ScreenWideButton
                        text="Login"
                        onPress={signIn}
                        color="#D4A373"
                        textColor="#000000"
                        disabled={loading}
                    />
                    <ScreenWideButton
                        text="Sign up here"
                        onPress={() => router.push("/(auth)/SignUpScreen")}
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
    },
    container: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
        gap: 10,
    },
    input: {
        backgroundColor: 'white',
    }
})

export default LoginScreen;