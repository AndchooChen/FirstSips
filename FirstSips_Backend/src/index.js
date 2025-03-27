const express = require('express');
const cors = require('cors');
require('dotevn').config();
const { initializeFirebase } = require('.services/firebase');
const authRoutes = require('./routes/auth');

const app = express();
const port = process.env.PORT || 3000;

// Initialize Firebase
initializeFirebase();

// Middleware
app.use(cors());
app.use(express.json());

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