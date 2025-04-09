import { View, Text, SafeAreaView, Image } from "react-native";
import { StyleSheet } from "react-native";
import ScreenWideButton from "../components/ScreenWideButton";
import { useRouter } from "expo-router";

export default function Landing() {
  const router = useRouter();

  return (
    <View style={styles.background}>
      <View style={styles.topContainer}>
        <Image
          source={require('../assets/images/first_sips_coffee.png')}
          style={styles.coffeeImage}
        />
      </View>
      <View style={styles.bottomContainer}>
        <View style={styles.whiteBackground}>
          <Text style={styles.welcomeText}>Welcome!</Text>
          <ScreenWideButton
            text="Login"
            onPress={() => router.push("../(auth)/LoginScreen")}
            color="#D4A373"
            textColor="#000000"
          />

          <ScreenWideButton
            text="Create an account"
            onPress={() => router.push("../(auth)/AccountTypeScreen")}
            color="#D4A373"
            textColor="#000000"
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: "#F5EDD8",
  },
  topContainer: {
    flex: 0.6,
    justifyContent: "center",
    alignItems: "center",
  },
  bottomContainer: {
    flex: 0.8,
    justifyContent: "flex-end",
  },
  coffeeImage: {
    height: "150%", 
    aspectRatio: 1,
    resizeMode: "contain",
    marginTop: 250,
  },
  whiteBackground: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    width: "100%",
    padding: 32,
    gap: 20,
    height: "64%",
  },
  welcomeText: {
    fontSize: 30,
    fontWeight: 500,
    marginBottom: 10,
    marginTop: 20,
    textAlign: "center",
  }
});
