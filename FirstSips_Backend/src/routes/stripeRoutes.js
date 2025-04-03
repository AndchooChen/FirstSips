const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

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
            },
        });

        res.json({ accountId: account.id });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Route to generate an onboarding link
router.post('/create-onboarding-link', async (req, res) => {
    const { accountId } = req.body;

    try {
        const accountLink = await stripe.accountLinks.create({
            account: accountId,
            refresh_url: 'http://192.168.50.84:5000/retry-onboarding',
            return_url: 'myapp://app/(tabs)/shop_owner/EditShopScreen',
            type: 'account_onboarding',
        });

        res.json({ url: accountLink.url });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Route to check account status
router.get('/check-account-status/:accountId', async (req, res) => {
    try {
        const account = await stripe.accounts.retrieve(req.params.accountId);
        res.json({
            chargesEnabled: account.charges_enabled,
            payoutsEnabled: account.payouts_enabled,
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;
