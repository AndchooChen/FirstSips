import React from "react";
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from "react-native";

type CustomButtonProp = {
    text: string;
    onPress: () => void;
    color?: string;
    textColor?: string;
    style?: ViewStyle;
};

const ScreenWideButton: React.FC<CustomButtonProp> = ({
    text,
    onPress,
    color = "#6F4E37", 
    textColor = "#FFFFFF", 
    style,
}) => {
    return (
        <TouchableOpacity
            onPress={onPress}
            style={[styles.button, { backgroundColor: color }, style ]}
            activeOpacity={0.8}
        >
            <Text style={[styles.text, { color: textColor }]}>{text}</Text>
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
    button: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
      },
      text: {
        fontSize: 16,
        fontWeight: "600",
      },
})

export default ScreenWideButton;