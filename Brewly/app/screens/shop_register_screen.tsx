import { View, Text } from "react-native";
import ScreenWideButton from "../components/screen_wide_button";
import { useRouter } from "expo-router";

export default function Home() {
    const router = useRouter();

    return (
        <View>
            <Text>This is the page to make a shop</Text>
            <ScreenWideButton
              text="Start Buying"
              onPress={() => router.push("/screens/landing_screen")}
              color="#D4A373"
              textColor="#000000"
            />
        </View>
    )
}