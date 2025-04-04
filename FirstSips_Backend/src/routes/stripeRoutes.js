const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const admin = require('firebase-admin');
const db = admin.firestore();

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
    const { accountId, shopId } = req.body;

    try {
        // Store the accountId temporarily with an expiration
        const tempKey = `stripe_${accountId}`;
        await db.collection('temp_stripe_data').doc(tempKey).set({
            shopId,
            accountId,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            expires: new Date(Date.now() + 3600000) // 1 hour expiration
        });

        const accountLink = await stripe.accountLinks.create({
            account: accountId,
            refresh_url: `${process.env.STRIPE_REFRESH_URL}?account_id=${accountId}`,
            return_url: `${process.env.STRIPE_RETURN_URL}?account_id=${accountId}`,
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
    const { account_id } = req.query;
    
    try {
        // Retrieve the temporary data
        const tempKey = `stripe_${account_id}`;
        const tempDoc = await db.collection('temp_stripe_data').doc(tempKey).get();
        
        if (!tempDoc.exists) {
            throw new Error('No temporary data found for this account');
        }

        const tempData = tempDoc.data();
        const { shopId } = tempData;

        // Check the account status
        const account = await stripe.accounts.retrieve(account_id);

        // Update shop's Stripe status
        await db.collection('shops').doc(shopId).update({
            stripeAccountId: account_id,
            stripeEnabled: account.charges_enabled,
            payoutsEnabled: account.payouts_enabled,
            detailsSubmitted: account.details_submitted,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // Clean up temporary data
        await db.collection('temp_stripe_data').doc(tempKey).delete();

        // Redirect to the app with success status
        const redirectUrl = encodeURI(`firstsips://stripe-success?shop_id=${shopId}`);
        res.redirect(redirectUrl);
    } catch (error) {
        console.error('Return handler error:', error);
        const errorUrl = encodeURI('firstsips://stripe-error');
        res.redirect(errorUrl);
    }
});

// Handle refresh/retry of Stripe onboarding
router.get('/refresh', async (req, res) => {
    const { account_id } = req.query;
    
    try {
        // Retrieve the temporary data
        const tempKey = `stripe_${account_id}`;
        const tempDoc = await db.collection('temp_stripe_data').doc(tempKey).get();
        
        if (!tempDoc.exists) {
            throw new Error('No temporary data found for this account');
        }

        // Create a new onboarding link
        const accountLink = await stripe.accountLinks.create({
            account: account_id,
            refresh_url: `${process.env.STRIPE_REFRESH_URL}?account_id=${account_id}`,
            return_url: `${process.env.STRIPE_RETURN_URL}?account_id=${account_id}`,
            type: 'account_onboarding',
        });

        res.redirect(accountLink.url);
    } catch (error) {
        console.error('Refresh handler error:', error);
        res.redirect('firstsips://stripe-error');
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
                await db.collection('shops').doc(shopId).update({
                    stripeEnabled: account.charges_enabled,
                    payoutsEnabled: account.payouts_enabled,
                    detailsSubmitted: account.details_submitted,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });
            }
        }

        res.json({ received: true });
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(400).send(`Webhook Error: ${error.message}`);
    }
});

module.exports = router;
