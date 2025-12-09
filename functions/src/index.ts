import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import express from 'express';
import cors from 'cors';

// Initialize Firebase Admin FIRST (before importing routes)
admin.initializeApp();

// Runtime options for Cloud Functions
const runtimeOpts: functions.RuntimeOptions = {
  timeoutSeconds: 540,
  memory: '512MB',
  maxInstances: 100,
};

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

// CORS Configuration - Comprehensive setup for Cloud Functions
const corsOptions = {
  origin: true, // Allows all origins (Firebase Hosting will be whitelisted)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
  ],
  credentials: true,
  optionsSuccessStatus: 200,
  preflightContinue: false,
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Explicitly handle OPTIONS requests for all routes
app.options('*', cors(corsOptions));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create API router to mount all routes under /api
const apiRouter = express.Router();

// Health check
apiRouter.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'REMIE API is running',
    timestamp: new Date().toISOString(),
  });
});

// API routes
apiRouter.use('/auth', authRoutes);
apiRouter.use('/rrr', rrrRoutes);
apiRouter.use('/wallet', walletRoutes);
apiRouter.use('/p2p', p2pRoutes);
apiRouter.use('/loans', loanRoutes);
apiRouter.use('/crypto', cryptoRoutes);
apiRouter.use('/payments', paymentRoutes);

// API info
apiRouter.get('/', (req, res) => {
  res.json({
    message: 'Welcome to REMIE API',
    version: '1.0.0',
    documentation: '/docs',
  });
});

// Mount API router under /api prefix
app.use('/api', apiRouter);

// Export Express app as Firebase Function with runtime options
export const api = functions
  .runWith(runtimeOpts)
  .https.onRequest(app);

// Background functions for async tasks
export const processReceipt = functions
  .runWith({ ...runtimeOpts, timeoutSeconds: 60 })
  .firestore
  .document('payments/{paymentId}')
  .onCreate(async (snap, context) => {
    const payment = snap.data();

    if (payment.status === 'COMPLETED') {
      // Generate and send receipt
      const { generateReceipt } = await import('./services/receipt');
      await generateReceipt(snap.id, payment);
    }
  });

export const sendNotificationEmail = functions
  .runWith({ ...runtimeOpts, timeoutSeconds: 60 })
  .firestore
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

export const checkLoanDefaults = functions
  .runWith({ ...runtimeOpts, timeoutSeconds: 300 })
  .pubsub
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
