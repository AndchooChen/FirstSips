const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Initialize Supabase (this will validate the connection)
require('./config/supabase-config');

// Import routes
const paymentRoutes = require('./routes/paymentRoutes');
const stripeRoutes = require('./routes/stripeRoutes');

const app = express();
const PORT = process.env.PORT || 5000;
const DOMAIN = process.env.DOMAIN || `http://192.168.50.84:${PORT}`;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '../public')));

// Use accountRoutes for Stripe account-related operations
app.use('/stripe', stripeRoutes);

// Use paymentRoutes for payment-related operations
app.use('/payments', (req, _, next) => {
  req.domain = DOMAIN;
  next();
}, paymentRoutes);

// Health check route
app.get('/health', (_, res) => {
  res.json({ status: 'healthy' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on ${DOMAIN}`);
});