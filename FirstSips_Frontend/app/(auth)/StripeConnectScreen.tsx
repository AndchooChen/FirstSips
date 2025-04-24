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
            await getUserEmail();
            await getUserShopId();
            setDataLoading(false); // Stop data loading indicator
        };
        fetchData();
    }, []); // Empty dependency array means this runs once on mount

    // Helper function to get the authenticated user's ID
    const getUserId = async () => {
        console.log('Getting user ID from Supabase auth...');
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (!user || authError) {
            console.error('Auth error:', authError);
            // Consider navigating to login if user is not authenticated
            Alert.alert('Authentication Error', 'Please log in again.');
            router.replace('/LoginScreen'); // Navigate to login screen
            return null;
        }

        console.log('User ID retrieved successfully:', user.id);
        return user.id;
    };

    // Function to fetch the user's shop ID
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
            Alert.alert('Error', 'Could not fetch user data.');
            return;
        }

        if (!userData || !userData.shop_id) {
            console.error('No shop ID found for user:', userId);
            Alert.alert('Shop Required', 'No shop found for your account. Please create a shop first to connect Stripe.', [
                { text: 'OK', onPress: () => router.replace('/CreateShopScreen') } // Navigate to create shop screen
            ]);
            return;
        }

        console.log('Shop ID found:', userData.shop_id);
        setShopId(userData.shop_id);
    };

    // Function to fetch the user's email
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
            Alert.alert('Error', 'Could not fetch user email.');
            return;
        }

        if (!userEmail || !userEmail.email) {
            console.error('No email found for user:', userId);
            Alert.alert('Email Required', 'No email found for your account. Please update your profile with an email address.', [
                 { text: 'OK', onPress: () => { /* TODO: Navigate to profile edit screen if available */ } }
            ]);
            return;
        }

        console.log('Email found:', userEmail.email);
        setEmail(userEmail.email);
    };

    // Function to update the user's stripe_connected status in the database
    // This might be redundant if the backend webhook handles this, but good as a fallback
    const updateUserStripeConnectedStatus = async (connected: boolean) => {
        console.log(`Updating user stripe_connected status to ${connected}...`);
        const userId = await getUserId();
        if (!userId) {
            console.error('Cannot update Stripe connected status: User ID is null');
            return;
        }

        try {
            const { error: updateError } = await supabase
                .from("users")
                .update({ stripe_connected: connected })
                .eq("id", userId);

            if (updateError) {
                console.error('Error updating user stripe_connected status:', updateError);
            } else {
                console.log('User stripe_connected status updated successfully');
            }
        } catch (error) {
            console.error('Error updating user stripe_connected status:', error);
        }
    };

    // Function to initiate the Stripe onboarding process
    const handleStripeOnboarding = async () => {
        console.log('=== STARTING STRIPE ONBOARDING PROCESS FROM MOBILE ===');
        try {
            setLoading(true); // Start general loading indicator
            console.log('Current state - shopId:', shopId, 'email:', email);

            // Perform checks before proceeding
            if (!shopId) {
                console.error('Shop ID not found');
                Alert.alert("Required Information", "Shop ID not found. Please create a shop first.");
                setLoading(false);
                return; // Stop the process
            }

            if (!email) {
                console.error('Email not found');
                Alert.alert("Required Information", "Email not found. Please update your profile.");
                setLoading(false);
                 return; // Stop the process
            }

            console.log('Validation passed, proceeding with Stripe onboarding API calls');

            // Step 1: Create Stripe Account (Call Backend API)
            console.log('Calling backend to create Stripe account...');
            let accountData: { accountId: string };
            try {
                const accountResponse = await fetch(`${API_URL}/stripe/create-account`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, shopId }) // Pass email and shopId to backend
                });

                if (!accountResponse.ok) {
                    const errorData = await accountResponse.json();
                    throw new Error(errorData.error || 'Failed to create Stripe account');
                }
                accountData = await accountResponse.json();
                console.log('Backend successfully created Stripe account:', accountData.accountId);
            } catch (fetchError: any) {
                console.error('Error calling create-account endpoint:', fetchError);
                Alert.alert('Stripe Error', `Failed to create Stripe account: ${fetchError.message}`);
                setLoading(false);
                return; // Stop the process
            }

            // Step 2: Get Onboarding Link (Call Backend API)
            console.log('Calling backend to get onboarding link...');
            let linkData: { url: string };
            try {
                const linkResponse = await fetch(`${API_URL}/stripe/create-onboarding-link`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        accountId: accountData.accountId,
                        shopId: shopId, // Pass shopId again
                        redirectUri: STRIPE_REDIRECT_URI // Pass the mobile app's redirect URI
                    })
                });

                if (!linkResponse.ok) {
                     const errorData = await linkResponse.json();
                    throw new Error(errorData.error || 'Failed to create onboarding link');
                }
                linkData = await linkResponse.json();
                console.log('Backend successfully returned onboarding link URL:', linkData.url);
            } catch (fetchError: any) {
                console.error('Error calling create-onboarding-link endpoint:', fetchError);
                Alert.alert('Stripe Error', `Failed to get onboarding link: ${fetchError.message}`);
                setLoading(false);
                return; // Stop the process
            }

            // Step 3: Open the onboarding link in a browser using WebBrowser
            console.log('Opening WebBrowser with URL:', linkData.url);
            console.log('Expecting redirect back to:', STRIPE_REDIRECT_URI);

            let webBrowserResult;
            try {
                // Use openAuthSessionAsync to handle the redirect back to the app
                webBrowserResult = await WebBrowser.openAuthSessionAsync(
                    linkData.url,
                    STRIPE_REDIRECT_URI
                );
                console.log('WebBrowser result type:', webBrowserResult.type);
                if ('url' in webBrowserResult) {
                    console.log('WebBrowser result URL:', webBrowserResult.url);
                }
                console.log('Full WebBrowser result:', JSON.stringify(webBrowserResult, null, 2));
            } catch (browserError: any) {
                console.error('Error opening WebBrowser:', browserError);
                Alert.alert('Browser Error', `Could not open browser for Stripe setup: ${browserError.message}`);
                setLoading(false);
                return; // Stop the process
            }

            // Step 4: Process the result from the WebBrowser (This is where we parse backend redirect params)
            if (webBrowserResult && webBrowserResult.type === 'success' && 'url' in webBrowserResult) {
                try {
                    // Parse the returned URL from the backend redirect
                    const returnedUrl = webBrowserResult.url;
                    console.log('Returned URL from WebBrowser (backend redirect):', returnedUrl);

                    const url = new URL(returnedUrl);
                    const params = new URLSearchParams(url.search);

                    // Extract the status parameters appended by your backend /return endpoint
                    const successParam = params.get('success');
                    const accountIdParam = params.get('account_id');
                    const chargesEnabledParam = params.get('charges_enabled');
                    const payoutsEnabledParam = params.get('payouts_enabled');
                    const detailsSubmittedParam = params.get('details_submitted');
                    const errorParam = params.get('error');

                    console.log('Parsed parameters from redirect:', {
                        successParam, accountIdParam, chargesEnabledParam,
                        payoutsEnabledParam, detailsSubmittedParam, errorParam
                    });

                    // Determine the outcome based on the parsed parameters
                    const isSuccess = successParam === 'true';
                    const chargesEnabled = chargesEnabledParam === 'true';
                    const payoutsEnabled = payoutsEnabledParam === 'true';
                    const detailsSubmitted = detailsSubmittedParam === 'true';

                    if (isSuccess && accountIdParam) {
                         console.log('Stripe onboarding reported as successful by backend redirect.');

                        // You might want to update a local state or trigger a refetch
                        // of the shop's status here if needed, although the backend
                        // should have already updated the database.

                        // Provide feedback based on the account's capabilities
                        if (chargesEnabled && payoutsEnabled) {
                            Alert.alert(
                                'Success',
                                'Your Stripe account is fully connected and enabled!',
                                [{ text: 'OK', onPress: () => router.replace('/(tabs)/shop_owner/EditShopScreen') }]
                            );
                             // Update user status in your DB if not already handled by webhook
                            await updateUserStripeConnectedStatus(true);
                        } else if (detailsSubmitted) {
                             Alert.alert(
                                'Account Setup Complete',
                                'Your Stripe account details have been submitted. Stripe may need a little more time to enable charges and payouts.',
                                [{ text: 'OK', onPress: () => router.replace('/(tabs)/shop_owner/EditShopScreen') }]
                            );
                             // Update user status in your DB if not already handled by webhook
                            await updateUserStripeConnectedStatus(true); // Consider it connected if details submitted
                        }
                        else {
                            Alert.alert(
                                'Setup Incomplete',
                                'Your Stripe account was created, but additional steps are required to enable payments.',
                                [{ text: 'OK', onPress: () => { /* Stay or navigate */ } }]
                            );
                             // Update user status in your DB if not already handled by webhook
                             await updateUserStripeConnectedStatus(false); // Not fully connected
                        }

                    } else {
                        // Handle failure based on error parameter from backend
                        const errorMessage = errorParam || 'Stripe setup was not completed.';
                        console.error('Stripe onboarding reported failure by backend redirect. Error:', errorMessage);
                        Alert.alert(
                            'Setup Failed',
                            `There was an issue completing the Stripe setup: ${decodeURIComponent(errorMessage)}`,
                            [{ text: 'OK', onPress: () => { /* Stay or navigate */ } }]
                        );
                         // Update user status in your DB if not already handled by webhook
                         await updateUserStripeConnectedStatus(false);
                    }

                } catch (error: any) {
                    console.error('Error processing WebBrowser result URL:', error);
                    Alert.alert(
                        'Processing Error',
                        'There was a problem processing the Stripe response. Please try again.',
                        [{ text: 'OK', onPress: () => { /* Stay or navigate */ } }]
                    );
                     // Update user status in your DB if not already handled by webhook
                     await updateUserStripeConnectedStatus(false);
                }
            } else if (webBrowserResult && webBrowserResult.type === 'cancel') {
                // User canceled the process
                console.log('Stripe account setup was canceled by the user.');
                Alert.alert(
                    'Canceled',
                    'Stripe account setup was canceled.',
                    [{ text: 'OK', onPress: () => { /* Stay or navigate */ } }]
                );
                 // Update user status in your DB if not already handled by webhook
                 await updateUserStripeConnectedStatus(false);
            } else {
                // Some other unexpected result from WebBrowser
                console.error('Unexpected WebBrowser result:', webBrowserResult);
                Alert.alert(
                    'Unexpected Error',
                    'An unexpected issue occurred during the Stripe connection process. Please try again.',
                    [{ text: 'OK', onPress: () => { /* Stay or navigate */ } }]
                );
                 // Update user status in your DB if not already handled by webhook
                 await updateUserStripeConnectedStatus(false);
            }
        } catch (error: any) {
            console.error('Stripe Connect Process Error:', error);
            // Catch any errors not handled in the specific steps (e.g., initial fetch errors)
            Alert.alert('Error', error.message || 'Failed to connect with Stripe');
             // Update user status in your DB if not already handled by webhook
             await updateUserStripeConnectedStatus(false);
        } finally {
            setLoading(false); // Stop general loading indicator regardless of outcome
        }
    };


    // Show a loading indicator while initial data is being fetched
    if (dataLoading) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#D4A373" />
                    <Text style={styles.loadingText}>Loading...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        // SafeAreaView helps handle notches and status bars
        <SafeAreaView style={styles.safeArea}>
            {/* Main Container */}
            <View style={styles.container}>
                {/* Back Button */}
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                    accessibilityLabel="Go back" // Accessibility label
                >
                    <Ionicons name="arrow-back" size={24} color="#6F4E37" /> {/* Consistent back arrow color */}
                </TouchableOpacity>

                {/* Content Container */}
                <View style={styles.contentContainer}>
                     {/* Title */}
                    <Text style={styles.titleText}>Connect with Stripe</Text>

                    {/* Informative Text */}
                    <Text style={styles.infoText}>
                        To receive payments for your sales, you need to connect a Stripe account. This is a secure process handled by Stripe.
                    </Text>

                    {/* Loading Indicator or Connect Button */}
                    {loading ? (
                        // Show activity indicator when processing Stripe connection
                        <ActivityIndicator size="large" color="#D4A373" style={styles.activityIndicator} />
                    ) : (
                        // Show the connect button when not loading
                        <ScreenWideButton
                            text="Connect with Stripe"
                            onPress={handleStripeOnboarding}
                            color="#D4A373" // Primary color
                            textColor="#FFFFFF" // White text
                            disabled={!shopId || !email} // Disable button if shopId or email are missing
                        />
                    )}
                     {/* Optional: Add text below button if disabled */}
                     {(!shopId || !email) && (
                         <Text style={styles.disabledButtonHint}>
                             Please ensure your shop details and email are set up to connect Stripe.
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
        backgroundColor: "#F5EDD8", // Consistent background color
    },
    container: {
        flex: 1,
        backgroundColor: "#F5EDD8", // Consistent background color
        alignItems: 'center', // Center content horizontally
        justifyContent: 'center', // Center content vertically
        padding: 24, // Consistent padding
    },
     loadingContainer: {
        flex: 1,
        backgroundColor: "#F5EDD8",
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#6F4E37',
    },
    backButton: {
        position: 'absolute', // Absolute positioning
        top: 40, // Position from top
        left: 16, // Position from left
        padding: 8, // Padding for touch area
        zIndex: 1, // Ensure it's above other content
    },
    contentContainer: {
        width: '100%', // Take full width
        maxWidth: 400, // Optional: Limit max width
        alignItems: 'center', // Center items within this container
    },
    titleText: {
        fontSize: 28, // Title font size
        fontWeight: 'bold', // Bold font weight
        marginBottom: 24, // Space below title
        textAlign: 'center', // Center text
        color: '#333', // Dark text color
    },
    infoText: {
        fontSize: 16, // Info text font size
        textAlign: 'center', // Center text
        marginBottom: 32, // Space below info text
        color: '#6F4E37', // Consistent text color
        lineHeight: 24, // Improve readability
    },
    activityIndicator: {
        marginVertical: 20, // Vertical margin for activity indicator
    },
    disabledButtonHint: {
        marginTop: 10,
        fontSize: 14,
        textAlign: 'center',
        color: '#6F4E37', // Hint text color
    }
});

export default StripeConnectScreen;
