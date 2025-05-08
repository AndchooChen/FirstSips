import React from 'react';
import { SafeAreaView, StyleSheet, View, TouchableOpacity, Text } from 'react-native';
import OrderQueue from '../../components/OrderQueue';
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from '@expo/vector-icons';

const OrderManagementScreen = () => {
    const { shopId } = useLocalSearchParams();
    const router = useRouter();

    const shopIdString = typeof shopId === 'string' ? shopId : undefined;

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton} accessibilityLabel="Go back">
                    <Ionicons name="arrow-back" size={24} color="#6F4E37" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Order Queue</Text>
                <View style={styles.headerSpacer} />
            </View>

            <View style={styles.contentContainer}>
                {shopIdString ? (
                    <OrderQueue shopId={shopIdString} />
                ) : (
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>Invalid Shop ID.</Text>
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingTop: 20,
        marginBottom: 24,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333333',
        flex: 1,
        textAlign: 'center',
        marginHorizontal: 8,
    },
    headerSpacer: {
        width: 40,
    },
    contentContainer: {
        flex: 1,
        paddingHorizontal: 24,
        backgroundColor: '#FFFFFF',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    errorText: {
        fontSize: 16,
        color: '#D32F2F',
        textAlign: 'center',
    },
});

export default OrderManagementScreen;
