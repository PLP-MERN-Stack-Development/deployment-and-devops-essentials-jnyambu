// backend/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 10000;

// Enhanced CORS Configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      process.env.FRONTEND_URL,
      'https://your-frontend.onrender.com'
    ].filter(Boolean);

    // Allow requests with no origin (Postman, curl, mobile)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log(`⚠️  Blocked by CORS: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Request logging middleware (development only)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
    next();
  });
}

// MongoDB Connection with retry logic
// IMPORTANT: only attempt to connect when MONGODB_URI is provided.
const connectDB = async (retries = 5) => {
  const mongoURI = process.env.MONGODB_URI;
  if (!mongoURI) {
    console.log('⚪ MONGODB_URI not set — skipping MongoDB connection (dev mode)');
    return;
  }

  try {
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    });
    console.log('✅ MongoDB Connected Successfully');
    console.log(`📦 Database: ${mongoose.connection.name || 'n/a'}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message || error);
    if (retries > 0) {
      console.log(`🔄 Retrying connection... (${retries} attempts left)`);
      setTimeout(() => connectDB(retries - 1), 5000);
    } else {
      console.log('⚠️  Out of retries — server will continue without database');
    }
  }
};

// Mongoose events
mongoose.connection.on('connected', () => console.log('🟢 Mongoose connected'));
mongoose.connection.on('error', (err) => console.error('🔴 Mongoose connection error:', err));
mongoose.connection.on('disconnected', () => console.log('🟡 Mongoose disconnected'));

// Connect to DB (only if MONGODB_URI present)
connectDB();

// Health Check Endpoint
app.get('/health', (req, res) => {
  const dbConnected = mongoose.connection.readyState === 1;
  const healthCheck = {
    status: dbConnected ? 'OK' : 'DEGRADED',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    database: {
      status: dbConnected ? 'connected' : 'disconnected',
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host || null,
      name: mongoose.connection.name || null
    },
    memory: {
      rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)} MB`,
      heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`
    },
    version: process.version
  };

  return res.status(200).json(healthCheck);
});

// Root Route - Serve index.html or JSON
app.get('/', (req, res) => {
  const indexPath = path.join(__dirname, 'public', 'index.html');
  const fs = require('fs');
  
  // Check if index.html exists, otherwise send JSON
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.json({
      message: 'Welcome to MERN API',
      version: '1.0.0',
      endpoints: { 
        health: '/health', 
        test: '/api/test', 
        items: '/api/items' 
      },
      note: 'Create backend/public/index.html for a landing page'
    });
  }
});

// Test API Route
app.get('/api/test', (req, res) => {
  res.json({
    message: 'API is working!',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Get Items
app.get('/api/items', async (req, res) => {
  const items = [
    { id: 1, name: 'Item 1', createdAt: new Date() },
    { id: 2, name: 'Item 2', createdAt: new Date() }
  ];
  res.json({ success: true, count: items.length, items });
});

// Create Item
app.post('/api/items', (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ success: false, error: 'Name is required' });
  const newItem = { id: Date.now(), name, createdAt: new Date() };
  res.status(201).json({ success: true, item: newItem });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('💥 Error:', err.stack || err);
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ success: false, error: 'CORS policy violation', message: 'Origin not allowed' });
  }
  if (err.name === 'MongoError' || err.name === 'MongooseError') {
    return res.status(503).json({ success: false, error: 'Database error', message: process.env.NODE_ENV === 'production' ? 'Database operation failed' : err.message });
  }
  if (err.name === 'ValidationError') {
    return res.status(400).json({ success: false, error: 'Validation error', details: err.errors });
  }
  res.status(err.status || 500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message
  });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('='.repeat(50));
  console.log(`🚀 Server started successfully!`);
  console.log(`📍 Port: ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Local: http://localhost:${PORT}`);
  console.log(`🔗 Network: http://0.0.0.0:${PORT}`);
  console.log(`💚 Health Check: http://localhost:${PORT}/health`);
  console.log('='.repeat(50));
});

// Graceful shutdown handlers
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('🛑 MongoDB connection closed through app termination');
  } catch (e) {
    console.error('Error closing MongoDB connection on SIGINT', e);
  }
  process.exit(0);
});

process.on('unhandledRejection', (err) => {
  console.error('💥 UNHANDLED REJECTION! Shutting down...', err);
  server.close(() => process.exit(1));
});

process.on('uncaughtException', (err) => {
  console.error('💥 UNCAUGHT EXCEPTION! Shutting down...', err);
  process.exit(1);
});

module.exports = app;