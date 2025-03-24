import { View, Text, StyleSheet, KeyboardAvoidingView } from "react-native";
import { useState } from "react",
import ScreenWideButton from "../components/screen_wide_button";
import { useRouter } from "expo-router";
import { TextInput } from "react-native-paper";
import { FIREBASE_AUTH } from "../../FirebaseConfig";
import { signInWithEmailAndPassword } from "firebase/auth";

const Login = () => {
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
            router.push("/screens/home_screen");
        }
        catch (error: any) {
            setLoading(false);
            alert('Login failed: ' + error.message);
            //console.log(error);
        }
    }
    
    return (
        <View style={styles.background}>
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
            </KeyboardAvoidingView>
        </View>
    )
}

const styles = StyleSheet.create({
    background: {
        backgroundColor: "#F5EDD8",
        flex: 1,
        width: "100%",
        justifyContent: "center",
        alignItems: "center",
    }
})

export default Login;