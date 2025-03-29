import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { Appbar } from 'react-native-paper';
import OrderQueue from '../../components/OrderQueue';

const OrderQueueScreen = ({ route, navigation }: any) => {
    const { shopId } = route.params;

    return (
        <SafeAreaView style={styles.container}>
            <Appbar.Header>
                <Appbar.BackAction onPress={() => navigation.goBack()} />
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
