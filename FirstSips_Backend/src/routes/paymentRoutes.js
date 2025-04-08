const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
<<<<<<< HEAD
const admin = require('firebase-admin');
const db = admin.firestore();

// Unified payment-sheet endpoint
router.post('/payment-sheet', async (req, res) => {
  try {
    const { amount, currency = 'usd', customerId, shopId } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    if (!shopId) {
      return res.status(400).json({ error: 'Shop ID is required' });
    }

    // Get shop owner's Stripe account ID
    const shopDoc = await db.collection('shops').doc(shopId).get();
    if (!shopDoc.exists) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    const shopData = shopDoc.data();
    const shopOwnerStripeAccountId = shopData.stripeAccountId;

    if (!shopOwnerStripeAccountId) {
      return res.status(400).json({ error: 'Shop owner has not completed Stripe onboarding' });
    }

    // Verify account capabilities
    try {
      const account = await stripe.accounts.retrieve(shopOwnerStripeAccountId);
      if (!account.capabilities.transfers === 'active') {
        return res.status(400).json({ 
          error: 'Shop account does not have transfers capability enabled. Please complete the Stripe onboarding process.',
          code: 'incomplete_onboarding'
        });
      }
    } catch (error) {
      console.error('Error verifying account capabilities:', error);
      return res.status(500).json({ error: 'Failed to verify shop account capabilities' });
    }

    // Get or create a customer
    let customer;
    if (customerId) {
      try {
        customer = await stripe.customers.retrieve(customerId);
      } catch (err) {
        customer = await stripe.customers.create({
          metadata: {
            firebaseUserId: customerId
          }
        });
      }
    } else {
      customer = await stripe.customers.create();
    }

    // Create ephemeral key for the customer
    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customer.id },
      { apiVersion: '2023-10-16' }
    );

    // Calculate application fee (10% of the amount)
    const applicationFeeAmount = Math.round(amount * 0.1);

    // Create payment intent with transfer data
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount),
      currency,
      customer: customer.id,
      automatic_payment_methods: {
        enabled: true,
      },
      application_fee_amount: applicationFeeAmount,
      transfer_data: {
        destination: shopOwnerStripeAccountId,
      },
      metadata: {
        shopId,
        firebaseUserId: customerId
      }
    });

    res.json({
      paymentIntent: paymentIntent.client_secret,
      ephemeralKey: ephemeralKey.secret,
      customer: customer.id,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY
    });
  } catch (error) {
    console.error('Payment Sheet Error:', error);
    res.status(500).json({ error: error.message });
  }
});
=======
>>>>>>> 68fb1e5fa391f1bdac2f665bb27bc781ec148f7d

// Create Payment Intent
router.post('/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency = 'usd' } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount),
      currency,
      automatic_payment_methods: {
        enabled: true,
<<<<<<< HEAD
      },
      payment_method_types: ['card'],
      transfer_data: {
          destination: shopOwnerStripeAccountId,
      },
=======
      }
>>>>>>> 68fb1e5fa391f1bdac2f665bb27bc781ec148f7d
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    console.error('Payment Intent Error:', error);
    res.status(500).json({ error: error.message });
  }
});

<<<<<<< HEAD
// Webhook
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];

  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);

    if (event.type === 'account.updated') {
      const account = event.data.object;
      console.log(`Account ${account.id} updated: charges_enabled=${account.charges_enabled}`);
    }

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      // Update order status in Firestore
      if (paymentIntent.metadata.shopId) {
        const ordersRef = db.collection('orders');
        const orderQuery = await ordersRef.where('paymentIntentId', '==', paymentIntent.id).get();
        
        if (!orderQuery.empty) {
          const orderDoc = orderQuery.docs[0];
          await orderDoc.ref.update({
            status: 'paid',
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
        }
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error.message);
    res.status(400).send(`Webhook Error: ${error.message}`);
=======
// Webhook handler
router.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);

    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        // Handle successful payment
        console.log('Payment succeeded:', paymentIntent.id);
        // TODO: Update order status in your database
        break;
      case 'payment_intent.payment_failed':
        // Handle failed payment
        console.log('Payment failed:', event.data.object.id);
        break;
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Webhook Error:', err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

// Get payment status
router.get('/status/:paymentIntentId', async (req, res) => {
  try {
    const { paymentIntentId } = req.params;
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    res.json({ status: paymentIntent.status });
  } catch (error) {
    res.status(500).json({ error: error.message });
>>>>>>> 68fb1e5fa391f1bdac2f665bb27bc781ec148f7d
  }
});

module.exports = router;