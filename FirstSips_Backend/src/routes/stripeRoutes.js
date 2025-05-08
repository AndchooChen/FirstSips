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

        console.log('Returning account ID to client:', account.id);
        res.json({ accountId: account.id });
    } catch (error) {
        console.error('Create account error:', error);
        console.error('Error details:', error.message);
        if (error.type) {
            console.error('Stripe error type:', error.type);
        }
        if (error.raw) {
            console.error('Stripe raw error:', error.raw);
        }
        res.status(400).json({ error: error.message });
    }
});

// Route to generate an onboarding link
router.post('/create-onboarding-link', async (req, res) => {
    console.log('=== CREATE ONBOARDING LINK ENDPOINT CALLED ===');
    console.log('Request body:', req.body);
    const { accountId, shopId, redirectUri } = req.body;
    console.log('Account ID:', accountId);
    console.log('Shop ID:', shopId);
    console.log('Redirect URI:', redirectUri);

    if (!accountId || !shopId) {
        console.error('Missing required parameters: accountId or shopId');
        return res.status(400).json({ error: 'Account ID and Shop ID are required' });
    }

    try {
        console.log('Storing temporary data in Supabase');
        // Store the accountId temporarily with an expiration
        const { error: insertError } = await supabase
            .from('temp_stripe_data')
            .insert({
                id: `stripe_${accountId}`,
                shop_id: shopId,
                account_id: accountId,
                redirect_uri: redirectUri,
                created_at: new Date().toISOString(),
                expires_at: new Date(Date.now() + 3600000).toISOString() // 1 hour expiration
            });

        if (insertError) {
            console.error('Error storing temp data in Supabase:', insertError);
            throw new Error(`Failed to store temporary data: ${insertError.message}`);
        }
        console.log('Temporary data stored successfully');

        // Stripe requires HTTPS URLs for their API
        // We'll use our backend URLs and then redirect to the app
        console.log('Using backend URLs for Stripe');

        // Use the backend URLs that Stripe will accept
        // These should be HTTPS URLs pointing to your deployed backend
        const baseUrl = process.env.NODE_ENV === 'production'
            ? process.env.BACKEND_URL || 'https://firstsips-backend.herokuapp.com'
            : 'http://localhost:5000';

        const return_url = `${baseUrl}/stripe/return?account_id=${accountId}&shop_id=${shopId}`;
        const refresh_url = `${baseUrl}/stripe/refresh?account_id=${accountId}`;

        console.log('Return URL for Stripe:', return_url);
        console.log('Refresh URL for Stripe:', refresh_url);

        console.log('Creating Stripe account link...');
        const accountLink = await stripe.accountLinks.create({
            account: accountId,
            refresh_url,
            return_url,
            type: 'account_onboarding',
        });

        console.log('Stripe account link created successfully');
        console.log('Onboarding URL:', accountLink.url);

        res.json({ url: accountLink.url });
    } catch (error) {
        console.error('Create onboarding link error:', error);
        console.error('Error details:', error.message);
        if (error.type) {
            console.error('Stripe error type:', error.type);
        }
        if (error.raw) {
            console.error('Stripe raw error:', error.raw);
        }
        res.status(400).json({ error: error.message });
    }
});

// Handle return from Stripe onboarding
router.get('/return', async (req, res) => {
    const { account_id, shop_id } = req.query;
    let redirectUri = null;

    try {
        const { data: tempData, error: tempError } = await supabase
            .from('temp_stripe_data')
            .select('shop_id, redirect_uri')
            .eq('id', `stripe_${account_id}`)
            .single();

        if (tempError) {
            console.error('Error retrieving temporary data:', tempError);
            return res.status(500).send(`Failed to retrieve temporary data: ${tempError.message}`);
        }

        if (!tempData) {
            console.error('No temporary data found for account ID:', account_id);
            return res.status(404).send('No temporary data found for this account.');
        }

        const { shop_id: retrievedShopId, redirect_uri: storedRedirectUri } = tempData;
        redirectUri = storedRedirectUri;
        console.log(`Retrieved temporary data for shop ${retrievedShopId}, redirecting to: ${redirectUri}`);

        const account = await stripe.accounts.retrieve(account_id);
        console.log('Retrieved Stripe account:', account_id);

        const { data: updatedShop, error: updateError } = await supabase
            .from('shops')
            .update({
                stripe_account_id: account_id,
                stripe_enabled: account.charges_enabled,
                payouts_enabled: account.payouts_enabled,
                details_submitted: account.details_submitted,
                stripe_requirements: account.requirements ? JSON.stringify(account.requirements) : null,
                stripe_capabilities: account.capabilities ? JSON.stringify(account.capabilities) : null,
                stripe_connected: true,
                updated_at: new Date().toISOString()
            })
            .eq('id', retrievedShopId)
            .select();

        if (updateError) {
            console.error('Error updating shop record:', updateError);
            return res.status(500).send(`Failed to update shop record: ${updateError.message}`);
        }

        if (!updatedShop || updatedShop.length === 0) {
            console.warn('WARNING: Supabase update affected 0 rows. Check shopId and RLS policies.');
            // Consider if this warrants an error response
        } else {
            console.log('Successfully updated shop record with Stripe account information.');
        }

        const { error: deleteError } = await supabase
            .from('temp_stripe_data')
            .delete()
            .eq('id', `stripe_${account_id}`);

        if (deleteError) {
            console.error('Error cleaning up temporary data:', deleteError);
            // Log the error but don't necessarily fail the request
        } else {
            console.log('Cleaned up temporary data.');
        }

        if (redirectUri) {
            const successRedirectUrl = new URL(redirectUri);
            successRedirectUrl.searchParams.set('status', 'success');
            successRedirectUrl.searchParams.set('account_id', account_id);
            console.log('Redirecting to app:', successRedirectUrl.toString()); // ADD THIS LINE
            return res.redirect(302, successRedirectUrl.toString());
        } else {
            console.warn('No redirect_uri found in temp data. Sending default success message.');
            return res.status(200).send('Stripe setup complete. You can close this window.');
        }

    } catch (error) {
        console.error('Return handler error:', error);
        if (redirectUri) {
            const errorRedirectUrl = new URL(redirectUri);
            errorRedirectUrl.searchParams.set('status', 'error');
            errorRedirectUrl.searchParams.set('message', error.message || 'Unknown error');
            if (account_id) {
                errorRedirectUrl.searchParams.set('account_id', account_id);
            }
            console.log('Redirecting to app with error:', errorRedirectUrl.toString()); // Consider adding this for error cases too
            return res.redirect(302, errorRedirectUrl.toString());
        } else {
            return res.status(500).send(`
                <html>
                    <head><title>Stripe Setup Error</title></head>
                    <body><h1>Stripe Setup Error</h1><p><strong>${error.message}</strong></p></body>
                </html>
            `);
        }
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

        // Display a simple error page
        res.status(500).send(`
            <html>
            <head>
                <title>Stripe Setup Error</title>
                <style>
                    body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                    .error { color: red; }
                    .container { max-width: 600px; margin: 0 auto; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1 class="error">Stripe Setup Error</h1>
                    <p>There was a problem refreshing your Stripe onboarding:</p>
                    <p><strong>${error.message}</strong></p>
                    <p>You can close this window and try again from the app.</p>
                </div>
            </body>
            </html>
        `);
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
