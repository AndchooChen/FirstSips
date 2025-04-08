import { View, StyleSheet, TouchableOpacity, Text } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import ScreenWideButton from '../components/ScreenWideButton';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';

const AccountTypeScreen = () => {
    const router = useRouter();
    const params = useLocalSearchParams();

    const handleShopPress = (isShopOwner: boolean) => {
        router.push({
            pathname: "./SignUpScreen",
            params: { isShopOwner }
        });
    };
    
    return (
        <View style={styles.background}>
            <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
            >
                <Ionicons name="arrow-back" size={24} color="#6F4E37" />
            </TouchableOpacity>

            <View style={{width: "85%", alignItems: "center"}}>
                <Text style={{marginBottom: 20, fontSize: 30, fontWeight: 500}}>Select an account type</Text>
                <ScreenWideButton
                    text="Shopowner"
                    onPress={() => handleShopPress(true)}
                    color="#D4A373"
                    textColor="#000000"
                />
                <View style={{padding: 10}}></View>
                <ScreenWideButton
                    text="Customer"
                    onPress={() => handleShopPress(false)}
                    color="#D4A373"
                    textColor="#000000"
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    background: {
        flex: 1,
        backgroundColor: "#F5EDD8",
        alignItems: "center",
        justifyContent: "center",
    },
    backButton: {
        position: 'absolute',
        top: 40,
        left: 16,
        padding: 8,
        zIndex: 1,
    },
});

export default AccountTypeScreen;