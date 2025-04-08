const express = require('express');
const cors = require('cors');
<<<<<<< HEAD
require('dotevn').config();
const { initializeFirebase } = require('.services/firebase');
const authRoutes = require('./routes/auth');

const app = express();
const port = process.env.PORT || 3000;

// Initialize Firebase
initializeFirebase();
=======
require('dotenv').config();
require('./config/firebase-config'); // Initialize Firebase Admin
const paymentRoutes = require('./routes/paymentRoutes');
const stripeRoutes = require('./routes/stripeRoutes');

const app = express();
const PORT = process.env.PORT || 5000;
const DOMAIN = process.env.DOMAIN || `http://192.168.50.84:${PORT}`;
>>>>>>> LoginRedesign

// Middleware
app.use(cors());
app.use(express.json());

<<<<<<< HEAD
// Routes
app.use('/api/auth', authRoutes);

// Basic health check route
app.get('health', (req, res) => {
  res.json({ status: 'healthy' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(port, () =>  {
  console.log('Server running on port ${port}');
});
=======
// Use accountRoutes for Stripe account-related operations
app.use('/stripe', stripeRoutes);

// Use paymentRoutes for payment-related operations
app.use('/payments', (req, res, next) => {
  req.domain = DOMAIN;
  next();
}, paymentRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on ${DOMAIN}`);
});
>>>>>>> LoginRedesign
