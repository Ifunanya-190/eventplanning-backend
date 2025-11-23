const express = require('express');
const app = express();
const PORT = process.env.PORT || 5000;

// Basic middleware
app.use(express.json());

// Specific routes first
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Health check working!',
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req, res) => {
  res.json({ 
    message: 'Server is running!',
    availableRoutes: ['/health', '/test']
  });
});

app.get('/test', (req, res) => {
  res.json({ 
    message: 'Test route working!',
    path: req.path
  });
});

// Catch-all route (must be last)
app.use((req, res) => {
  res.json({ 
    message: 'Route not found, but server is working!',
    requestedPath: req.path,
    availableRoutes: ['/', '/health', '/test']
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
});

console.log('🚀 Starting server...');