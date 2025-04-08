<<<<<<< HEAD
import { View, StyleSheet, KeyboardAvoidingView, TouchableOpacity } from "react-native";
=======
import {View, StyleSheet, KeyboardAvoidingView, TouchableOpacity, Platform, ScrollView } from "react-native";
>>>>>>> LoginRedesign
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
<<<<<<< HEAD
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
=======
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            console.log(userCredential);
            setLoading(false);
            router.push("../(tabs)/dashboard/DashboardScreen");
        } catch (error: any) {
            setLoading(false);
            alert('Login failed: ' + error.message);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
        >
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Ionicons name="arrow-back" size={24} color="#6F4E37" />
                </TouchableOpacity>

                <View style={styles.form}>
                    <TextInput
                        label="Email"
                        value={email}
                        onChangeText={setEmail}
                        mode="outlined"
                        style={styles.input}
>>>>>>> LoginRedesign
                    />
                    <TextInput
                        label="Password"
                        value={password}
<<<<<<< HEAD
                        onChangeText={(password) => setPassword(password)}
                        mode="outlined"
                        secureTextEntry={true}
=======
                        onChangeText={setPassword}
                        mode="outlined"
                        secureTextEntry
                        style={styles.input}
>>>>>>> LoginRedesign
                    />
                    <ScreenWideButton
                        text="Login"
                        onPress={signIn}
                        color="#D4A373"
                        textColor="#000000"
                    />
<<<<<<< HEAD
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
=======
                    <View style={{ height: 10 }} />
                    <ScreenWideButton
                        text="Create an account instead"
                        onPress={() => router.push("./AccountTypeScreen")}
                        color="#D4A373"
                        textColor="#000000"
                    />
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F5EDD8",
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: "center",
        paddingHorizontal: 24,
        paddingTop: 80,
        paddingBottom: 40,
>>>>>>> LoginRedesign
    },
    backButton: {
        position: 'absolute',
        top: 40,
        left: 16,
        padding: 8,
<<<<<<< HEAD
        zIndex: 1
    }
})

export default LoginScreen;
=======
        zIndex: 1,
    },
    form: {
        width: "100%",
        alignItems: "center",
    },
    input: {
        width: "100%",
        marginBottom: 16,
    },
});

export default LoginScreen;
>>>>>>> LoginRedesign
