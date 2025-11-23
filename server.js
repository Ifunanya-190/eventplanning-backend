const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const prisma = new PrismaClient();

// Middleware
app.use(cors());
app.use(express.json());

// TEST ROUTES - These MUST work first
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is working!',
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req, res) => {
  res.json({ 
    message: 'Event Planning API is running!',
    endpoints: ['/health', '/test-db', '/api/register', '/api/login']
  });
});

// Test database connection
app.get('/test-db', async (req, res) => {
  try {
    await prisma.$connect();
    const userCount = await prisma.user.count();
    const eventCount = await prisma.event.count();
    res.json({ 
      message: 'MongoDB connected successfully!',
      userCount,
      eventCount
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'MongoDB connection failed',
      details: error.message 
    });
  }
});

// User registration
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Hash password
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword
      }
    });

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
});

// User login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Check password
    const bcrypt = require('bcryptjs');
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Events routes
app.get('/api/events', async (req, res) => {
  try {
    const events = await prisma.event.findMany({ 
      orderBy: { start: 'asc' } 
    });
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

app.post('/api/events', async (req, res) => {
  try {
    const { title, description, start, end, allDay } = req.body;
    
    if (!title || !start || !end) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const newEvent = await prisma.event.create({
      data: { 
        title, 
        description: description || '', 
        start: new Date(start), 
        end: new Date(end), 
        allDay: allDay || false 
      },
    });
    
    res.status(201).json(newEvent);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create event' });
  }
});

app.put('/api/events/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, start, end, allDay } = req.body;
    
    if (!title || !start || !end) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: {
        title,
        description: description || '',
        start: new Date(start),
        end: new Date(end),
        allDay: allDay || false,
      },
    });
    
    res.json(updatedEvent);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update event' });
  }
});

app.delete('/api/events/:id', async (req, res) => {
  try {
    await prisma.event.delete({ 
      where: { id: req.params.id } 
    });
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

// Catch-all for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    requestedPath: req.originalUrl,
    availableRoutes: ['/', '/health', '/test-db', '/api/register', '/api/login', '/api/events']
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Health check: https://dynamic-encouragement.up.railway.app/health`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});