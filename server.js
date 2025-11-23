const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

console.log('🚀 Server starting on Railway...');

const app = express();
const PORT = process.env.PORT || 5000;
const prisma = new PrismaClient();

// SIMPLIFIED CORS for Railway
app.use(cors());
app.use(express.json());

// Health check - THIS MUST WORK
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'Event Planning API',
    timestamp: new Date().toISOString()
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Event Planning API is working!',
    endpoints: ['/health', '/test-db', '/api/events']
  });
});

// Test database
app.get('/test-db', async (req, res) => {
  try {
    await prisma.$connect();
    const eventCount = await prisma.event.count();
    res.json({ 
      message: 'MongoDB connected', 
      eventCount,
      database: 'eventplanning'
    });
  } catch (error) {
    res.status(500).json({ error: 'MongoDB connection failed: ' + error.message });
  }
});

// YOUR EXISTING ROUTES (register, login, events, etc.)
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword }
    });

    res.status(201).json({
      message: 'User created successfully',
      user: { id: user.id, name: user.name, email: user.email }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const bcrypt = require('bcryptjs');
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    res.json({
      message: 'Login successful',
      user: { id: user.id, name: user.name, email: user.email }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Events routes
app.get('/api/events', async (req, res) => {
  try {
    const events = await prisma.event.findMany({ orderBy: { start: 'asc' } });
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/events', async (req, res) => {
  try {
    const { title, description, start, end, allDay } = req.body;
    if (!title || !start || !end) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const newEvent = await prisma.event.create({
      data: { title, description: description || '', start: new Date(start), end: new Date(end), allDay: allDay || false },
    });
    
    res.status(201).json(newEvent);
  } catch (error) {
    res.status(500).json({ error: 'Failed to save event' });
  }
});

// Start server - CRITICAL FOR RAILWAY
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🎉 Server running on port ${PORT}`);
  console.log(`📍 Local: http://localhost:${PORT}`);
  console.log(`🌐 Railway: https://dynamic-encouragement.up.railway.app`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});