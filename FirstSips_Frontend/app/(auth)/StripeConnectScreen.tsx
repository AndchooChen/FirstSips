import React, { useState, useEffect } from 'react';
import { View, Text, Button, ActivityIndicator, Alert, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Linking from 'expo-linking';
import { API_URL } from '../config/api';
import ScreenWideButton from '../components/ScreenWideButton';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../utils/supabase';

const StripeConnectScreen = () => {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [shopId, setShopId] = useState('');
    const router = useRouter();
    const params = useLocalSearchParams();

    useEffect(() => {
        const handleDeepLink = async (url: string | null) => {
            if (!url) return;

            try {
                const parsedUrl = Linking.parse(url);
                console.log('Received deep link:', parsedUrl); // Debug log

                // Check if the URL path matches our success or error routes
                if (url.includes('stripe-success')) {
                    const shopId = parsedUrl.queryParams?.shop_id;
                    Alert.alert(
                        'Success',
                        'Your Stripe account has been connected successfully!',
                        [{
                            text: 'OK',
                            onPress: () => router.push('/(tabs)/shop_owner/EditShopScreen')
                        }]
                    );
                } else if (url.includes('stripe-error')) {
                    Alert.alert(
                        'Error',
                        'There was an error connecting your Stripe account. Please try again.',
                        [{
                            text: 'OK',
                            onPress: () => setLoading(false)
                        }]
                    );
                }
            } catch (error) {
                console.error('Deep link parsing error:', error);
                setLoading(false);
            }
        };

        // Handle initial URL
        Linking.getInitialURL().then(handleDeepLink);

        // Handle deep links while app is running
        const subscription = Linking.addEventListener('url', ({ url }) => {
            handleDeepLink(url);
        });

        return () => {
            subscription.remove();
        };
    }, [router]);

    const getUserId = async () => {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
            
        if (!user || authError) {
            console.error('Auth error:', authError);
            return;
        }

        const userId = user.id;
        return userId
    }

    const getUserShopId = async () => {
        const userId = await getUserId();

        const { data: userData, error: userError } = await supabase
            .from("users")
            .select("shop_id")
            .eq("id", userId)
            .single();

        if (userError) {
            console.error('Error fetching user data:', userError);
            return;
        }

        setShopId(userData.shop_id);
    }

    const getUserEmail = async () => {
        const userId = await getUserId();

        const {data: userEmail, error: userEmailError} = await supabase
            .from("users")
            .select("email")
            .eq("id", userId)
            .single();

        if (userEmailError) {
            console.error('Error fetching user data:', userEmailError);
            return;
        }

        setEmail(userEmail.email);
    }

    const handleStripeOnboarding = async () => {
        try {
            setLoading(true);

            // Step 1: Create Stripe Account
            const accountResponse = await fetch(`${API_URL}/stripe/create-account`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify({ email })
            });
            
            if (!accountResponse.ok) {
                const error = await accountResponse.json();
                throw new Error(error.error || 'Failed to create Stripe account');
            }

            const accountData = await accountResponse.json();

            // Step 2: Get Onboarding Link
            const linkResponse = await fetch(`${API_URL}/stripe/create-onboarding-link`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    accountId: accountData.accountId,
                    shopId: shopId
                })
            });

            if (!linkResponse.ok) {
                const error = await linkResponse.json();
                throw new Error(error.error || 'Failed to create onboarding link');
            }

            const linkData = await linkResponse.json();

            // Step 3: Open the onboarding link in a browser
            await Linking.openURL(linkData.url);

        } catch (error: any) {
            console.error('Stripe Connect Error:', error);
            Alert.alert('Error', error.message || 'Failed to connect with Stripe');
            setLoading(false);
        }
    };

    useEffect(() => {
        getUserEmail();
        getUserShopId();
    }, []);

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: "#F5EDD8" }}>
            <TouchableOpacity 
                style={styles.backButton}
                onPress={() => router.back()}
            >
                <Ionicons name="arrow-back" size={24} color="#6F4E37" />
            </TouchableOpacity>
            <Text style={{ fontSize: 18, textAlign: 'center', marginBottom: 20 }}>
                To receive payments, you need to set up a Stripe account.
            </Text>
            {loading ? (
                <ActivityIndicator size="large" color="#007AFF" />
            ) : (
                <ScreenWideButton
                    text="Connect with Stripe"
                    onPress={handleStripeOnboarding}
                    color="#D4A373"
                    textColor="#000000"
                    style={{width: "85%"}}
                ></ScreenWideButton>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    backButton: {
        position: 'absolute',
        top: 40,
        left: 16,
        padding: 8,
        zIndex: 1
    },
})

export default StripeConnectScreen;
