import React from 'react';
import { SafeAreaView, StyleSheet, View, TouchableOpacity } from 'react-native';
import { Appbar, Text } from 'react-native-paper'; // Using Paper's Appbar
import OrderQueue from '../../components/OrderQueue'; // Assuming this component exists
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from '@expo/vector-icons'; // Import Ionicons

const OrderManagementScreen = () => { // Renamed component for clarity
    const { shopId } = useLocalSearchParams();
    const router = useRouter();

    // Ensure shopId is a string before passing to OrderQueue
    const shopIdString = typeof shopId === 'string' ? shopId : undefined;

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Custom Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#555555" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Order Queue</Text>
                <View style={styles.headerSpacer} /> {/* For centering title */}
            </View>

            {/* Render OrderQueue only if shopIdString is valid */}
            {shopIdString ? (
                <OrderQueue shopId={shopIdString} />
            ) : (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>Invalid Shop ID.</Text>
                    {/* Optionally add a button to go back */}
                </View>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F8F8F8', // Slightly off-white background
    },
    header: { // Custom header style
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF', // White header background
        borderBottomWidth: 1,
        borderBottomColor: '#EEEEEE', // Light separator
        // Add shadow for iOS if desired
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        // Add elevation for Android if desired
        elevation: 2,
    },
    backButton: {
        padding: 8, // Touch area
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '600', // Semi-bold
        color: '#333333', // Dark grey title
    },
    headerSpacer: {
        width: 40, // Match back button touch area for centering
    },
    errorContainer: { // Style for showing error if shopId is missing
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    errorText: {
        fontSize: 16,
        color: '#D32F2F', // Error color
        textAlign: 'center',
    },
});

export default OrderManagementScreen; // Export with the new name
