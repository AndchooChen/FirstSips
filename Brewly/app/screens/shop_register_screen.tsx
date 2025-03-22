import { View, Text, StyleSheet } from "react-native";
import ScreenWideButton from "../components/screen_wide_button";
import { useRouter } from "expo-router";
import { TextInput } from 'react-native-paper';

export default function Home() {
    const router = useRouter();

    return (
        <View style={styles.background}>
            <View>
                
                <TextInput 
                    label = "First name"
                    value = ""
                    onChangeText = {() => {}}
                    mode = "outlined"
                />

                <TextInput 
                    label = "Last name"
                    value = ""
                    onChangeText = {() => {}}
                    mode = "outlined"
                />

                <TextInput 
                    label = "Email"
                    value = ""
                    onChangeText = {() => {}}
                    mode = "outlined"
                />

                <TextInput 
                    label = "Phone number"
                    value = ""
                    onChangeText = {() => {}}
                    mode = "outlined"
                />

                <TextInput 
                    label = "Password"
                    value = ""
                    onChangeText = {() => {}}
                    mode = "outlined"
                />

                <TextInput 
                    label = "Birthday"
                    value = ""
                    onChangeText = {() => {}}
                    mode = "outlined"
                />

                <ScreenWideButton
                    text="Create Account"
                    onPress={() => router.push("/screens/landing_screen")}
                    color="#D4A373"
                    textColor="#000000"
                />
            </View>
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