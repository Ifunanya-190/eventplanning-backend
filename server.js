const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Basic middleware first
app.use(cors());
app.use(express.json());

// SIMPLE TEST ROUTE - This MUST work
app.get('*', (req, res) => {
  console.log('📨 Request received:', req.method, req.url);
  
  if (req.path === '/health' || req.path === '/') {
    return res.json({ 
      status: 'OK', 
      message: 'Server is working!',
      path: req.path,
      timestamp: new Date().toISOString()
    });
  }
  
  if (req.path === '/test-db') {
    return res.json({ 
      message: 'Test route working - DB check disabled for now',
      path: req.path
    });
  }
  
  res.json({ 
    message: 'Catch-all route', 
    path: req.path,
    availableRoutes: ['/', '/health', '/test-db', '/api/*']
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`✅ Ready for requests at: https://dynamic-encouragement.up.railway.app`);
});

console.log('🔧 Server setup complete');