import React, { useState, useEffect } from 'react';
import { View, Text, Button, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { FIREBASE_DB, FIREBASE_AUTH } from '../auth/FirebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

const StripeConnectScreen = () => {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const router = useRouter();

    const handleStripeOnboarding = async () => {
        try {
            setLoading(true);
            
            console.log("Creating stripe with email:", {email});
            // Step 1: Create Stripe Account
            const accountResponse = await fetch('http://192.168.50.84:5000/stripe/create-account', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify({ email })
            });
            console.log(accountResponse);
            const accountData = await accountResponse.json();
            if (!accountResponse.ok) throw new Error(accountData.error);
            console.log("After response");

            // Step 2: Get Onboarding Link
            const linkResponse = await fetch('http://192.168.50.84:5000/stripe/create-onboarding-link', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accountId: accountData.accountId })
            });
            const linkData = await linkResponse.json();
            if (!linkResponse.ok) throw new Error(linkData.error);

            // Step 3: Open the onboarding link in a browser
            Linking.openURL(linkData.url);

            setLoading(false);
        } catch (error) {
            setLoading(false);
            console.log(error);
        }
    };

    useEffect(() => {
        const fetchEmail = async () => {
            /*
            if (router.params?.email) {
                setEmail(router.params.email);
            }
            else {
                const userId = FIREBASE_AUTH.currentUser?.uid;

                if (!userId) {
                    return;
                }

                const userDoc = await getDoc(doc(FIREBASE_DB, "users", userId));
                const userEmail = userDoc.data()?.email;
                setEmail(userEmail);
            }
            */

            const userId = FIREBASE_AUTH.currentUser?.uid;

            if (!userId) {
                return;
            }

            const userDoc = await getDoc(doc(FIREBASE_DB, "users", userId));
            const userEmail = userDoc.data()?.email;
            setEmail(userEmail);
        }

        fetchEmail();
    }, []);

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
            <Text style={{ fontSize: 18, textAlign: 'center', marginBottom: 20 }}>
                To receive payments, you need to set up a Stripe account.
            </Text>
            {loading ? (
                <ActivityIndicator size="large" color="#007AFF" />
            ) : (
                <Button title="Connect with Stripe" onPress={handleStripeOnboarding} />
            )}
        </View>
    );
};

export default StripeConnectScreen;
