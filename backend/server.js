const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');

const connectDB = require('./config/database');
const config = require('./config/config');
const { handleConnection } = require('./socket/socketHandler');
const { globalErrorHandler, notFound } = require('./middleware/errorHandler');

// Route imports
const busRoutes = require('./routes/buses');
const routeRoutes = require('./routes/routes');
const authRoutes = require('./routes/auth');

// Initialize express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = socketIo(server, {
  cors: {
    origin: config.SOCKET_CORS_ORIGIN,
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Store io instance in app for access in controllers
app.set('io', io);

// Connect to database
connectDB();

// Security middleware
app.use(helmet());

// CORS middleware
app.use(cors({
  origin: config.CORS_ORIGIN,
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX_REQUESTS,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  }
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging middleware
if (config.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV
  });
});

// API routes
app.use('/api/buses', busRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/auth', authRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'RTC Bus Tracking API',
    version: '1.0.0',
    documentation: '/api/docs',
    endpoints: {
      buses: '/api/buses',
      routes: '/api/routes',
      auth: '/api/auth'
    }
  });
});

// Socket.io connection handling
handleConnection(io);

// 404 handler
app.use(notFound);

// Global error handler
app.use(globalErrorHandler);

// Start server
const PORT = config.PORT;
server.listen(PORT, () => {
  console.log(`🚌 RTC Bus Tracking Server running on port ${PORT}`);
  console.log(`📍 Environment: ${config.NODE_ENV}`);
  console.log(`🔗 Socket.io enabled for real-time updates`);
  
  if (config.NODE_ENV === 'development') {
    console.log(`🌐 API Base URL: http://localhost:${PORT}`);
    console.log(`📚 Health Check: http://localhost:${PORT}/health`);
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log('Unhandled Promise Rejection:', err.message);
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.log('Uncaught Exception:', err.message);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
  });
});

module.exports = app;
