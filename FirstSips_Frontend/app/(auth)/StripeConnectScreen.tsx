import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, Alert, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { API_URL } from '../config/api'; // Assuming API_URL is correctly configured
import ScreenWideButton from '../components/ScreenWideButton'; // Assuming this component exists and is styled consistently
import { Ionicons } from '@expo/vector-icons'; // Assuming Ionicons are available
import { supabase } from '../utils/supabase'; // Assuming Supabase client

// Define the custom redirect URI for your app
const STRIPE_REDIRECT_URI = 'firstsips://stripe-callback';

const StripeConnectScreen = () => {
    const [loading, setLoading] = useState(false); // State for general loading (processing Stripe)
    const [email, setEmail] = useState(''); // State to store user email
    const [shopId, setShopId] = useState(''); // State to store user's shop ID
    const [dataLoading, setDataLoading] = useState(true); // State specifically for initial data fetching

    const router = useRouter();

    // Effect hook to fetch user data when the component mounts
    useEffect(() => {
        const fetchData = async () => {
            setDataLoading(true); // Start data loading indicator
            const userId = await getUserId();
            if (userId) {
                await getUserEmail(userId);
                await getUserShopId(userId);
            }
            setDataLoading(false); // Stop data loading indicator
        };
        fetchData();
    }, []); // Empty dependency array means this runs once on mount

    // Helper function to get the authenticated user's ID
    const getUserId = async (): Promise<string | null> => {
        console.log('Getting user ID from Supabase auth...');
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (!user || authError) {
            console.error('Auth error:', authError?.message || 'User not found');
            Alert.alert('Authentication Error', 'Please log in again.');
            router.replace('/(auth)/LoginScreen');
            return null;
        }
        console.log('User ID retrieved successfully:', user.id);
        return user.id;
    };

    // Function to fetch the user's shop ID
    const getUserShopId = async (userId: string) => {
        console.log('Getting user shop ID for user:', userId);
        const { data: userData, error: userError } = await supabase
            .from("users")
            .select("shop_id")
            .eq("id", userId)
            .single();

        if (userError) {
            console.error('Error fetching user data:', userError.message);
            Alert.alert('Error', 'Could not fetch user data.');
            return;
        }

        if (!userData || !userData.shop_id) {
            console.error('No shop ID found for user:', userId);
            Alert.alert('Shop Required', 'No shop found for your account. Please create a shop first to connect Stripe.', [
                { text: 'OK', onPress: () => router.replace('/(auth)/CreateShopScreen') }
            ]);
            return;
        }
        console.log('Shop ID found:', userData.shop_id);
        setShopId(userData.shop_id);
    };

    // Function to fetch the user's email
    const getUserEmail = async (userId: string) => {
        console.log('Getting user email for user:', userId);
        const { data: userEmailData, error: userEmailError } = await supabase
            .from("users")
            .select("email")
            .eq("id", userId)
            .single();

        if (userEmailError) {
            console.error('Error fetching user email:', userEmailError.message);
            Alert.alert('Error', 'Could not fetch user email.');
            return;
        }

        if (!userEmailData || !userEmailData.email) {
            console.error('No email found for user:', userId);
            Alert.alert('Email Required', 'No email found for your account. Please update your profile with an email address.', [
                { text: 'OK', onPress: () => { /* TODO: Navigate to profile edit screen */ } }
            ]);
            return;
        }
        console.log('Email found:', userEmailData.email);
        setEmail(userEmailData.email);
    };

    // Function to initiate the Stripe onboarding process
    const handleStripeOnboarding = async () => {
        console.log('=== STARTING STRIPE ONBOARDING PROCESS FROM MOBILE ===');
        try {
            setLoading(true);
            console.log('Current state - shopId:', shopId, 'email:', email);

            if (!shopId || !email) {
                console.error('Shop ID or Email not found');
                Alert.alert("Required Information", "Shop ID and Email are required to connect Stripe.");
                setLoading(false);
                return;
            }
            console.log('Validation passed, proceeding with Stripe onboarding API calls');

            // Step 1: Create Stripe Account
            console.log('Calling backend to create Stripe account...');
            let accountData: { accountId: string };
            try {
                const accountResponse = await fetch(`${API_URL}/stripe/create-account`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, shopId })
                });
                if (!accountResponse.ok) { /* ... error handling ... */ throw new Error('Failed to create account'); }
                accountData = await accountResponse.json();
                console.log('Backend successfully created Stripe account:', accountData.accountId);
            } catch (fetchError: any) { /* ... error handling ... */ setLoading(false); return; }

            // Step 2: Get Onboarding Link
            console.log('Calling backend to get onboarding link...');
            let linkData: { url: string };
            try {
                const linkResponse = await fetch(`${API_URL}/stripe/create-onboarding-link`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ accountId: accountData.accountId, shopId: shopId, redirectUri: STRIPE_REDIRECT_URI })
                });
                if (!linkResponse.ok) { /* ... error handling ... */ throw new Error('Failed to get link'); }
                linkData = await linkResponse.json();
                console.log('Backend successfully returned onboarding link URL:', linkData.url);
            } catch (fetchError: any) { /* ... error handling ... */ setLoading(false); return; }

            // Step 3: Open the onboarding link
            console.log('Opening WebBrowser with URL:', linkData.url);
            let webBrowserResult;
            try {
                webBrowserResult = await WebBrowser.openAuthSessionAsync(linkData.url, STRIPE_REDIRECT_URI);
                console.log('WebBrowser result:', JSON.stringify(webBrowserResult, null, 2));
            } catch (browserError: any) { /* ... error handling ... */ setLoading(false); return; }

            // Step 4: Process the result
            if (webBrowserResult && webBrowserResult.type === 'success' && 'url' in webBrowserResult) {
                try {
                    const returnedUrl = webBrowserResult.url;
                    console.log('Returned URL from WebBrowser:', returnedUrl);
                    const url = new URL(returnedUrl);
                    const params = new URLSearchParams(url.search);
                    const successParam = params.get('success');
                    const accountIdParam = params.get('account_id');
                    const chargesEnabledParam = params.get('charges_enabled');
                    const payoutsEnabledParam = params.get('payouts_enabled');
                    const detailsSubmittedParam = params.get('details_submitted');
                    const errorParam = params.get('error');

                    console.log('Parsed parameters:', { successParam, accountIdParam, chargesEnabledParam, payoutsEnabledParam, detailsSubmittedParam, errorParam });

                    const isSuccess = successParam === 'true';
                    const chargesEnabled = chargesEnabledParam === 'true';
                    const payoutsEnabled = payoutsEnabledParam === 'true';
                    // const detailsSubmitted = detailsSubmittedParam === 'true'; // Already checked by backend

                    if (isSuccess && accountIdParam) {
                        console.log('Stripe onboarding reported as successful.');
                        if (chargesEnabled && payoutsEnabled) {
                            Alert.alert('Success', 'Your Stripe account is fully connected!', [{ text: 'OK', onPress: () => router.replace('/(tabs)/shop_owner/EditShopScreen') }]);
                        } else {
                            Alert.alert('Account Setup Complete', 'Stripe is reviewing your information. Charges/payouts will be enabled soon.', [{ text: 'OK', onPress: () => router.replace('/(tabs)/shop_owner/EditShopScreen') }]);
                        }
                    } else {
                        const errorMessage = errorParam ? decodeURIComponent(errorParam) : 'Stripe setup was not completed.';
                        console.error('Stripe onboarding reported failure. Error:', errorMessage);
                        Alert.alert('Setup Failed', `Issue completing Stripe setup: ${errorMessage}`);
                    }
                } catch (error: any) { /* ... error handling ... */ }
            } else if (webBrowserResult && webBrowserResult.type === 'cancel') {
                console.log('Stripe setup canceled.');
                Alert.alert('Canceled', 'Stripe account setup was canceled.');
            } else { /* ... unexpected error handling ... */ }
        } catch (error: any) { /* ... general error handling ... */ }
        finally { setLoading(false); }
    };

    // Show loading indicator while fetching initial data
    if (dataLoading) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#6F4E37" />
                    <Text style={styles.loadingText}>Loading...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                {/* Back Button */}
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/dashboard/DashboardScreen')}
                    accessibilityLabel="Go back"
                >
                    <Ionicons name="arrow-back" size={24} color="#555555" />
                </TouchableOpacity>

                <View style={styles.contentContainer}>
                    <Text style={styles.titleText}>Connect with Stripe</Text>
                    <Text style={styles.infoText}>
                        To receive payments for your sales, connect a Stripe account. This is a secure process handled directly by Stripe.
                    </Text>

                    {loading ? (
                        <ActivityIndicator size="large" color="#6F4E37" style={styles.activityIndicator} />
                    ) : (
                        <ScreenWideButton
                            text="Connect with Stripe"
                            onPress={handleStripeOnboarding}
                            color="#6F4E37" // Primary button style
                            textColor="#FFFFFF"
                            style={styles.primaryButton} // Apply primary button styles
                            disabled={!shopId || !email}
                        />
                    )}
                    {(!shopId || !email) && !loading && (
                        <Text style={styles.disabledButtonHint}>
                            Please ensure your shop details and email are set up.
                        </Text>
                    )}
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#FFFFFF", // White background
    },
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    loadingContainer: { // Centered loading for initial data fetch
        flex: 1,
        backgroundColor: "#FFFFFF",
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#555555', // Medium grey
    },
    backButton: {
        position: 'absolute',
        top: 50,
        left: 16,
        padding: 8,
        zIndex: 1,
    },
    contentContainer: {
        width: '100%',
        maxWidth: 400,
        alignItems: 'center',
        gap: 20, // Add gap for spacing
    },
    titleText: {
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#333333', // Dark grey
        marginBottom: 8,
    },
    infoText: {
        fontSize: 16,
        textAlign: 'center',
        color: '#555555', // Medium grey
        marginBottom: 24,
        lineHeight: 24,
    },
    activityIndicator: {
        marginVertical: 20,
    },
    primaryButton: { // Style for the main connect button
        borderRadius: 12,
        paddingVertical: 14,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
    },
    disabledButtonHint: {
        marginTop: 10,
        fontSize: 14,
        textAlign: 'center',
        color: '#888888', // Lighter grey for hint
    }
});

export default StripeConnectScreen;
