const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const attendanceRoutes = require('./routes/attendance');
const leaveRoutes = require('./routes/leave');
const regularizationRoutes = require('./routes/regularization');
const managerRoutes = require('./routes/manager');
const hrRoutes = require('./routes/hr');
const adminRoutes = require('./routes/admin');

// Import attendance controller for heartbeat timeout check
const attendanceController = require('./controllers/attendanceController');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware - CORS configuration
// Allow frontend URL from environment variable or default to localhost
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
  : [
      'http://localhost:5173',  // Vite dev server (frontend)
      'http://localhost:3000',   // Alternative frontend port
      'http://127.0.0.1:5173',
      'http://127.0.0.1:3000',
      'http://192.168.1.223:5173', // Mobile access (update with your IP)
    ];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leave', leaveRoutes);
app.use('/api/regularization', regularizationRoutes);
app.use('/api/manager', managerRoutes);
app.use('/api/hr', hrRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
  });
});

// Start server - listen on all network interfaces for mobile access
// In production (Railway/Render), they handle the host binding
const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : '0.0.0.0';
app.listen(PORT, host, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  if (process.env.NODE_ENV !== 'production') {
    console.log(`\n📱 Mobile Access:`);
    console.log(`   Local:   http://localhost:${PORT}`);
    console.log(`   Network: http://YOUR_LOCAL_IP:${PORT}`);
    console.log(`   (Replace YOUR_LOCAL_IP with your computer's IP address)\n`);
  } else {
    console.log(`\n✅ Production server running\n`);
  }
  
  // Schedule heartbeat timeout check every 5 minutes
  setInterval(async () => {
    try {
      const count = await attendanceController.checkHeartbeatTimeouts();
      if (count > 0) {
        console.log(`[Heartbeat Check] Auto punched out ${count} employee(s) due to heartbeat timeout`);
      }
    } catch (error) {
      console.error('[Heartbeat Check] Error:', error);
    }
  }, 5 * 60 * 1000); // Every 5 minutes
  
  console.log('Heartbeat timeout checker started (runs every 5 minutes)');
});

module.exports = app;

