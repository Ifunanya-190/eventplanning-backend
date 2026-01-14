const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const prisma = new PrismaClient();

// Middleware
app.use(cors({
  origin: [
    'https://comforting-maamoul-e72b49.netlify.app',
    'https://roaring-malabi-c1d6b3.netlify.app', 
    'http://localhost:5173', 
    'http://localhost:5000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

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
    console.error('Registration error:', error.message);
    
    // Handle duplicate email error
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Simple Login Route  
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
    console.error('Login error:', error.message);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Test database connection
const checkMongoDB = async () => {
  try {
    await prisma.$connect();
    await prisma.event.count();
    return true;
  } catch (error) {
    return false;
  }
};

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Event Planning API is working!' });
});

app.get('/test-db', async (req, res) => {
  const isConnected = await checkMongoDB();
  if (isConnected) {
    const eventCount = await prisma.event.count();
    res.json({ message: 'MongoDB connected', eventCount });
  } else {
    res.status(500).json({ error: 'MongoDB not connected - check IP whitelist' });
  }
});

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
    res.status(500).json({ error: 'Failed to save event - MongoDB not connected' });
  }
});

app.delete('/api/events/:id', async (req, res) => {
  try {
    await prisma.event.delete({ where: { id: req.params.id } });
    res.json({ message: 'Event deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Update event route
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
    
    console.log('✅ Event updated:', updatedEvent.id);
    res.json(updatedEvent);
  } catch (error) {
    console.error('❌ Error updating event:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Start server
const startServer = async () => {
  const isConnected = await checkMongoDB();
  
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    if (isConnected) {
      console.log('MongoDB connected');
    } else {
      console.log('MongoDB not connected - need to whitelist IP');
    }
  });
};

startServer();

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});