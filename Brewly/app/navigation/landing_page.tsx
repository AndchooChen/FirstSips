import { View, Text, SafeAreaView, Image } from "react-native";
import { StyleSheet } from "react-native";
import ScreenWideButton from "../components/screen_wide_button";

const handleStartBuying = () => {

}

const handleStartBrewing = () => {

}

export default function LandingPage() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.background}>
        <Image
          source={require('../assets/images/first_sips_coffee.png')}
          style={styles.coffeeImage}
        />

        <Text>Get Started</Text>

        <ScreenWideButton
          text="Start Brewing"
          onPress={() => console.log("Brewing pressed!")}
          color="#D4A373"
          textColor="#000000"
        />
        <ScreenWideButton
          text="Start Buying"
          onPress={() => console.log("Buying pressed!")}
          color="#D4A373"
          textColor="#000000"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F5EDD8",
  },
  background: {
    flex: 1,
    backgroundColor: "#F5EDD8",
    justifyContent: "center",
    alignItems: "center", // centers image and button horizontally
    paddingHorizontal: 20,
  },
  coffeeImage: {
    height: 200,
    width: 200,
    marginBottom: 24, // space between image and button
    resizeMode: "contain",
  },
});
