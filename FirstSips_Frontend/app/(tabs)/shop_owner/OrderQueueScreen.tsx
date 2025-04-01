import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { Appbar } from 'react-native-paper';
import OrderQueue from '../../components/OrderQueue';
import { useLocalSearchParams, useRouter } from "expo-router";

const OrderQueueScreen = () => {
    const { shopId } = useLocalSearchParams();
    const router = useRouter(); // Use Expo Router for navigation

    return (
        <SafeAreaView style={styles.container}>
            <Appbar.Header>
                <Appbar.BackAction onPress={() => router.back()} />
                <Appbar.Content title="Order Queue" />
            </Appbar.Header>
            <OrderQueue shopId={shopId} />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5EDD8',
    },
});

export default OrderQueueScreen;
