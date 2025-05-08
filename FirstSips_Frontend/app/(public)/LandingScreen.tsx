import { View, Text, SafeAreaView, Image, StyleSheet } from "react-native";
import ScreenWideButton from "../components/ScreenWideButton"; // Assuming this component exists
import { useRouter } from "expo-router"; // Assuming expo-router is used

export default function Landing() {
  const router = useRouter();

  return (
    // Use a clean white background for the SafeAreaView
    <SafeAreaView style={styles.safeArea}>
      {/* Main container */}
      <View style={styles.container}>
        {/* Top section for the image - give it more defined space */}
        <View style={styles.imageContainer}>
          <Image
            source={require('../assets/images/first_sips_coffee.png')} // Ensure this image exists
            style={styles.coffeeImage}
            resizeMode="contain"
          />
        </View>

        {/* Bottom section for the welcome text and buttons */}
        <View style={styles.contentContainer}>
          <Text style={styles.welcomeText}>Welcome to FirstSips!</Text>
          <Text style={styles.subtitleText}>Your local coffee fix, delivered.</Text>

          {/* Login Button (Primary Action) */}
          <ScreenWideButton
            text="Login"
            onPress={() => router.push("../(auth)/LoginScreen")}
            color="#6F4E37" // Using the darker brown as primary accent
            textColor="#FFFFFF"
            style={styles.primaryButton} // Add specific styles
          />

          {/* Create Account Button (Secondary Action) */}
          <ScreenWideButton
            text="Create an account"
            onPress={() => router.push("../(auth)/AccountTypeScreen")}
            color="#FFFFFF" // White background for outlined effect
            textColor="#6F4E37" // Use accent color for text
            style={styles.secondaryButton} // Add specific styles
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF", // Clean white background
  },
  container: {
    flex: 1,
    justifyContent: 'space-between', // Pushes content to top and bottom
    paddingHorizontal: 24, // Add horizontal padding to the main container
    paddingBottom: 40, // Padding at the very bottom
  },
  imageContainer: {
    flex: 0.6, // Allocate roughly 60% of the space to the image area
    justifyContent: "center",
    alignItems: "center",
    marginTop: 40, // Add some space from the top status bar
  },
  coffeeImage: {
    width: "90%", // Make image slightly larger relative to its container
    height: "90%",
  },
  contentContainer: {
    flex: 0.4, // Allocate roughly 40% to the text and buttons
    justifyContent: "center", // Center content vertically within this section
    alignItems: "center", // Center items horizontally
    gap: 20, // Consistent spacing between elements in this container
  },
  welcomeText: {
    fontSize: 34, // Slightly larger
    fontWeight: "bold", // Keep bold
    textAlign: "center",
    color: "#333333", // Dark grey for readability
    marginBottom: 8, // Space below welcome text
  },
  subtitleText: {
    fontSize: 18,
    textAlign: "center",
    color: "#555555", // Medium grey
    marginBottom: 32, // More space before buttons
  },
  // Specific styles for buttons to override defaults if needed, or add new ones like borderRadius
  primaryButton: {
    borderRadius: 12, // Rounded corners
    paddingVertical: 14, // Adjust vertical padding for better touch area
    elevation: 2, // Subtle shadow on Android
    shadowColor: '#000', // Shadow for iOS
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  secondaryButton: {
    borderRadius: 12, // Consistent rounded corners
    paddingVertical: 14,
    borderWidth: 1.5, // Add border for outlined effect
    borderColor: "#6F4E37", // Use accent color for border
  },
});
