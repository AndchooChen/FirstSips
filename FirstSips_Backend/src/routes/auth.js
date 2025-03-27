const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');

// Test protected route
router.get('/protected', authenticate, (req, res) => {
    res.json({
        message: 'Protected route accessed successfully',
        user: req.user
    });
});

// Get user profile
router.get('/profile', authenticate, (req, res) => {
    res.json({
        uid: req.user.uid,
        email: req.user.email,
        emailVerified: req.user.email_verified
    });
});

module.exports = router;