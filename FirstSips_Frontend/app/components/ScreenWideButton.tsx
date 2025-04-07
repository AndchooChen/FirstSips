import { TouchableOpacity, Text, StyleSheet, ViewStyle } from "react-native";

type CustomButtonProp = {
    text: string;
    onPress: () => void;
    color?: string;
    textColor?: string;
    style?: ViewStyle;
    disabled?: boolean;
};

const ScreenWideButton: React.FC<CustomButtonProp> = ({
    text,
    onPress,
    color = "#6F4E37", 
    textColor = "#FFFFFF", 
    style,
    disabled = false,
}) => {
    return (
        <TouchableOpacity
            onPress={onPress}
            style={[
                styles.button, 
                { backgroundColor: color }, 
                disabled && styles.disabled,
                style
            ]}
            activeOpacity={0.8}
            disabled={disabled}
        >
            <Text style={[
                styles.text, 
                { color: textColor },
                disabled && styles.disabledText
            ]}>
                {text}
            </Text>
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
    button: {
        width: "100%",
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
    disabled: {
        opacity: 0.5,
    },
    disabledText: {
        opacity: 0.7,
    }
})

export default ScreenWideButton;