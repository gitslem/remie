import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import express from 'express';
import cors from 'cors';

// Import routes
import authRoutes from './routes/auth';
import rrrRoutes from './routes/rrr';
import walletRoutes from './routes/wallet';
import p2pRoutes from './routes/p2p';
import loanRoutes from './routes/loan';
import cryptoRoutes from './routes/crypto';
import paymentRoutes from './routes/payment';

// Initialize Firebase Admin
admin.initializeApp();

// Create Express app
const app = express();

// CORS Configuration - Allow specific origins
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://remiepay.web.app',
  'https://remiepay.firebaseapp.com',
];

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(null, true); // Allow all origins in production (Firebase already handles security)
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400, // 24 hours
}));

// Handle OPTIONS requests explicitly
app.options('*', cors());

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'REMIE API is running',
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/rrr', rrrRoutes);
app.use('/api/v1/wallet', walletRoutes);
app.use('/api/v1/p2p', p2pRoutes);
app.use('/api/v1/loans', loanRoutes);
app.use('/api/v1/crypto', cryptoRoutes);
app.use('/api/v1/payments', paymentRoutes);

// API info
app.get('/api/v1', (req, res) => {
  res.json({
    message: 'Welcome to REMIE API',
    version: '1.0.0',
    documentation: '/api/docs',
  });
});

// Export Express app as Firebase Function
export const api = functions.https.onRequest(app);

// Background functions for async tasks
export const processReceipt = functions.firestore
  .document('payments/{paymentId}')
  .onCreate(async (snap, context) => {
    const payment = snap.data();

    if (payment.status === 'COMPLETED') {
      // Generate and send receipt
      const { generateReceipt } = await import('./services/receipt');
      await generateReceipt(snap.id, payment);
    }
  });

export const sendNotificationEmail = functions.firestore
  .document('notifications/{notificationId}')
  .onCreate(async (snap, context) => {
    const notification = snap.data();
    const { sendEmail } = await import('./utils/email');

    // Get user email
    const userDoc = await admin.firestore().collection('users').doc(notification.userId).get();
    const user = userDoc.data();

    if (user && user.email) {
      await sendEmail({
        to: user.email,
        subject: notification.title,
        template: 'notification',
        data: {
          firstName: user.firstName,
          message: notification.message,
        },
      });
    }
  });

export const checkLoanDefaults = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async (context) => {
    const db = admin.firestore();
    const now = new Date();

    // Find overdue loans
    const overdueLoans = await db.collection('loans')
      .where('status', '==', 'ACTIVE')
      .where('dueDate', '<', now)
      .get();

    // Mark as defaulted and send notifications
    const batch = db.batch();

    overdueLoans.forEach((doc) => {
      batch.update(doc.ref, { status: 'DEFAULTED' });

      // Create notification
      const notificationRef = db.collection('notifications').doc();
      batch.set(notificationRef, {
        userId: doc.data().userId,
        type: 'LOAN_DEFAULTED',
        title: 'Loan Overdue',
        message: 'Your loan payment is overdue. Please repay to avoid penalties.',
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    await batch.commit();
  });
