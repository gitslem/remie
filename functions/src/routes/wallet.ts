import { Router, Request, Response } from 'express';
import * as admin from 'firebase-admin';
import { authenticate } from './auth';

const router = Router();
const db = admin.firestore();

// Initialize wallet if it doesn't exist
const ensureWalletExists = async (userId: string) => {
  const walletRef = db.collection('wallets').doc(userId);
  const walletDoc = await walletRef.get();

  if (!walletDoc.exists) {
    await walletRef.set({
      userId,
      balance: 0,
      availableBalance: 0,
      currency: 'NGN',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  return walletRef;
};

// Get wallet balance
router.get('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { uid } = (req as any).user;

    // Ensure wallet exists
    await ensureWalletExists(uid);

    const walletDoc = await db.collection('wallets').doc(uid).get();

    res.status(200).json({
      status: 'success',
      data: walletDoc.data(),
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
});

// Fund wallet
router.post('/fund', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { uid } = (req as any).user;
    const { amount, paymentMethod, reference } = req.body;

    if (!amount || amount <= 0 || amount > 500000) {
      res.status(400).json({
        status: 'error',
        message: 'Amount must be between 0 and 500,000',
      });
      return;
    }

    if (!paymentMethod || !reference) {
      res.status(400).json({
        status: 'error',
        message: 'Payment method and reference are required',
      });
      return;
    }

    // Ensure wallet exists
    await ensureWalletExists(uid);

    // Use transaction for atomic operation
    const result = await db.runTransaction(async (transaction) => {
      const walletRef = db.collection('wallets').doc(uid);
      const walletDoc = await transaction.get(walletRef);

      if (!walletDoc.exists) {
        throw new Error('Wallet not found');
      }

      // Update wallet balance
      transaction.update(walletRef, {
        balance: admin.firestore.FieldValue.increment(amount),
        availableBalance: admin.firestore.FieldValue.increment(amount),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Create payment record
      const paymentRef = db.collection('payments').doc();
      transaction.set(paymentRef, {
        userId: uid,
        type: 'WALLET_FUNDING',
        amount,
        paymentMethod,
        reference,
        status: 'COMPLETED',
        description: 'Wallet funding',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return { paymentId: paymentRef.id, reference };
    });

    res.status(201).json({
      status: 'success',
      message: 'Wallet funded successfully',
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
});

// Withdraw from wallet
router.post('/withdraw', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { uid } = (req as any).user;
    const { amount, bankDetails } = req.body;

    if (!amount || amount <= 0 || amount > 500000) {
      res.status(400).json({
        status: 'error',
        message: 'Amount must be between 0 and 500,000',
      });
      return;
    }

    if (!bankDetails || !bankDetails.accountNumber || !bankDetails.bankCode) {
      res.status(400).json({
        status: 'error',
        message: 'Bank account details are required',
      });
      return;
    }

    // Use transaction for atomic operation
    const result = await db.runTransaction(async (transaction) => {
      const walletRef = db.collection('wallets').doc(uid);
      const walletDoc = await transaction.get(walletRef);

      if (!walletDoc.exists) {
        throw new Error('Wallet not found');
      }

      const currentBalance = walletDoc.data()?.availableBalance || 0;

      if (currentBalance < amount) {
        throw new Error('Insufficient balance');
      }

      // Deduct from wallet
      transaction.update(walletRef, {
        balance: admin.firestore.FieldValue.increment(-amount),
        availableBalance: admin.firestore.FieldValue.increment(-amount),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Create withdrawal record
      const withdrawalRef = db.collection('payments').doc();
      const reference = `WD-${Date.now()}`;

      transaction.set(withdrawalRef, {
        userId: uid,
        type: 'WALLET_WITHDRAWAL',
        amount,
        bankDetails,
        reference,
        status: 'PENDING',
        description: 'Wallet withdrawal',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return { withdrawalId: withdrawalRef.id, reference };
    });

    res.status(201).json({
      status: 'success',
      message: 'Withdrawal request submitted successfully',
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
});

// Get wallet transactions
router.get('/transactions', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { uid } = (req as any).user;
    const limit = parseInt(req.query.limit as string) || 20;
    const type = req.query.type as string;

    let query: admin.firestore.Query = db.collection('payments')
      .where('userId', '==', uid)
      .orderBy('createdAt', 'desc')
      .limit(limit);

    // Filter by transaction type if specified
    if (type) {
      query = query.where('type', '==', type);
    }

    const paymentsSnapshot = await query.get();

    const payments = paymentsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json({
      status: 'success',
      data: { transactions: payments },
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
});

export default router;
