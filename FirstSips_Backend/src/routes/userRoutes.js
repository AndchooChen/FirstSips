const express = require('express');
const router = express.Router();
const { admin } = require('../config/firebase-config');
const { verifyToken } = require('../middlewares/authMiddleware');

const db = admin.firestore();

// Get user profile
router.get('/profile', verifyToken, async (req, res) => {
    try {
        const userDoc = await db.collection('users').doc(req.user.uid).get();
        if (!userDoc.exists) {
            return res.status(404).json({ error: 'User not found' });
        }
        const userData = userDoc.data();
        res.json(userData);
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ error: 'Failed to fetch user profile' });
    }
});

// Update user profile
router.put('/profile', verifyToken, async (req, res) => {
    try {
        const { firstName, lastName, phoneNumber, birthday } = req.body;
        await db.collection('users').doc(req.user.uid).update({
            firstName,
            lastName,
            phoneNumber,
            birthday,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// Check if user is shop owner
router.get('/is-shop-owner', verifyToken, async (req, res) => {
    try {
        const userDoc = await db.collection('users').doc(req.user.uid).get();
        if (!userDoc.exists) {
            return res.status(404).json({ error: 'User not found' });
        }
        const userData = userDoc.data();
        res.json({ isShopOwner: userData.isShopOwner || false });
    } catch (error) {
        console.error('Error checking shop owner status:', error);
        res.status(500).json({ error: 'Failed to check shop owner status' });
    }
});

module.exports = router; 