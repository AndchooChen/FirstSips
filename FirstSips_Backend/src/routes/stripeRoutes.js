const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const supabase = require('../config/supabase-config');

// Route to create a Stripe Connect Express account
router.post('/create-account', async (req, res) => {
    const { email } = req.body;

    try {
        const account = await stripe.accounts.create({
            type: 'express',
            email: email,
            capabilities: {
                card_payments: { requested: true },
                transfers: { requested: true },
                tax_reporting_us_1099_k: { requested: true }, // Required for US tax reporting
            },
            business_type: 'individual',
            business_profile: {
                mcc: '5812', // Restaurant/Cafe
                url: 'https://firstsips.app'
            },
            settings: {
                payouts: {
                    schedule: {
                        interval: 'daily'
                    }
                }
            }
        });

        res.json({ accountId: account.id });
    } catch (error) {
        console.error('Create account error:', error);
        res.status(400).json({ error: error.message });
    }
});

// Route to generate an onboarding link
router.post('/create-onboarding-link', async (req, res) => {
    const { accountId, shopId, redirectUri } = req.body;

    if (!accountId || !shopId) {
        return res.status(400).json({ error: 'Account ID and Shop ID are required' });
    }

    try {
        // Store the accountId temporarily with an expiration
        await supabase
            .from('temp_stripe_data')
            .insert({
                id: `stripe_${accountId}`,
                shop_id: shopId,
                account_id: accountId,
                created_at: new Date().toISOString(),
                expires_at: new Date(Date.now() + 3600000).toISOString() // 1 hour expiration
            });

        // Determine the return and refresh URLs
        let return_url, refresh_url;

        // Stripe requires HTTPS URLs for their API
        // We'll use our backend URLs and then redirect to the app
        console.log('Using backend URLs for Stripe');

        // Store the original redirectUri in the database for later use
        if (redirectUri) {
            console.log('Original redirectUri (will be used after Stripe redirect):', redirectUri);
            // Update the temp_stripe_data record with the redirectUri
            await supabase
                .from('temp_stripe_data')
                .update({ redirect_uri: redirectUri })
                .eq('id', `stripe_${accountId}`);
        }

        // Use the backend URLs that Stripe will accept
        // These should be HTTPS URLs pointing to your deployed backend
        const baseUrl = process.env.NODE_ENV === 'production'
            ? process.env.BACKEND_URL || 'https://firstsips-backend.herokuapp.com'
            : 'http://localhost:5000';

        return_url = `${baseUrl}/stripe/return?account_id=${accountId}&shop_id=${shopId}`;
        refresh_url = `${baseUrl}/stripe/refresh?account_id=${accountId}`;

        const accountLink = await stripe.accountLinks.create({
            account: accountId,
            refresh_url,
            return_url,
            type: 'account_onboarding',
        });

        res.json({ url: accountLink.url });
    } catch (error) {
        console.error('Create onboarding link error:', error);
        res.status(400).json({ error: error.message });
    }
});

// Handle return from Stripe onboarding
router.get('/return', async (req, res) => {
    const { account_id, shop_id } = req.query;
    console.log('Return handler called with account_id:', account_id, 'shop_id:', shop_id);

    try {
        // Retrieve the temporary data
        const { data: tempData, error: tempError } = await supabase
            .from('temp_stripe_data')
            .select('*')
            .eq('id', `stripe_${account_id}`)
            .single();

        if (tempError || !tempData) {
            throw new Error('No temporary data found for this account');
        }

        const shopId = tempData.shop_id;
        const redirectUri = tempData.redirect_uri;
        console.log('Found temp data with shopId:', shopId, 'redirectUri:', redirectUri);

        // Check the account status
        const account = await stripe.accounts.retrieve(account_id);
        console.log('Retrieved Stripe account:', account_id);

        // Update shop's Stripe status
        await supabase
            .from('shops')
            .update({
                stripe_account_id: account_id,
                stripe_enabled: account.charges_enabled,
                payouts_enabled: account.payouts_enabled,
                details_submitted: account.details_submitted,
                updated_at: new Date().toISOString()
            })
            .eq('id', shopId);
        console.log('Updated shop record with Stripe account ID');

        // Clean up temporary data
        await supabase
            .from('temp_stripe_data')
            .delete()
            .eq('id', `stripe_${account_id}`);
        console.log('Cleaned up temporary data');

        // Redirect to our HTML page that will handle the redirect back to the app
        const baseUrl = process.env.NODE_ENV === 'production'
            ? process.env.BACKEND_URL || 'https://firstsips-backend.herokuapp.com'
            : 'http://localhost:5000';

        const redirectUrl = `${baseUrl}/redirect.html?success=true&account_id=${account_id}&shop_id=${shopId}&stripe_enabled=${account.charges_enabled}&payouts_enabled=${account.payouts_enabled}&details_submitted=${account.details_submitted}`;
        console.log('Redirecting to HTML redirect page:', redirectUrl);
        res.redirect(redirectUrl);
    } catch (error) {
        console.error('Return handler error:', error);

        // Redirect to our HTML page with error information
        const baseUrl = process.env.NODE_ENV === 'production'
            ? process.env.BACKEND_URL || 'https://firstsips-backend.herokuapp.com'
            : 'http://localhost:5000';

        const errorUrl = `${baseUrl}/redirect.html?success=false&error=${encodeURIComponent(error.message)}`;
        console.log('Redirecting to HTML error page:', errorUrl);
        res.redirect(errorUrl);
    }
});

// API endpoint to update Stripe account status
// This is used by the WebBrowser flow to check account status
router.get('/account-status/:accountId', async (req, res) => {
    const { accountId } = req.params;

    try {
        // Retrieve the temporary data
        const { data: tempData, error: tempError } = await supabase
            .from('temp_stripe_data')
            .select('*')
            .eq('id', `stripe_${accountId}`)
            .single();

        if (tempError || !tempData) {
            return res.status(404).json({ error: 'No temporary data found for this account' });
        }

        const shopId = tempData.shop_id;

        // Check the account status
        const account = await stripe.accounts.retrieve(accountId);

        // Update shop's Stripe status
        await supabase
            .from('shops')
            .update({
                stripe_account_id: accountId,
                stripe_enabled: account.charges_enabled,
                payouts_enabled: account.payouts_enabled,
                details_submitted: account.details_submitted,
                updated_at: new Date().toISOString()
            })
            .eq('id', shopId);

        // Clean up temporary data
        await supabase
            .from('temp_stripe_data')
            .delete()
            .eq('id', `stripe_${accountId}`);

        // Return success response
        res.json({
            success: true,
            shopId,
            accountId,
            charges_enabled: account.charges_enabled,
            payouts_enabled: account.payouts_enabled,
            details_submitted: account.details_submitted
        });
    } catch (error) {
        console.error('Account status check error:', error);
        res.status(500).json({ error: error.message });
    }
});

// API endpoint to check a shop's Stripe status
router.get('/shop-stripe-status/:shopId', async (req, res) => {
    const { shopId } = req.params;
    console.log('Checking Stripe status for shop:', shopId);

    try {
        // Get the shop record
        const { data: shopData, error: shopError } = await supabase
            .from('shops')
            .select('stripe_account_id, stripe_enabled, payouts_enabled, details_submitted')
            .eq('id', shopId)
            .single();

        if (shopError || !shopData) {
            return res.status(404).json({ error: 'Shop not found' });
        }

        // If the shop has a Stripe account ID, check its status
        if (shopData.stripe_account_id) {
            try {
                // Get the latest account status from Stripe
                const account = await stripe.accounts.retrieve(shopData.stripe_account_id);

                // Update the shop record with the latest status
                await supabase
                    .from('shops')
                    .update({
                        stripe_enabled: account.charges_enabled,
                        payouts_enabled: account.payouts_enabled,
                        details_submitted: account.details_submitted,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', shopId);

                // Return the updated status
                return res.json({
                    success: true,
                    shopId,
                    accountId: shopData.stripe_account_id,
                    stripeEnabled: account.charges_enabled,
                    payoutsEnabled: account.payouts_enabled,
                    detailsSubmitted: account.details_submitted
                });
            } catch (stripeError) {
                console.error('Error retrieving Stripe account:', stripeError);
                // Return the status from the database if we can't get it from Stripe
                return res.json({
                    success: true,
                    shopId,
                    accountId: shopData.stripe_account_id,
                    stripeEnabled: shopData.stripe_enabled,
                    payoutsEnabled: shopData.payouts_enabled,
                    detailsSubmitted: shopData.details_submitted,
                    fromDatabase: true
                });
            }
        } else {
            // Shop doesn't have a Stripe account yet
            return res.json({
                success: false,
                shopId,
                stripeConnected: false,
                message: 'Shop does not have a Stripe account connected'
            });
        }
    } catch (error) {
        console.error('Shop Stripe status check error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Handle refresh/retry of Stripe onboarding
router.get('/refresh', async (req, res) => {
    const { account_id } = req.query;
    console.log('Refresh handler called with account_id:', account_id);

    try {
        // Retrieve the temporary data
        const { data: tempData, error: tempError } = await supabase
            .from('temp_stripe_data')
            .select('*')
            .eq('id', `stripe_${account_id}`)
            .single();

        if (tempError || !tempData) {
            throw new Error('No temporary data found for this account');
        }

        const shopId = tempData.shop_id;
        const redirectUri = tempData.redirect_uri;
        console.log('Found temp data with shopId:', shopId, 'redirectUri:', redirectUri);

        // Use the backend URLs that Stripe will accept
        const baseUrl = process.env.NODE_ENV === 'production'
            ? process.env.BACKEND_URL || 'https://firstsips-backend.herokuapp.com'
            : 'http://localhost:5000';

        // Create a new onboarding link
        const accountLink = await stripe.accountLinks.create({
            account: account_id,
            refresh_url: `${baseUrl}/stripe/refresh?account_id=${account_id}`,
            return_url: `${baseUrl}/stripe/return?account_id=${account_id}&shop_id=${shopId}`,
            type: 'account_onboarding',
        });

        console.log('Created new onboarding link, redirecting to Stripe');
        res.redirect(accountLink.url);
    } catch (error) {
        console.error('Refresh handler error:', error);

        // Redirect to our HTML page with error information
        const baseUrl = process.env.NODE_ENV === 'production'
            ? process.env.BACKEND_URL || 'https://firstsips-backend.herokuapp.com'
            : 'http://localhost:5000';

        const errorUrl = `${baseUrl}/redirect.html?success=false&error=${encodeURIComponent(error.message)}`;
        console.log('Redirecting to HTML error page:', errorUrl);
        res.redirect(errorUrl);
    }
});

// Route to check account status
router.get('/check-account-status/:accountId', async (req, res) => {
    try {
        const account = await stripe.accounts.retrieve(req.params.accountId);
        res.json({
            chargesEnabled: account.charges_enabled,
            payoutsEnabled: account.payouts_enabled,
            detailsSubmitted: account.details_submitted
        });
    } catch (error) {
        console.error('Check account status error:', error);
        res.status(400).json({ error: error.message });
    }
});

// Webhook handler
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];

    try {
        const event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );

        if (event.type === 'account.updated') {
            const account = event.data.object;
            const shopId = account.metadata.shopId;

            if (shopId) {
                const { error: updateError } = await supabase
                    .from('shops')
                    .update({
                        stripe_enabled: account.charges_enabled,
                        payouts_enabled: account.payouts_enabled,
                        details_submitted: account.details_submitted,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', shopId);

                if (updateError) {
                    console.error('Error updating shop:', updateError);
                }
            }
        }

        res.json({ received: true });
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(400).send(`Webhook Error: ${error.message}`);
    }
});

module.exports = router;
