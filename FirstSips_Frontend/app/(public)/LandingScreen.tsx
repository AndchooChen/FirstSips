import { View, Text, SafeAreaView, Image, StyleSheet } from "react-native";
import ScreenWideButton from "../components/ScreenWideButton"; // Assuming this component exists
import { useRouter } from "expo-router"; // Assuming expo-router is used

export default function Landing() {
  const router = useRouter();

  return (
    // SafeAreaView helps handle notches and status bars
    <SafeAreaView style={styles.safeArea}>
      {/* Main container with background color */}
      <View style={styles.container}>
        {/* Top section for the image */}
        <View style={styles.topContainer}>
          <Image
            source={require('../assets/images/first_sips_coffee.png')} // Ensure this image exists
            style={styles.coffeeImage}
            resizeMode="contain" // Use 'contain' to prevent distortion
          />
        </View>

        {/* Bottom section for the welcome text and buttons */}
        <View style={styles.bottomContainer}>
          {/* White background card */}
          <View style={styles.whiteBackground}>
            <Text style={styles.welcomeText}>Welcome!</Text>

            {/* Login Button */}
            <ScreenWideButton
              text="Login"
              onPress={() => router.push("../(auth)/LoginScreen")}
              color="#D4A373" // Warm, inviting color
              textColor="#FFFFFF" // White text for contrast
            />

            {/* Create Account Button */}
            <ScreenWideButton
              text="Create an account"
              onPress={() => router.push("../(auth)/AccountTypeScreen")}
              color="#F5EDD8" // Lighter background color
              textColor="#000000" // Dark text for contrast
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F5EDD8", // Background color for the whole screen
  },
  container: {
    flex: 1,
    backgroundColor: "#F5EDD8", // Background color
    justifyContent: 'space-between', // Distribute space between top and bottom containers
  },
  topContainer: {
    flex: 1, // Allow top container to take available space
    justifyContent: "center", // Center image vertically
    alignItems: "center", // Center image horizontally
    paddingTop: 40, // Add some padding at the top
  },
  bottomContainer: {
    justifyContent: "flex-end", // Push content to the bottom of this container
  },
  coffeeImage: {
    width: "80%", // Use percentage for responsive width
    height: "80%", // Use percentage for responsive height
    // aspectRatio: 1, // Keep aspect ratio if needed, but width/height might be enough
    // Removed marginTop: 250 - let flexbox handle positioning
  },
  whiteBackground: {
    backgroundColor: "#FFFFFF", // White background for the card
    borderTopLeftRadius: 30, // Rounded top corners
    borderTopRightRadius: 30,
    width: "100%", // Full width
    padding: 32, // Consistent padding inside the card
    gap: 16, // Space between elements inside the card
    // Removed fixed height - let content define height
    paddingBottom: 40, // More padding at the bottom for buttons
  },
  welcomeText: {
    fontSize: 32, // Slightly larger font size
    fontWeight: "bold", // Make it bold
    marginBottom: 24, // More space below the text
    textAlign: "center", // Center the text
    color: "#333", // Darker text color for better contrast
  },
});
