import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import logger from './utils/logger';

// Routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import paymentRoutes from './routes/payment.routes';
import rrrRoutes from './routes/rrr.routes';
import walletRoutes from './routes/wallet.routes';
import loanRoutes from './routes/loan.routes';
import p2pRoutes from './routes/p2p.routes';
import cryptoRoutes from './routes/crypto.routes';
import receiptRoutes from './routes/receipt.routes';
import notificationRoutes from './routes/notification.routes';
import webhookRoutes from './routes/webhook.routes';
import remittanceRoutes from './routes/remittance.routes';
import adminRoutes from './routes/admin.routes';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

// ============================================
// MIDDLEWARE
// ============================================

// Security
app.use(helmet());

// CORS - Allow multiple origins
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://remiepay.web.app',
  'https://remiepay.firebaseapp.com',
  process.env.FRONTEND_URL,
].filter(Boolean); // Remove undefined values

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      logger.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400, // 24 hours
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: { write: (message) => logger.info(message.trim()) },
  }));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// ============================================
// ROUTES
// ============================================

// Health check
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'REMIE API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/rrr', rrrRoutes);
app.use('/api/v1/wallet', walletRoutes);
app.use('/api/v1/loans', loanRoutes);
app.use('/api/v1/p2p', p2pRoutes);
app.use('/api/v1/crypto', cryptoRoutes);
app.use('/api/v1/receipts', receiptRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/webhooks', webhookRoutes);
app.use('/api/v1/remittance', remittanceRoutes);
app.use('/api/v1/admin', adminRoutes);

// API documentation
app.get('/api/v1', (_req, res) => {
  res.json({
    message: 'Welcome to REMIE API',
    version: '1.0.0',
    documentation: '/api/docs',
    endpoints: {
      auth: '/api/v1/auth',
      users: '/api/v1/users',
      payments: '/api/v1/payments',
      rrr: '/api/v1/rrr',
      wallet: '/api/v1/wallet',
      loans: '/api/v1/loans',
      p2p: '/api/v1/p2p',
      crypto: '/api/v1/crypto',
      receipts: '/api/v1/receipts',
      notifications: '/api/v1/notifications',
      webhooks: '/api/v1/webhooks',
      remittance: '/api/v1/remittance',
      admin: '/api/v1/admin',
    },
  });
});

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// ============================================
// SERVER
// ============================================

const server = app.listen(PORT, () => {
  logger.info(`🚀 REMIE API server running on port ${PORT}`);
  logger.info(`📝 Environment: ${process.env.NODE_ENV}`);
  logger.info(`🔗 API URL: ${process.env.API_URL || `http://localhost:${PORT}`}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

export default app;
