const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const supabase = require('../config/supabase-config');

// Route to create a Stripe Connect Express account
// Modified to accept shopId and add it to metadata
router.post('/create-account', async (req, res) => {
    const { email, shopId } = req.body; // Expecting shopId here now

    if (!email || !shopId) {
        console.error('Missing required parameters: email or shopId');
        return res.status(400).json({ error: 'Email and Shop ID are required' });
    }

    try {
        const account = await stripe.accounts.create({
            type: 'express',
            email: email,
            capabilities: {
                card_payments: { requested: true },
                transfers: { requested: true },
                tax_reporting_us_1099_k: { requested: true }, // Required for US tax reporting
            },
            business_type: 'individual', // Assuming individual for now, adjust if needed
            business_profile: {
                mcc: '5812', // Restaurant/Cafe - adjust if needed
                url: 'https://firstsips.app' // Replace with your actual app URL
            },
            settings: {
                payouts: {
                    schedule: {
                        interval: 'daily' // Adjust payout interval if needed
                    }
                }
            },
            metadata: { // Add shopId to Stripe account metadata
                shopId: shopId
            }
        });

        console.log('Created Stripe account:', account.id, 'with metadata shopId:', account.metadata.shopId);
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
    const { accountId, shopId, redirectUri } = req.body; // shopId and redirectUri are crucial here

    if (!accountId || !shopId || !redirectUri) {
        console.error('Missing required parameters: accountId, shopId, or redirectUri');
        return res.status(400).json({ error: 'Account ID, Shop ID, and Redirect URI are required' });
    }

    try {
        console.log('Storing temporary data in Supabase');
        // Store the accountId, shopId, and redirectUri temporarily with an expiration
        const { error: insertError } = await supabase
            .from('temp_stripe_data')
            .insert({
                id: `stripe_${accountId}`, // Use accountId as part of the key
                shop_id: shopId, // Store shopId
                account_id: accountId, // Store accountId
                redirect_uri: redirectUri, // Store mobile app's redirect URI
                created_at: new Date().toISOString(),
                expires_at: new Date(Date.now() + 3600000).toISOString() // 1 hour expiration
            });

        if (insertError) {
            console.error('Error storing temp data in Supabase:', insertError);
            throw new Error(`Failed to store temporary data: ${insertError.message}`);
        }
        console.log('Temporary data stored successfully for account:', accountId);

        // Use the backend URLs that Stripe will accept for return and refresh
        const baseUrl = process.env.NODE_ENV === 'production'
            ? process.env.BACKEND_URL || 'https://firstsips-backend.herokuapp.com' // Replace with your production backend URL
            : 'http://localhost:5000'; // Replace with your development backend URL

        // Construct backend return and refresh URLs, including account_id and shop_id
        const return_url = `${baseUrl}/stripe/return?account_id=${accountId}&shop_id=${shopId}`;
        const refresh_url = `${baseUrl}/stripe/refresh?account_id=${accountId}`;

        console.log('Return URL for Stripe:', return_url);
        console.log('Refresh URL for Stripe:', refresh_url);

        console.log('Creating Stripe account link...');
        const accountLink = await stripe.accountLinks.create({
            account: accountId,
            refresh_url,
            return_url,
            type: 'account_onboarding', // Type for standard onboarding flow
        });

        console.log('Stripe account link created successfully');
        console.log('Onboarding URL:', accountLink.url);

        res.json({ url: accountLink.url }); // Return the Stripe onboarding URL to the mobile app
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
// Modified to retrieve temp data, get live status, update DB, and redirect to mobile app
router.get('/return', async (req, res) => {
    console.log('=== RETURN ENDPOINT CALLED ===');
    console.log('Query parameters:', req.query);
    const { account_id } = req.query; // Get account_id from Stripe's redirect

    if (!account_id) {
        console.error('Missing account_id in return query parameters');
        // Redirect back to mobile app with an error
        const fallbackRedirectUri = 'firstsips://stripe-callback'; // Fallback URI
        return res.redirect(`${fallbackRedirectUri}?success=false&error=missing_account_id`);
    }

    try {
        console.log('Retrieving temporary data from Supabase for account:', account_id);
        // Retrieve the temporary data using the account_id
        const { data: tempData, error: tempError } = await supabase
            .from('temp_stripe_data')
            .select('shop_id, redirect_uri') // Select only necessary fields
            .eq('id', `stripe_${account_id}`)
            .single();

        if (tempError || !tempData) {
            console.error('No temporary data found or error retrieving for account ID:', account_id, tempError);
            // Redirect back to mobile app with an error if temp data is missing
            const fallbackRedirectUri = 'firstsips://stripe-callback'; // Fallback URI
            return res.redirect(`${fallbackRedirectUri}?success=false&error=temp_data_not_found`);
        }

        console.log('Retrieved temporary data:', tempData);
        const { shop_id, redirect_uri } = tempData; // Get shopId and original redirectUri

        console.log('Retrieving live Stripe account details for account:', account_id);
        // Retrieve the *live* account status directly from Stripe
        const account = await stripe.accounts.retrieve(account_id);
        console.log('Retrieved live Stripe account status.');

        // Update shop's Stripe status with all relevant information from the live account object
        const { error: updateError } = await supabase
            .from('shops')
            .update({
                stripe_account_id: account_id,
                stripe_enabled: account.charges_enabled, // Live status
                payouts_enabled: account.payouts_enabled, // Live status
                details_submitted: account.details_submitted, // Live status
                stripe_requirements: account.requirements ? JSON.stringify(account.requirements) : null, // Store requirements
                stripe_capabilities: account.capabilities ? JSON.stringify(account.capabilities) : null, // Store capabilities
                stripe_connected: account.charges_enabled && account.payouts_enabled, // Consider connected if both are true
                updated_at: new Date().toISOString()
            })
            .eq('id', shop_id); // Use the shop_id from temporary data

        if (updateError) {
            console.error('Error updating shop record:', updateError);
            // Continue, but log the error
        } else {
            console.log('Successfully updated shop record with live Stripe account information');
        }

        console.log('Cleaning up temporary data for account:', account_id);
        // Clean up temporary data
        const { error: deleteError } = await supabase
            .from('temp_stripe_data')
            .delete()
            .eq('id', `stripe_${account_id}`);

        if (deleteError) {
            console.error('Error cleaning up temporary data:', deleteError);
            // Continue even if cleanup fails
        } else {
            console.log('Cleaned up temporary data');
        }

        // *** Redirect back to the mobile app with status parameters ***
        const finalRedirectUrl = `${redirect_uri}?success=true&account_id=${account.id}&charges_enabled=${account.charges_enabled}&payouts_enabled=${account.payouts_enabled}&details_submitted=${account.details_submitted}`;
        console.log('Redirecting back to mobile app:', finalRedirectUrl);
        res.redirect(finalRedirectUrl); // Perform the redirect

    } catch (error) {
        console.error('Return handler error:', error);
        // Redirect back to mobile app with an error
        const fallbackRedirectUri = tempData?.redirect_uri || 'firstsips://stripe-callback'; // Use stored URI or fallback
        const finalRedirectUrl = `${fallbackRedirectUri}?success=false&error=${encodeURIComponent(error.message || 'An unexpected error occurred')}`;
        console.log('Redirecting back to mobile app with error:', finalRedirectUrl);
        res.redirect(finalRedirectUrl); // Perform the redirect with error
    }
});

// Handle refresh/retry of Stripe onboarding
// Modified to retrieve temp data and redirect to new link
router.get('/refresh', async (req, res) => {
    const { account_id } = req.query;
    console.log('Refresh handler called with account_id:', account_id);

    if (!account_id) {
        console.error('Missing account_id in refresh query parameters');
        // Display a simple error page or redirect to a static error page
        return res.status(400).send(`
            <html><body><h1>Error</h1><p>Missing account ID.</p><p>You can close this window.</p></body></html>
        `);
    }

    try {
        console.log('Retrieving temporary data from Supabase for account:', account_id);
        // Retrieve the temporary data
        const { data: tempData, error: tempError } = await supabase
            .from('temp_stripe_data')
            .select('shop_id, redirect_uri') // Select necessary fields
            .eq('id', `stripe_${account_id}`)
            .single();

        if (tempError || !tempData) {
            console.error('No temporary data found or error retrieving for account ID:', account_id, tempError);
            // Display a simple error page if temp data is missing
             return res.status(404).send(`
                <html><body><h1>Error</h1><p>Temporary data not found for this account. Please try again from the app.</p><p>You can close this window.</p></body></html>
            `);
        }

        console.log('Retrieved temporary data:', tempData);
        const { shop_id, redirect_uri } = tempData; // Get shopId and original redirectUri

        // Use the backend URLs that Stripe will accept
        const baseUrl = process.env.NODE_ENV === 'production'
            ? process.env.BACKEND_URL || 'https://firstsips-backend.herokuapp.com' // Replace with your production backend URL
            : 'http://localhost:5000'; // Replace with your development backend URL

        // Create a new onboarding link, including account_id and shop_id in return URL
        console.log('Creating new Stripe account link...');
        const accountLink = await stripe.accountLinks.create({
            account: account_id,
            refresh_url: `${baseUrl}/stripe/refresh?account_id=${account_id}`,
            return_url: `${baseUrl}/stripe/return?account_id=${account_id}&shop_id=${shop_id}`, // Include shop_id here
            type: 'account_onboarding',
        });

        console.log('Created new onboarding link, redirecting to Stripe:', accountLink.url);
        res.redirect(accountLink.url); // Redirect the user to the new Stripe link

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

// API endpoint to check account status - COMMENTED OUT as it seems redundant with /return
/*
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
*/

// API endpoint to check a shop's Stripe status (useful for the app to query)
router.get('/shop-stripe-status/:shopId', async (req, res) => {
    const { shopId } = req.params;
    console.log('Checking Stripe status for shop:', shopId);

    try {
        // Get the shop record from Supabase
        const { data: shopData, error: shopError } = await supabase
            .from('shops')
            .select('stripe_account_id, stripe_enabled, payouts_enabled, details_submitted')
            .eq('id', shopId)
            .single();

        if (shopError || !shopData) {
            console.error('Shop not found or error fetching:', shopId, shopError);
            return res.status(404).json({ error: 'Shop not found' });
        }

        // If the shop has a Stripe account ID, attempt to get the latest status from Stripe
        if (shopData.stripe_account_id) {
            try {
                console.log('Retrieving live Stripe account status for account:', shopData.stripe_account_id);
                const account = await stripe.accounts.retrieve(shopData.stripe_account_id);

                // Update the shop record with the latest status from Stripe (optional, but keeps DB in sync)
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
                    console.error('Error updating shop record with latest Stripe status:', updateError);
                    // Continue, but log the error
                } else {
                    console.log('Shop record updated with latest Stripe status');
                }

                // Return the live status
                return res.json({
                    success: true,
                    shopId,
                    accountId: shopData.stripe_account_id,
                    stripeEnabled: account.charges_enabled,
                    payoutsEnabled: account.payouts_enabled,
                    detailsSubmitted: account.details_submitted,
                    fromDatabase: false // Indicate status is live from Stripe
                });
            } catch (stripeError) {
                console.error('Error retrieving Stripe account from Stripe:', stripeError);
                // If we can't get the live status from Stripe, return the status from the database
                console.log('Returning status from database due to Stripe API error.');
                return res.json({
                    success: true, // Still considered 'successful' in that we found the shop
                    shopId,
                    accountId: shopData.stripe_account_id,
                    stripeEnabled: shopData.stripe_enabled,
                    payoutsEnabled: shopData.payouts_enabled,
                    detailsSubmitted: shopData.details_submitted,
                    fromDatabase: true, // Indicate status is from the database
                    warning: 'Could not retrieve live status from Stripe.'
                });
            }
        } else {
            // Shop doesn't have a Stripe account yet
            console.log('Shop does not have a Stripe account connected.');
            return res.json({
                success: true, // Indicate the check was successful
                shopId,
                stripeConnected: false, // Explicitly state not connected
                message: 'Shop does not have a Stripe account connected'
            });
        }
    } catch (error) {
        console.error('Shop Stripe status check error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Webhook handler
// Assuming webhook secret is configured and endpoint is accessible by Stripe
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET; // Your webhook secret

    if (!webhookSecret) {
        console.error('Stripe webhook secret not configured.');
        return res.status(500).send('Webhook secret not configured.');
    }

    let event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            webhookSecret
        );
         console.log('Webhook received:', event.type);
    } catch (err: any) {
        console.error(`Webhook signature verification failed: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
        case 'account.updated':
            const account = event.data.object; // updated account object
            console.log('Account updated event received for account:', account.id);

            // Retrieve shopId from metadata
            const shopIdFromMetadata = account.metadata.shopId;

            if (shopIdFromMetadata) {
                console.log('Updating shop record based on account.updated event for shop:', shopIdFromMetadata);
                try {
                    const { error: updateError } = await supabase
                        .from('shops')
                        .update({
                            stripe_enabled: account.charges_enabled,
                            payouts_enabled: account.payouts_enabled,
                            details_submitted: account.details_submitted,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', shopIdFromMetadata); // Use shopId from metadata

                    if (updateError) {
                        console.error('Error updating shop record from webhook:', updateError);
                    } else {
                        console.log('Shop record updated successfully from webhook.');
                    }
                } catch (dbError) {
                     console.error('Database error updating shop from webhook:', dbError);
                }
            } else {
                console.warn('Account updated event received, but no shopId found in metadata for account:', account.id);
            }
            break;
        // Handle other event types as needed
        // case 'payment_intent.succeeded':
        //     // Handle successful payments
        //     break;
        // case 'transfer.created':
        //     // Handle transfers
        //     break;
        default:
            // Unexpected event type
            console.log(`Unhandled event type ${event.type}`);
    }

    // Return a 200 response to acknowledge receipt of the event
    res.json({ received: true });
});

module.exports = router;
