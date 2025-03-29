/*
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');

router.get('/profile', verifyToken, (req, res) => {
  res.json({ 
    uid: req.user.uid,
    email: req.user.email
  });
});

router.post('/logout', verifyToken, (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

module.exports = router;
*/