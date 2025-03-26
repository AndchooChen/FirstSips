import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { TextInput, Switch, Divider } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { FIREBASE_DB } from '../../auth/FirebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

const CheckoutScreen = () => {
    const [isDelivery, setIsDelivery] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [pickupTime, setPickupTime] = useState('');
    const [deliveryAddress, setDeliveryAddress] = useState('');
    const [shopData, setShopData] = useState(null);
    const router = useRouter();
    const params = useLocalSearchParams();
    const { items, shopId } = params;

    const cartItems = JSON.parse(items || '[]');
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.0825; // 8.25% tax
    const deliveryFee = isDelivery ? 5.99 : 0;
    const total = subtotal + tax + deliveryFee;

    useEffect(() => {
        const fetchShopData = async () => {
            const shopDoc = await getDoc(doc(FIREBASE_DB, "shops", shopId));
            if (shopDoc.exists()) {
                setShopData(shopDoc.data());
            }
        };
        fetchShopData();
    }, [shopId]);

    return (

    );
}

const styles = StyleSheet.create({

})

export default CheckoutScreen;