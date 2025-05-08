import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, Alert, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { API_URL } from '../config/api';
import ScreenWideButton from '../components/ScreenWideButton';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../utils/supabase';

const StripeConnectScreen = () => {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [shopId, setShopId] = useState('');
    const router = useRouter();

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
            Alert.alert('Error', 'Failed to fetch user data.');
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
            Alert.alert('Error', 'Failed to fetch user email.');
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
                Alert.alert("Error", "Shop ID not found. Please create a shop first.");
                return;
            }

            if (!email) {
                console.error('Email not found');
                 Alert.alert("Error", "Email not found. Please update your profile.");
                return;
            }

            console.log('Validation passed, proceeding with Stripe onboarding');

            const redirectUri = 'firstsips://stripe-callback';

            console.log('Using redirect URI:', redirectUri);

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
                         const errorJson = JSON.parse(errorText);
                         throw new Error(errorJson.error || `Failed to create Stripe account: ${accountResponse.status}`);
                    } catch (parseError) {
                         throw new Error(`Failed to create Stripe account: ${errorText}`);
                    }
                }

                accountData = await accountResponse.json();
                console.log('Created Stripe account:', accountData.accountId);
            } catch (fetchError: any) {
                console.error('Fetch error during create-account:', fetchError);
                Alert.alert('Error', fetchError.message || 'Failed to create Stripe account.');
                return;
            }

            console.log('Getting onboarding link for account:', accountData.accountId);
            let linkData: { url: string };

            try {
                const linkResponse = await fetch(`${API_URL}/stripe/create-onboarding-link`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        accountId: accountData.accountId,
                        shopId: shopId,
                        redirectUri
                    })
                });

                console.log('Link response status:', linkResponse.status);

                if (!linkResponse.ok) {
                    const errorText = await linkResponse.text();
                    console.error('Error response from create-onboarding-link:', errorText);
                    try {
                         const errorJson = JSON.parse(errorText);
                         throw new Error(errorJson.error || `Failed to create onboarding link: ${linkResponse.status}`);
                    } catch (parseError) {
                         throw new Error(`Failed to create onboarding link: ${errorText}`);
                    }
                }

                linkData = await linkResponse.json();
                console.log('Got onboarding link:', linkData.url);
            } catch (fetchError: any) {
                console.error('Fetch error during create-onboarding-link:', fetchError);
                Alert.alert('Error', fetchError.message || 'Failed to create onboarding link.');
                 return;
            }
            console.log('Opening WebBrowser...');
            console.log('Opening URL:', linkData.url);
            console.log('Redirect URI:', redirectUri);

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
            } catch (browserError: any) {
                console.error('Error opening WebBrowser:', browserError);
                Alert.alert('Error', browserError.message || 'Failed to open browser for Stripe setup.');
                 return;
            }

            if (webBrowserResult && webBrowserResult.type === 'success' && 'url' in webBrowserResult) {
                try {
                    const returnedUrl = webBrowserResult.url;
                    console.log('Returned URL:', returnedUrl);

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

                        await updateUserStripeStatus();

                        if (stripeEnabled) {
                            Alert.alert(
                                'Success',
                                'Your Stripe account has been connected successfully!',
                                [{
                                    text: 'OK',
                                    onPress: () => router.push('/(tabs)/shop_owner/EditShopScreen')
                                }]
                            );
                        } else {
                            Alert.alert(
                                'Almost Done',
                                'Your Stripe account has been created, but you need to complete the setup to enable payments.',
                                [{
                                    text: 'OK',
                                    onPress: () => {
                                        console.log('Stripe account created but not fully enabled.');
                                    }
                                }]
                            );
                        }
                    } else {
                        const errorMsg = params.get('error') || 'Unknown error during Stripe connection.';
                        Alert.alert(
                            'Error',
                            `There was an error connecting your Stripe account: ${errorMsg}`,
                            [{
                                text: 'OK',
                                onPress: () => console.log('Stripe connection failed.')
                            }]
                        );
                    }
                } catch (error: any) {
                    console.error('Error processing WebBrowser result:', error);
                    Alert.alert(
                        'Error',
                        error.message || 'There was a problem processing the Stripe response. Please try again.'
                    );
                }
            } else if (webBrowserResult && webBrowserResult.type === 'cancel') {
                Alert.alert(
                    'Canceled',
                    'Stripe account setup was canceled.'
                );
            } else {
                 console.error('Unexpected WebBrowser result:', webBrowserResult);
                Alert.alert(
                    'Error',
                    'There was a problem with the Stripe connection process. Please try again.'
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
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                    accessibilityLabel="Go back"
                >
                    <Ionicons name="arrow-back" size={24} color="#6F4E37" />
                </TouchableOpacity>

                <View style={styles.contentContainer}>
                    <Text style={styles.titleText}>Connect with Stripe</Text>
                    <Text style={styles.subtitleText}>
                        To receive payments for your shop, you need to set up a Stripe account. This is a quick and secure process.
                    </Text>

                    {loading ? (
                        <ActivityIndicator size="large" color="#6F4E37" style={styles.loadingIndicator} />
                    ) : (
                        <ScreenWideButton
                            text="Connect with Stripe"
                            onPress={handleStripeOnboarding}
                            color="#6F4E37"
                            textColor="#FFFFFF"
                            style={styles.primaryButton}
                            disabled={!shopId || !email}
                        />
                    )}
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    // Safe Area style for full screen coverage and background
    safeArea: {
        flex: 1,
        backgroundColor: "#FFFFFF", // Consistent white background
    },
    // Main container for centered content and padding
    container: {
        flex: 1,
        alignItems: "center", // Center content horizontally
        justifyContent: "center", // Center content vertically
        paddingHorizontal: 24, // Consistent horizontal padding
        paddingBottom: 40, // Add some padding at the bottom
    },
    // Back button positioning and padding
    backButton: {
        position: 'absolute',
        top: 50, // Consistent top position
        left: 16, // Consistent left position
        padding: 8, // Consistent padding for tappable area
        zIndex: 1 // Ensure button is above other content
    },
    // Container for title, subtitle, and button with consistent spacing
    contentContainer: {
        width: "100%", // Take full width up to maxWidth
        alignItems: "center", // Center items within this container
        maxWidth: 400, // Optional: Limit maximum width for larger screens
        gap: 20, // Consistent vertical spacing between elements
    },
    // Title text style
    titleText: {
        fontSize: 28, // Consistent title font size
        fontWeight: "bold", // Consistent bold weight
        textAlign: "center", // Consistent text alignment
        color: "#333333", // Consistent dark text color
        marginBottom: 8, // Consistent spacing below title
    },
    // Subtitle text style
    subtitleText: {
        fontSize: 16, // Consistent subtitle font size
        textAlign: "center", // Consistent text alignment
        color: "#555555", // Consistent gray text color
        marginBottom: 32, // Consistent spacing below subtitle
    },
    // Loading indicator style
    loadingIndicator: {
        marginVertical: 20, // Add vertical margin around the indicator
    },
    // Primary button styles (replicated from the guide)
    primaryButton: {
        borderRadius: 12, // Consistent border radius
        paddingVertical: 14, // Consistent vertical padding
        elevation: 2, // Consistent shadow for Android
        shadowColor: '#000', // Consistent shadow color
        shadowOffset: { width: 0, height: 1 }, // Consistent shadow offset
        shadowOpacity: 0.2, // Consistent shadow opacity
        shadowRadius: 1.41, // Consistent shadow radius
        // Assuming ScreenWideButton handles width: "100%" or similar
    },
    // Secondary button styles (not used on this screen, but included for reference)
    secondaryButton: {
        borderRadius: 12,
        paddingVertical: 14,
        borderWidth: 1.5,
        borderColor: "#6F4E37",
    },
});

export default StripeConnectScreen;
