const express = require('express');
const cors = require('cors');
require('dotenv').config();
const paymentRoutes = require('./routes/paymentRoutes');
const accountRoutes = require('./routes/accountRoutes'); // Import accountRoutes

const app = express();
const PORT = process.env.PORT || 5000;
const DOMAIN = process.env.DOMAIN || `http://192.168.50.84:${PORT}`;

// Middleware
app.use(cors());
app.use(express.json());

// Use accountRoutes for Stripe account-related operations
app.use('/accounts', accountRoutes);

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
