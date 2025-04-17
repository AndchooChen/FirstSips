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
        console.log('Getting user ID from Supabase auth...');
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (!user || authError) {
            console.error('Auth error:', authError);
            return null;
        }

        console.log('User ID retrieved successfully:', user.id);
        return user.id;
    }

    const getUserShopId = async () => {
        console.log('Getting user shop ID...');
        const userId = await getUserId();
        if (!userId) {
            console.error('Cannot get shop ID: User ID is null');
            return;
        }

        console.log('Fetching shop ID for user:', userId);
        const { data: userData, error: userError } = await supabase
            .from("users")
            .select("shop_id")
            .eq("id", userId)
            .single();

        if (userError) {
            console.error('Error fetching user data:', userError);
            return;
        }

        if (!userData || !userData.shop_id) {
            console.error('No shop ID found for user:', userId);
            Alert.alert('Error', 'No shop found for your account. Please create a shop first.');
            return;
        }

        console.log('Shop ID found:', userData.shop_id);
        setShopId(userData.shop_id);
    }

    const getUserEmail = async () => {
        console.log('Getting user email...');
        const userId = await getUserId();
        if (!userId) {
            console.error('Cannot get email: User ID is null');
            return;
        }

        console.log('Fetching email for user:', userId);
        const {data: userEmail, error: userEmailError} = await supabase
            .from("users")
            .select("email")
            .eq("id", userId)
            .single();

        if (userEmailError) {
            console.error('Error fetching user email:', userEmailError);
            return;
        }

        if (!userEmail || !userEmail.email) {
            console.error('No email found for user:', userId);
            Alert.alert('Error', 'No email found for your account. Please update your profile.');
            return;
        }

        console.log('Email found:', userEmail.email);
        setEmail(userEmail.email);
    }

    const updateUserStripeStatus = async () => {
        console.log('Updating user Stripe status...');
        const userId = await getUserId();
        if (!userId) {
            console.error('Cannot update Stripe status: User ID is null');
            return;
        }

        try {
            console.log('Setting stripe_connected=true for user:', userId);
            const { error: updateError } = await supabase
                .from("users")
                .update({ stripe_connected: true })
                .eq("id", userId);

            if (updateError) {
                console.error('Error updating user stripe status:', updateError);
            } else {
                console.log('User Stripe status updated successfully');
            }
        } catch (error) {
            console.error('Error updating user stripe status:', error);
        }
    }

    const handleStripeOnboarding = async () => {
        console.log('=== STARTING STRIPE ONBOARDING PROCESS ===');
        try {
            setLoading(true);
            console.log('Current state - shopId:', shopId, 'email:', email);

            if (!shopId) {
                console.error('Shop ID not found');
                throw new Error("Shop ID not found. Please create a shop first.");
            }

            if (!email) {
                console.error('Email not found');
                throw new Error("Email not found. Please update your profile.");
            }

            console.log('Validation passed, proceeding with Stripe onboarding');

            // For Stripe Connect, we'll use a custom redirect approach
            // Instead of using the Expo development server URL which Stripe doesn't accept
            const redirectUri = 'firstsips://stripe-callback';

            // We'll still use the WebBrowser with this URI
            console.log('Using redirect URI:', redirectUri);
            console.log('This URI will be used for the WebBrowser to return to the app');

            // Step 1: Create Stripe Account
            console.log('Creating Stripe account with email:', email);
            console.log('API URL:', API_URL);
            let accountData: { accountId: string };

            try {
                const accountResponse = await fetch(`${API_URL}/stripe/create-account`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email })
                });

                console.log('Account response status:', accountResponse.status);

                if (!accountResponse.ok) {
                    const errorText = await accountResponse.text();
                    console.error('Error response from create-account:', errorText);
                    try {
                        const error = JSON.parse(errorText);
                        throw new Error(error.error || 'Failed to create Stripe account');
                    } catch (parseError) {
                        throw new Error(`Failed to create Stripe account: ${errorText}`);
                    }
                }

                accountData = await accountResponse.json();
                console.log('Created Stripe account:', accountData.accountId);
            } catch (fetchError) {
                console.error('Fetch error during create-account:', fetchError);
                throw fetchError;
            }

            // Step 2: Get Onboarding Link with our redirect URI
            console.log('Getting onboarding link for account:', accountData.accountId);
            let linkData: { url: string };

            try {
                const linkResponse = await fetch(`${API_URL}/stripe/create-onboarding-link`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        accountId: accountData.accountId,
                        shopId: shopId,
                        redirectUri // Pass this to backend
                    })
                });

                console.log('Link response status:', linkResponse.status);

                if (!linkResponse.ok) {
                    const errorText = await linkResponse.text();
                    console.error('Error response from create-onboarding-link:', errorText);
                    try {
                        const error = JSON.parse(errorText);
                        throw new Error(error.error || 'Failed to create onboarding link');
                    } catch (parseError) {
                        throw new Error(`Failed to create onboarding link: ${errorText}`);
                    }
                }

                linkData = await linkResponse.json();
                console.log('Got onboarding link:', linkData.url);
            } catch (fetchError) {
                console.error('Fetch error during create-onboarding-link:', fetchError);
                throw fetchError;
            }

            // Step 3: Open the onboarding link in a browser
            console.log('Opening WebBrowser...');
            console.log('Opening URL:', linkData.url);
            console.log('Redirect URI:', redirectUri);

            // We're using a simpler approach now - just open the URL
            // The backend will handle the redirect back to our app
            let webBrowserResult;
            try {
                webBrowserResult = await WebBrowser.openAuthSessionAsync(
                    linkData.url,
                    redirectUri
                );
                console.log('WebBrowser result type:', webBrowserResult.type);
                if ('url' in webBrowserResult) {
                    console.log('WebBrowser result URL:', webBrowserResult.url);
                }
                console.log('Full WebBrowser result:', JSON.stringify(webBrowserResult, null, 2));
            } catch (browserError) {
                console.error('Error opening WebBrowser:', browserError);
                throw browserError;
            }

            // Check if we got a successful result
            if (webBrowserResult && webBrowserResult.type === 'success' && 'url' in webBrowserResult) {
                try {
                    // Parse the returned URL
                    const returnedUrl = webBrowserResult.url;
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
            } else if (webBrowserResult && webBrowserResult.type === 'cancel') {
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
