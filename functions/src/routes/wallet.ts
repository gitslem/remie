import { Router, Request, Response } from 'express';
import * as admin from 'firebase-admin';
import { authenticate } from './auth';

const router = Router();
const db = admin.firestore();

// Version 1.0.1 - Force redeploy with proper error handling
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

// Fund wallet - Initialize Paystack payment
router.post('/fund', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { uid, email } = (req as any).user;
    const { amount, callbackUrl } = req.body;

    if (!amount || amount <= 0 || amount > 500000) {
      res.status(400).json({
        status: 'error',
        message: 'Amount must be between 0 and 500,000',
      });
      return;
    }

    // Ensure wallet exists
    await ensureWalletExists(uid);

    // Generate unique reference
    const reference = `REMIE_${uid}_${Date.now()}`;

    // Create pending payment record
    await db.collection('payments').doc(reference).set({
      userId: uid,
      type: 'WALLET_FUNDING',
      amount,
      reference,
      status: 'PENDING',
      description: 'Wallet funding',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Initialize Paystack payment
    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackSecretKey) {
      throw new Error('Paystack not configured');
    }

    const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email || `${uid}@remiepay.com`,
        amount: amount * 100, // Convert to kobo
        reference,
        callback_url: callbackUrl || `${process.env.FRONTEND_URL}/dashboard/wallet?verify=${reference}`,
      }),
    });

    const paystackData = await paystackResponse.json();

    if (!paystackData.status) {
      throw new Error(paystackData.message || 'Payment initialization failed');
    }

    res.status(201).json({
      status: 'success',
      message: 'Payment initialized',
      data: {
        authorizationUrl: paystackData.data.authorization_url,
        accessCode: paystackData.data.access_code,
        reference: paystackData.data.reference,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
});

// Verify wallet funding
router.get('/verify/:reference', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { uid } = (req as any).user;
    const { reference } = req.params;

    // Verify with Paystack
    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackSecretKey) {
      throw new Error('Paystack not configured');
    }

    const paystackResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${paystackSecretKey}`,
        },
      }
    );

    const paystackData = await paystackResponse.json();

    if (!paystackData.status || paystackData.data.status !== 'success') {
      res.status(400).json({
        status: 'error',
        message: 'Payment verification failed',
      });
      return;
    }

    const amount = paystackData.data.amount / 100; // Convert from kobo to naira

    // Update wallet and payment record in a transaction
    await db.runTransaction(async (transaction) => {
      const walletRef = db.collection('wallets').doc(uid);
      const paymentRef = db.collection('payments').doc(reference);

      const paymentDoc = await transaction.get(paymentRef);

      if (!paymentDoc.exists) {
        throw new Error('Payment record not found');
      }

      const payment = paymentDoc.data();

      if (payment?.status === 'COMPLETED') {
        throw new Error('Payment already verified');
      }

      // Update wallet balance
      transaction.update(walletRef, {
        balance: admin.firestore.FieldValue.increment(amount),
        availableBalance: admin.firestore.FieldValue.increment(amount),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Update payment status
      transaction.update(paymentRef, {
        status: 'COMPLETED',
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    res.status(200).json({
      status: 'success',
      message: 'Payment verified and wallet funded',
      data: { amount, reference },
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

// Get Nigerian banks list
router.get('/banks', async (req: Request, res: Response): Promise<void> => {
  try {
    // Return list of major Nigerian banks
    const banks = [
      { name: 'Access Bank', code: '044', slug: 'access-bank' },
      { name: 'Citibank Nigeria', code: '023', slug: 'citibank-nigeria' },
      { name: 'Ecobank Nigeria', code: '050', slug: 'ecobank-nigeria' },
      { name: 'Fidelity Bank', code: '070', slug: 'fidelity-bank' },
      { name: 'First Bank of Nigeria', code: '011', slug: 'first-bank-of-nigeria' },
      { name: 'First City Monument Bank', code: '214', slug: 'first-city-monument-bank' },
      { name: 'Guaranty Trust Bank', code: '058', slug: 'guaranty-trust-bank' },
      { name: 'Heritage Banking Company Ltd.', code: '030', slug: 'heritage-bank' },
      { name: 'Keystone Bank', code: '082', slug: 'keystone-bank' },
      { name: 'Polaris Bank', code: '076', slug: 'polaris-bank' },
      { name: 'Providus Bank', code: '101', slug: 'providus-bank' },
      { name: 'Stanbic IBTC Bank', code: '221', slug: 'stanbic-ibtc-bank' },
      { name: 'Standard Chartered Bank', code: '068', slug: 'standard-chartered-bank' },
      { name: 'Sterling Bank', code: '232', slug: 'sterling-bank' },
      { name: 'Union Bank of Nigeria', code: '032', slug: 'union-bank-of-nigeria' },
      { name: 'United Bank For Africa', code: '033', slug: 'united-bank-for-africa' },
      { name: 'Unity Bank', code: '215', slug: 'unity-bank' },
      { name: 'Wema Bank', code: '035', slug: 'wema-bank' },
      { name: 'Zenith Bank', code: '057', slug: 'zenith-bank' },
    ];

    res.status(200).json({
      status: 'success',
      data: banks,
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
});

// Resolve bank account name
router.post('/resolve-account', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { accountNumber, bankCode } = req.body;

    if (!accountNumber || !bankCode) {
      res.status(400).json({
        status: 'error',
        message: 'Account number and bank code are required',
      });
      return;
    }

    // TODO: Integrate with Paystack to resolve account
    // For now, return mock data
    res.status(200).json({
      status: 'success',
      data: {
        accountNumber,
        accountName: 'Mock Account Name',
        bankCode,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
});

export default router;
