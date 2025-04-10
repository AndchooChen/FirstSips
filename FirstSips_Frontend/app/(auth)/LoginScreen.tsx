import {View, StyleSheet, KeyboardAvoidingView, TouchableOpacity, Platform, ScrollView, ActivityIndicator } from "react-native";
import { useState } from "react";
import ScreenWideButton from "../components/ScreenWideButton";
import { useRouter } from "expo-router";
import { TextInput } from "react-native-paper";
import { Ionicons } from '@expo/vector-icons';
import { signInWithEmail } from "../auth/auth";

const LoginScreen = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSignIn = async () => {
        setLoading(true);
        
        const { data, error } = await signInWithEmail(email, password);
        
        if (error) {
            alert("Login failed: " + error.message);
            setLoading(false);
            return;
        }

        console.log("Logged in user: ", data);
        setLoading(false);
        router.push("./(app)/dashboard/DashboardScreen");
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
                autoCapitalize="none"
              />
              <TextInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                mode="outlined"
                secureTextEntry
                style={styles.input}
              />
      
              {loading ? (
                <ActivityIndicator size="large" color="#D4A373" style={{ marginVertical: 20 }} />
              ) : (
                <>
                  <ScreenWideButton
                    text="Login"
                    onPress={handleSignIn}
                    color="#D4A373"
                    textColor="#000000"
                  />
                  <View style={{ height: 10 }} />
                  <ScreenWideButton
                    text="Create an account instead"
                    onPress={() => router.push("./AccountTypeScreen")}
                    color="#D4A373"
                    textColor="#000000"
                  />
                </>
              )}
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
    },
    backButton: {
        position: 'absolute',
        top: 40,
        left: 16,
        padding: 8,
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
