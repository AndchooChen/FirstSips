import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, Alert, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
// import { makeRedirectUri } from 'expo-auth-session'; // Not using this anymore
import { API_URL } from '../config/api';
import ScreenWideButton from '../components/ScreenWideButton';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../utils/supabase';

const StripeConnectScreen = () => {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [shopId, setShopId] = useState('');
    const router = useRouter();

    // Get user data when component mounts
    useEffect(() => {
        getUserEmail();
        getUserShopId();
    }, []);

    const getUserId = async () => {
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (!user || authError) {
            console.error('Auth error:', authError);
            return null;
        }

        return user.id;
    }

    const getUserShopId = async () => {
        const userId = await getUserId();
        if (!userId) return;

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
        if (!userId) return;

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

    const updateUserStripeStatus = async () => {
        const userId = await getUserId();
        if (!userId) return;

        try {
            const { error: updateError } = await supabase
                .from("users")
                .update({ stripe_connected: true })
                .eq("id", userId);

            if (updateError) {
                console.error('Error updating user stripe status:', updateError);
            }
        } catch (error) {
            console.error('Error updating user stripe status:', error);
        }
    }

    const handleStripeOnboarding = async () => {
        try {
            setLoading(true);

            if (!shopId) {
                throw new Error("Shop ID not found. Please create a shop first.");
            }

            if (!email) {
                throw new Error("Email not found. Please update your profile.");
            }

            // For Stripe Connect, we'll use a custom redirect approach
            // Instead of using the Expo development server URL which Stripe doesn't accept
            const redirectUri = 'firstsips://stripe-callback';

            // We'll still use the WebBrowser with this URI
            console.log('Using redirect URI:', redirectUri);

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
            console.log('Created Stripe account:', accountData.accountId);

            // Step 2: Get Onboarding Link with our redirect URI
            const linkResponse = await fetch(`${API_URL}/stripe/create-onboarding-link`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    accountId: accountData.accountId,
                    shopId: shopId,
                    redirectUri // Pass this to backend
                })
            });

            if (!linkResponse.ok) {
                const error = await linkResponse.json();
                throw new Error(error.error || 'Failed to create onboarding link');
            }

            const linkData = await linkResponse.json();
            console.log('Got onboarding link:', linkData.url);

            // Step 3: Open the onboarding link in a browser
            console.log('Opening WebBrowser...');

            // We're using a simpler approach now - just open the URL
            // The backend will handle the redirect back to our app
            const result = await WebBrowser.openAuthSessionAsync(
                linkData.url,
                redirectUri
            );
            console.log('WebBrowser result:', result);

            // Check if we got a successful result
            if (result.type === 'success') {
                try {
                    // Parse the returned URL
                    const returnedUrl = result.url;
                    console.log('Returned URL:', returnedUrl);

                    // Extract parameters from the URL
                    const params = new URLSearchParams(returnedUrl.split('?')[1]);
                    const success = params.get('success');
                    const accountId = params.get('account_id');
                    const shopId = params.get('shop_id');
                    const stripeEnabled = params.get('stripe_enabled') === 'true';
                    const payoutsEnabled = params.get('payouts_enabled') === 'true';
                    const detailsSubmitted = params.get('details_submitted') === 'true';

                    console.log('Received params:', {
                        success, accountId, shopId,
                        stripeEnabled, payoutsEnabled, detailsSubmitted
                    });

                    if (success === 'true' && accountId) {
                        console.log('Stripe onboarding successful for account:', accountId);

                        // Update the user's stripe_connected flag
                        await updateUserStripeStatus();

                        // The backend has already updated the shop's Stripe account information
                        // We can use the parameters passed back to determine the status
                        if (stripeEnabled) {
                            // Show success message and navigate back
                            Alert.alert(
                                'Success',
                                'Your Stripe account has been connected successfully!',
                                [{
                                    text: 'OK',
                                    onPress: () => router.push('/(tabs)/shop_owner/EditShopScreen')
                                }]
                            );
                        } else {
                            // Account created but not fully set up
                            Alert.alert(
                                'Almost Done',
                                'Your Stripe account has been created, but you need to complete the setup to enable payments.',
                                [{
                                    text: 'OK',
                                    onPress: () => setLoading(false)
                                }]
                            );
                        }
                    } else {
                        // Handle error case
                        const errorMsg = params.get('error') || 'Unknown error';
                        Alert.alert(
                            'Error',
                            `There was an error connecting your Stripe account: ${errorMsg}`,
                            [{
                                text: 'OK',
                                onPress: () => setLoading(false)
                            }]
                        );
                    }
                } catch (error) {
                    console.error('Error processing WebBrowser result:', error);
                    Alert.alert(
                        'Error',
                        'There was a problem processing the Stripe response. Please try again.',
                        [{
                            text: 'OK',
                            onPress: () => setLoading(false)
                        }]
                    );
                }
            } else if (result.type === 'cancel') {
                // User canceled the process
                Alert.alert(
                    'Canceled',
                    'Stripe account setup was canceled.',
                    [{
                        text: 'OK',
                        onPress: () => setLoading(false)
                    }]
                );
            } else {
                // Some other error occurred
                Alert.alert(
                    'Error',
                    'There was a problem with the Stripe connection process. Please try again.',
                    [{
                        text: 'OK',
                        onPress: () => setLoading(false)
                    }]
                );
            }
        } catch (error: any) {
            console.error('Stripe Connect Error:', error);
            Alert.alert('Error', error.message || 'Failed to connect with Stripe');
        } finally {
            setLoading(false);
        }
    };



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
