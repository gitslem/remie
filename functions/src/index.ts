import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import express from 'express';
import cors from 'cors';

// Initialize Firebase Admin FIRST (before importing routes)
admin.initializeApp();

// Import routes (these files use admin.firestore() at module level)
import authRoutes from './routes/auth';
import rrrRoutes from './routes/rrr';
import walletRoutes from './routes/wallet';
import p2pRoutes from './routes/p2p';
import loanRoutes from './routes/loan';
import cryptoRoutes from './routes/crypto';
import paymentRoutes from './routes/payment';

// Create Express app
const app = express();

// CORS Configuration - Firebase Cloud Functions recommended pattern
// This allows all origins which is safe because Firebase handles authentication
app.use(cors({ origin: true }));

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
app.use('/auth', authRoutes);
app.use('/rrr', rrrRoutes);
app.use('/wallet', walletRoutes);
app.use('/p2p', p2pRoutes);
app.use('/loans', loanRoutes);
app.use('/crypto', cryptoRoutes);
app.use('/payments', paymentRoutes);

// API info
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to REMIE API',
    version: '1.0.0',
    documentation: '/docs',
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
