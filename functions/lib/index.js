"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkLoanDefaults = exports.sendNotificationEmail = exports.processReceipt = exports.api = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
// Import routes
const auth_1 = __importDefault(require("./routes/auth"));
const rrr_1 = __importDefault(require("./routes/rrr"));
const wallet_1 = __importDefault(require("./routes/wallet"));
const p2p_1 = __importDefault(require("./routes/p2p"));
const loan_1 = __importDefault(require("./routes/loan"));
const crypto_1 = __importDefault(require("./routes/crypto"));
const payment_1 = __importDefault(require("./routes/payment"));
// Initialize Firebase Admin
admin.initializeApp();
// Create Express app
const app = (0, express_1.default)();
// Middleware
app.use((0, cors_1.default)({ origin: true }));
app.use(express_1.default.json());
// Health check
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'REMIE API is running',
        timestamp: new Date().toISOString(),
    });
});
// API routes
app.use('/api/v1/auth', auth_1.default);
app.use('/api/v1/rrr', rrr_1.default);
app.use('/api/v1/wallet', wallet_1.default);
app.use('/api/v1/p2p', p2p_1.default);
app.use('/api/v1/loans', loan_1.default);
app.use('/api/v1/crypto', crypto_1.default);
app.use('/api/v1/payments', payment_1.default);
// API info
app.get('/api/v1', (req, res) => {
    res.json({
        message: 'Welcome to REMIE API',
        version: '1.0.0',
        documentation: '/api/docs',
    });
});
// Export Express app as Firebase Function
exports.api = functions.https.onRequest(app);
// Background functions for async tasks
exports.processReceipt = functions.firestore
    .document('payments/{paymentId}')
    .onCreate(async (snap, context) => {
    const payment = snap.data();
    if (payment.status === 'COMPLETED') {
        // Generate and send receipt
        const { generateReceipt } = await Promise.resolve().then(() => __importStar(require('./services/receipt')));
        await generateReceipt(snap.id, payment);
    }
});
exports.sendNotificationEmail = functions.firestore
    .document('notifications/{notificationId}')
    .onCreate(async (snap, context) => {
    const notification = snap.data();
    const { sendEmail } = await Promise.resolve().then(() => __importStar(require('./utils/email')));
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
exports.checkLoanDefaults = functions.pubsub
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
//# sourceMappingURL=index.js.map