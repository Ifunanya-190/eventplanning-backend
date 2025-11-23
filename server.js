const express = require('express');
const app = express();
const PORT = process.env.PORT || 5000;

// Basic route that CANNOT fail
app.get('*', (req, res) => {
  res.json({ 
    message: 'IT WORKS!', 
    path: req.path,
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
});

console.log('🚀 Starting simplest possible server...');