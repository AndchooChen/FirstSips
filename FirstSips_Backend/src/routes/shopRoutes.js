const express = require('express');
const router = express.Router();
const { admin } = require('../config/firebase-config');
const { verifyToken } = require('../middlewares/authMiddleware');

const db = admin.firestore();

// Create a new shop
router.post('/', verifyToken, async (req, res) => {
    try {
        const { shopName, description, location, profileImage } = req.body;
        const shopData = {
            shopName,
            description,
            location,
            profileImage,
            ownerId: req.user.uid,
            isOpen: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        const shopRef = await db.collection('shops').add(shopData);
        
        // Update user document to mark as shop owner
        await db.collection('users').doc(req.user.uid).update({
            isShopOwner: true,
            shopId: shopRef.id
        });

        res.status(201).json({ id: shopRef.id, ...shopData });
    } catch (error) {
        console.error('Error creating shop:', error);
        res.status(500).json({ error: 'Failed to create shop' });
    }
});

// Get shop details
router.get('/:shopId', async (req, res) => {
    try {
        const shopDoc = await db.collection('shops').doc(req.params.shopId).get();
        if (!shopDoc.exists) {
            return res.status(404).json({ error: 'Shop not found' });
        }
        res.json({ id: shopDoc.id, ...shopDoc.data() });
    } catch (error) {
        console.error('Error fetching shop:', error);
        res.status(500).json({ error: 'Failed to fetch shop' });
    }
});

// Update shop details
router.put('/:shopId', verifyToken, async (req, res) => {
    try {
        const shopRef = db.collection('shops').doc(req.params.shopId);
        const shopDoc = await shopRef.get();

        if (!shopDoc.exists) {
            return res.status(404).json({ error: 'Shop not found' });
        }

        if (shopDoc.data().ownerId !== req.user.uid) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const updateData = {
            ...req.body,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        delete updateData.ownerId; // Prevent owner change

        await shopRef.update(updateData);
        res.json({ message: 'Shop updated successfully' });
    } catch (error) {
        console.error('Error updating shop:', error);
        res.status(500).json({ error: 'Failed to update shop' });
    }
});

// Toggle shop open/closed status
router.post('/:shopId/toggle-status', verifyToken, async (req, res) => {
    try {
        const shopRef = db.collection('shops').doc(req.params.shopId);
        const shopDoc = await shopRef.get();

        if (!shopDoc.exists) {
            return res.status(404).json({ error: 'Shop not found' });
        }

        if (shopDoc.data().ownerId !== req.user.uid) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const newStatus = !shopDoc.data().isOpen;
        await shopRef.update({
            isOpen: newStatus,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        res.json({ isOpen: newStatus });
    } catch (error) {
        console.error('Error toggling shop status:', error);
        res.status(500).json({ error: 'Failed to toggle shop status' });
    }
});

// Get shop items
router.get('/:shopId/items', async (req, res) => {
    try {
        const itemsSnapshot = await db.collection('shops').doc(req.params.shopId)
            .collection('items').get();
        
        const items = [];
        itemsSnapshot.forEach(doc => {
            items.push({ id: doc.id, ...doc.data() });
        });

        res.json(items);
    } catch (error) {
        console.error('Error fetching shop items:', error);
        res.status(500).json({ error: 'Failed to fetch shop items' });
    }
});

// Add new item to shop
router.post('/:shopId/items', verifyToken, async (req, res) => {
    try {
        const shopRef = db.collection('shops').doc(req.params.shopId);
        const shopDoc = await shopRef.get();

        if (!shopDoc.exists) {
            return res.status(404).json({ error: 'Shop not found' });
        }

        if (shopDoc.data().ownerId !== req.user.uid) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const { name, description, price, category, quantity, images } = req.body;
        const itemData = {
            name,
            description,
            price,
            category,
            quantity,
            images,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        const itemRef = await shopRef.collection('items').add(itemData);
        res.status(201).json({ id: itemRef.id, ...itemData });
    } catch (error) {
        console.error('Error adding item:', error);
        res.status(500).json({ error: 'Failed to add item' });
    }
});

// Update shop item
router.put('/:shopId/items/:itemId', verifyToken, async (req, res) => {
    try {
        const shopRef = db.collection('shops').doc(req.params.shopId);
        const shopDoc = await shopRef.get();

        if (!shopDoc.exists) {
            return res.status(404).json({ error: 'Shop not found' });
        }

        if (shopDoc.data().ownerId !== req.user.uid) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const updateData = {
            ...req.body,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        await shopRef.collection('items').doc(req.params.itemId).update(updateData);
        res.json({ message: 'Item updated successfully' });
    } catch (error) {
        console.error('Error updating item:', error);
        res.status(500).json({ error: 'Failed to update item' });
    }
});

// Delete shop item
router.delete('/:shopId/items/:itemId', verifyToken, async (req, res) => {
    try {
        const shopRef = db.collection('shops').doc(req.params.shopId);
        const shopDoc = await shopRef.get();

        if (!shopDoc.exists) {
            return res.status(404).json({ error: 'Shop not found' });
        }

        if (shopDoc.data().ownerId !== req.user.uid) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        await shopRef.collection('items').doc(req.params.itemId).delete();
        res.json({ message: 'Item deleted successfully' });
    } catch (error) {
        console.error('Error deleting item:', error);
        res.status(500).json({ error: 'Failed to delete item' });
    }
});

module.exports = router; 