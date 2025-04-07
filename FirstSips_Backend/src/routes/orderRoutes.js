const express = require('express');
const router = express.Router();
const { admin } = require('../config/firebase-config');
const { verifyToken } = require('../middlewares/authMiddleware');

const db = admin.firestore();

// Create a new order
router.post('/', verifyToken, async (req, res) => {
    try {
        const { shopId, items, totalAmount, pickupTime } = req.body;

        // Validate shop exists
        const shopDoc = await db.collection('shops').doc(shopId).get();
        if (!shopDoc.exists) {
            return res.status(404).json({ error: 'Shop not found' });
        }

        const orderData = {
            userId: req.user.uid,
            shopId,
            items,
            totalAmount,
            pickupTime,
            status: 'pending',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        const orderRef = await db.collection('orders').add(orderData);
        res.status(201).json({ id: orderRef.id, ...orderData });
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ error: 'Failed to create order' });
    }
});

// Get order details
router.get('/:orderId', verifyToken, async (req, res) => {
    try {
        const orderDoc = await db.collection('orders').doc(req.params.orderId).get();
        if (!orderDoc.exists) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const orderData = orderDoc.data();
        // Check if user is either the customer or the shop owner
        if (orderData.userId !== req.user.uid) {
            const shopDoc = await db.collection('shops').doc(orderData.shopId).get();
            if (!shopDoc.exists || shopDoc.data().ownerId !== req.user.uid) {
                return res.status(403).json({ error: 'Unauthorized' });
            }
        }

        res.json({ id: orderDoc.id, ...orderData });
    } catch (error) {
        console.error('Error fetching order:', error);
        res.status(500).json({ error: 'Failed to fetch order' });
    }
});

// Update order status (shop owner only)
router.put('/:orderId/status', verifyToken, async (req, res) => {
    try {
        const { status } = req.body;
        const orderRef = db.collection('orders').doc(req.params.orderId);
        const orderDoc = await orderRef.get();

        if (!orderDoc.exists) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const orderData = orderDoc.data();
        const shopDoc = await db.collection('shops').doc(orderData.shopId).get();

        if (!shopDoc.exists || shopDoc.data().ownerId !== req.user.uid) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        await orderRef.update({
            status,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        res.json({ message: 'Order status updated successfully' });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ error: 'Failed to update order status' });
    }
});

// Get user's order history
router.get('/user/history', verifyToken, async (req, res) => {
    try {
        const ordersSnapshot = await db.collection('orders')
            .where('userId', '==', req.user.uid)
            .orderBy('createdAt', 'desc')
            .get();

        const orders = [];
        ordersSnapshot.forEach(doc => {
            orders.push({ id: doc.id, ...doc.data() });
        });

        res.json(orders);
    } catch (error) {
        console.error('Error fetching order history:', error);
        res.status(500).json({ error: 'Failed to fetch order history' });
    }
});

// Get shop's orders (shop owner only)
router.get('/shop/:shopId', verifyToken, async (req, res) => {
    try {
        const shopDoc = await db.collection('shops').doc(req.params.shopId).get();
        if (!shopDoc.exists || shopDoc.data().ownerId !== req.user.uid) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const ordersSnapshot = await db.collection('orders')
            .where('shopId', '==', req.params.shopId)
            .orderBy('createdAt', 'desc')
            .get();

        const orders = [];
        ordersSnapshot.forEach(doc => {
            orders.push({ id: doc.id, ...doc.data() });
        });

        res.json(orders);
    } catch (error) {
        console.error('Error fetching shop orders:', error);
        res.status(500).json({ error: 'Failed to fetch shop orders' });
    }
});

module.exports = router; 