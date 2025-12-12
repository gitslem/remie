import { Router, Request, Response } from 'express';
import * as admin from 'firebase-admin';
import { authenticate } from './auth';

const router = Router();
const db = admin.firestore();

// Version 2.0.1 - Full Paystack integration with consistent wallet structure
// Initialize wallet if it doesn't exist
const ensureWalletExists = async (userId: string) => {
  const walletRef = db.collection('wallets').doc(userId);

  try {
    const walletDoc = await walletRef.get();

    if (!walletDoc.exists) {
      console.log(`Creating new wallet for user: ${userId}`);
      // Create wallet with all fields consistent with auth.ts wallet creation
      await walletRef.set({
        userId,
        balance: 0,
        ledgerBalance: 0,
        availableBalance: 0,
        usdtBalance: 0,
        usdcBalance: 0,
        currency: 'NGN',
        dailyLimit: 100000,
        monthlyLimit: 500000,
        isActive: true,
        isFrozen: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log(`Wallet created successfully for user: ${userId}`);
    }
  } catch (error: any) {
    console.error(`Error ensuring wallet exists for user ${userId}:`, error);
    throw new Error(`Failed to ensure wallet exists: ${error.message}`);
  }

  return walletRef;
};

// Helper function to call Paystack API
const callPaystackAPI = async (endpoint: string, method: string = 'GET', body?: any) => {
  const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!paystackSecretKey) {
    throw new Error('Paystack not configured');
  }

  const options: RequestInit = {
    method,
    headers: {
      'Authorization': `Bearer ${paystackSecretKey}`,
      'Content-Type': 'application/json',
    },
  };

  if (body && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`https://api.paystack.co${endpoint}`, options);
  const data = await response.json();

  if (!response.ok || !data.status) {
    throw new Error(data.message || 'Paystack API error');
  }

  return data;
};

// Get wallet balance
router.get('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { uid } = (req as any).user;

    // Ensure wallet exists
    await ensureWalletExists(uid);

    const walletDoc = await db.collection('wallets').doc(uid).get();
    const walletData = walletDoc.data();

    res.status(200).json({
      success: true,
      data: {
        balance: walletData?.balance || 0,
        availableBalance: walletData?.availableBalance || 0,
        ledgerBalance: walletData?.ledgerBalance || 0,
        currency: walletData?.currency || 'NGN',
        dailyLimit: walletData?.dailyLimit || 100000,
        monthlyLimit: walletData?.monthlyLimit || 500000,
        isActive: walletData?.isActive ?? true,
        isFrozen: walletData?.isFrozen ?? false,
        createdAt: walletData?.createdAt,
        updatedAt: walletData?.updatedAt,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Fund wallet - Initialize Paystack payment
router.post('/fund', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { uid, email } = (req as any).user;
    const { amount, callbackUrl } = req.body;

    console.log(`Fund wallet request from user ${uid} for amount: ₦${amount}`);

    if (!amount || amount < 100 || amount > 1000000) {
      res.status(400).json({
        success: false,
        message: 'Amount must be between ₦100 and ₦1,000,000',
      });
      return;
    }

    // Ensure wallet exists
    console.log(`Ensuring wallet exists for user: ${uid}`);
    const walletRef = await ensureWalletExists(uid);
    const wallet = (await walletRef.get()).data();
    console.log(`Wallet retrieved for user ${uid}, frozen status: ${wallet?.isFrozen}`);

    if (wallet?.isFrozen) {
      res.status(400).json({
        success: false,
        message: 'Wallet is frozen. Please contact support.',
      });
      return;
    }

    // Generate unique reference
    const reference = `REMIE_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`.toUpperCase();
    console.log(`Generated payment reference: ${reference}`);

    // Create pending payment record
    console.log(`Creating payment document for reference: ${reference}`);
    await db.collection('payments').doc(reference).set({
      userId: uid,
      type: 'WALLET_FUNDING',
      method: 'CARD',
      amount,
      reference,
      status: 'PENDING',
      description: 'Wallet funding',
      metadata: {
        walletId: uid,
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`Payment document created successfully for reference: ${reference}`);

    // Initialize Paystack payment
    const paystackData = await callPaystackAPI('/transaction/initialize', 'POST', {
      email: email || `${uid}@remiepay.com`,
      amount: Math.round(amount * 100), // Convert to kobo
      reference,
      callback_url: callbackUrl || `https://remiepay.web.app/dashboard/wallet?reference=${reference}`,
      metadata: {
        userId: uid,
        type: 'wallet_funding',
      },
    });

    console.log(`Paystack payment initialized successfully for reference: ${reference}`);

    res.status(200).json({
      success: true,
      message: 'Payment initialized. Complete payment to fund your wallet.',
      data: {
        authorizationUrl: paystackData.data.authorization_url,
        accessCode: paystackData.data.access_code,
        reference: paystackData.data.reference,
      },
    });
  } catch (error: any) {
    console.error(`Fund wallet error for user ${(req as any).user?.uid}:`, {
      error: error.message,
      code: error.code,
      stack: error.stack,
    });
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to initiate wallet funding',
      error: {
        code: error.code,
        details: error.message,
      },
    });
  }
});

// Verify wallet funding
router.get('/verify/:reference', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { uid } = (req as any).user;
    const { reference } = req.params;

    console.log(`[VERIFY] Starting verification for reference: ${reference}, user: ${uid}`);

    // Get payment record
    const paymentRef = db.collection('payments').doc(reference);
    const paymentDoc = await paymentRef.get();

    if (!paymentDoc.exists) {
      console.log(`[VERIFY] Payment not found: ${reference}`);
      res.status(404).json({
        success: false,
        message: 'Payment not found',
      });
      return;
    }

    const payment = paymentDoc.data();

    // Quick check before calling Paystack (optimization only, not for security)
    if (payment?.status === 'COMPLETED') {
      console.log(`[VERIFY] Payment already completed (quick check): ${reference}`);
      const walletDoc = await db.collection('wallets').doc(uid).get();
      res.status(200).json({
        success: true,
        message: 'Payment already processed',
        data: {
          payment: {
            id: paymentDoc.id,
            ...payment,
          },
          wallet: walletDoc.data(),
        },
      });
      return;
    }

    // Verify with Paystack
    console.log(`[VERIFY] Calling Paystack API for: ${reference}`);
    const paystackData = await callPaystackAPI(`/transaction/verify/${reference}`);

    if (paystackData.data.status !== 'success') {
      console.log(`[VERIFY] Paystack verification failed: ${reference}`);
      await paymentRef.update({
        status: 'FAILED',
        gatewayResponse: paystackData,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      res.status(400).json({
        success: false,
        message: 'Payment verification failed',
      });
      return;
    }

    const amount = paystackData.data.amount / 100; // Convert from kobo to naira
    console.log(`[VERIFY] Paystack verification successful. Amount: ₦${amount}`);

    // CRITICAL: Update wallet and payment in atomic transaction with status check INSIDE
    let walletData;
    try {
      await db.runTransaction(async (transaction) => {
        // Read payment status INSIDE transaction for atomicity
        const currentPaymentDoc = await transaction.get(paymentRef);
        const currentPayment = currentPaymentDoc.data();

        // Idempotency check - if already completed, abort transaction
        if (currentPayment?.status === 'COMPLETED') {
          console.log(`[VERIFY] Payment already completed (atomic check): ${reference}`);
          throw new Error('ALREADY_PROCESSED');
        }

        console.log(`[VERIFY] Crediting wallet for user: ${uid}, amount: ₦${amount}`);

        const walletRef = db.collection('wallets').doc(uid);

        // Read current wallet balance for logging
        const currentWallet = await transaction.get(walletRef);
        const currentBalance = currentWallet.data()?.balance || 0;
        console.log(`[VERIFY] Current balance: ₦${currentBalance}, New balance will be: ₦${currentBalance + amount}`);

        // Update wallet balance
        transaction.update(walletRef, {
          balance: admin.firestore.FieldValue.increment(amount),
          availableBalance: admin.firestore.FieldValue.increment(amount),
          ledgerBalance: admin.firestore.FieldValue.increment(amount),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Update payment status
        transaction.update(paymentRef, {
          status: 'COMPLETED',
          gatewayResponse: paystackData,
          completedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Create audit trail entry
        const auditRef = db.collection('wallet_audit').doc();
        transaction.set(auditRef, {
          walletId: uid,
          userId: uid,
          type: 'CREDIT',
          amount,
          previousBalance: currentBalance,
          newBalance: currentBalance + amount,
          reference,
          paymentId: reference,
          reason: 'Wallet funding via Paystack',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        console.log(`[VERIFY] Transaction completed successfully for: ${reference}`);
      });
    } catch (error: any) {
      // If already processed, return success with current state
      if (error.message === 'ALREADY_PROCESSED') {
        console.log(`[VERIFY] Duplicate verification prevented for: ${reference}`);
        const updatedPayment = await paymentRef.get();
        const walletDoc = await db.collection('wallets').doc(uid).get();
        res.status(200).json({
          success: true,
          message: 'Payment already processed',
          data: {
            payment: {
              id: paymentRef.id,
              ...updatedPayment.data(),
            },
            wallet: walletDoc.data(),
          },
        });
        return;
      }
      throw error;
    }

    // Get updated wallet
    const updatedWallet = await db.collection('wallets').doc(uid).get();
    walletData = updatedWallet.data();

    console.log(`[VERIFY] Final wallet balance: ₦${walletData?.balance || 0}`);

    res.status(200).json({
      success: true,
      message: 'Wallet funded successfully',
      data: {
        payment: {
          id: paymentDoc.id,
          ...payment,
          status: 'COMPLETED',
        },
        wallet: walletData,
      },
    });
  } catch (error: any) {
    console.error(`[VERIFY] Error during verification:`, error);
    res.status(400).json({
      success: false,
      message: error.message || 'Payment verification failed',
    });
  }
});

// Withdraw from wallet
router.post('/withdraw', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { uid } = (req as any).user;
    const { amount, bankAccount, reason } = req.body;

    if (!amount || amount < 100) {
      res.status(400).json({
        success: false,
        message: 'Minimum withdrawal amount is ₦100',
      });
      return;
    }

    if (!bankAccount || !bankAccount.accountNumber || !bankAccount.bankCode) {
      res.status(400).json({
        success: false,
        message: 'Bank account details are required',
      });
      return;
    }

    // Get wallet
    const walletRef = db.collection('wallets').doc(uid);
    const walletDoc = await walletRef.get();

    if (!walletDoc.exists) {
      res.status(404).json({
        success: false,
        message: 'Wallet not found',
      });
      return;
    }

    const wallet = walletDoc.data();

    if (wallet?.isFrozen) {
      res.status(400).json({
        success: false,
        message: 'Wallet is frozen. Please contact support.',
      });
      return;
    }

    if (amount > (wallet?.availableBalance || 0)) {
      res.status(400).json({
        success: false,
        message: 'Insufficient balance',
      });
      return;
    }

    // Resolve account name if not provided
    let accountName = bankAccount.accountName;
    if (!accountName) {
      try {
        const accountData = await callPaystackAPI(
          `/bank/resolve?account_number=${bankAccount.accountNumber}&bank_code=${bankAccount.bankCode}`
        );
        accountName = accountData.data.account_name;
      } catch (error) {
        res.status(400).json({
          success: false,
          message: 'Failed to verify account details',
        });
        return;
      }
    }

    // Create transfer recipient on Paystack
    const recipientData = await callPaystackAPI('/transferrecipient', 'POST', {
      type: 'nuban',
      name: accountName,
      account_number: bankAccount.accountNumber,
      bank_code: bankAccount.bankCode,
      currency: 'NGN',
    });

    // Generate reference
    const reference = `REMIE_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`.toUpperCase();

    // Initiate transfer
    const transferData = await callPaystackAPI('/transfer', 'POST', {
      source: 'balance',
      amount: Math.round(amount * 100), // Convert to kobo
      recipient: recipientData.data.recipient_code,
      reason: reason || 'Wallet withdrawal',
      reference,
    });

    // Deduct from available balance and create payment record
    await db.runTransaction(async (transaction) => {
      transaction.update(walletRef, {
        availableBalance: admin.firestore.FieldValue.increment(-amount),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      const paymentRef = db.collection('payments').doc(reference);
      transaction.set(paymentRef, {
        userId: uid,
        type: 'WITHDRAWAL',
        method: 'BANK_TRANSFER',
        amount,
        reference,
        status: 'PROCESSING',
        description: reason || 'Wallet withdrawal',
        metadata: {
          recipientCode: recipientData.data.recipient_code,
          accountNumber: bankAccount.accountNumber,
          accountName,
          bankCode: bankAccount.bankCode,
        },
        gatewayResponse: transferData,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    // Get updated wallet
    const updatedWallet = await walletRef.get();

    res.status(200).json({
      success: true,
      message: 'Withdrawal initiated. Funds will be sent to your account shortly.',
      data: {
        payment: {
          reference,
          amount,
          status: 'PROCESSING',
        },
        wallet: updatedWallet.data(),
      },
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to initiate withdrawal',
    });
  }
});

// Get wallet transactions
router.get('/transactions', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { uid } = (req as any).user;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const type = req.query.type as string;

    let query: admin.firestore.Query = db.collection('payments')
      .where('userId', '==', uid)
      .orderBy('createdAt', 'desc');

    // Filter by transaction type if specified
    if (type) {
      query = query.where('type', '==', type);
    }

    // Apply pagination
    const snapshot = await query.limit(limit).get();

    const transactions = snapshot.docs.map(doc => ({
      id: doc.id,
      reference: doc.data().reference,
      amount: doc.data().amount,
      type: doc.data().type,
      method: doc.data().method,
      status: doc.data().status,
      description: doc.data().description,
      metadata: doc.data().metadata,
      createdAt: doc.data().createdAt,
      completedAt: doc.data().completedAt,
    }));

    // Get total count
    const totalSnapshot = await db.collection('payments')
      .where('userId', '==', uid)
      .get();
    const total = totalSnapshot.size;

    res.status(200).json({
      success: true,
      data: transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Get Nigerian banks list
router.get('/banks', async (req: Request, res: Response): Promise<void> => {
  try {
    // Fetch banks from Paystack API
    const banksData = await callPaystackAPI('/bank?country=nigeria');

    const banks = banksData.data.map((bank: any) => ({
      id: bank.id,
      name: bank.name,
      code: bank.code,
      slug: bank.slug,
    }));

    res.status(200).json({
      success: true,
      data: banks,
    });
  } catch (error: any) {
    // Fallback to major banks if Paystack API fails
    const banks = [
      { id: 1, name: 'Access Bank', code: '044', slug: 'access-bank' },
      { id: 2, name: 'Citibank Nigeria', code: '023', slug: 'citibank-nigeria' },
      { id: 3, name: 'Ecobank Nigeria', code: '050', slug: 'ecobank-nigeria' },
      { id: 4, name: 'Fidelity Bank', code: '070', slug: 'fidelity-bank' },
      { id: 5, name: 'First Bank of Nigeria', code: '011', slug: 'first-bank-of-nigeria' },
      { id: 6, name: 'First City Monument Bank', code: '214', slug: 'first-city-monument-bank' },
      { id: 7, name: 'Guaranty Trust Bank', code: '058', slug: 'guaranty-trust-bank' },
      { id: 8, name: 'Heritage Banking Company Ltd.', code: '030', slug: 'heritage-bank' },
      { id: 9, name: 'Keystone Bank', code: '082', slug: 'keystone-bank' },
      { id: 10, name: 'Polaris Bank', code: '076', slug: 'polaris-bank' },
      { id: 11, name: 'Providus Bank', code: '101', slug: 'providus-bank' },
      { id: 12, name: 'Stanbic IBTC Bank', code: '221', slug: 'stanbic-ibtc-bank' },
      { id: 13, name: 'Standard Chartered Bank', code: '068', slug: 'standard-chartered-bank' },
      { id: 14, name: 'Sterling Bank', code: '232', slug: 'sterling-bank' },
      { id: 15, name: 'Union Bank of Nigeria', code: '032', slug: 'union-bank-of-nigeria' },
      { id: 16, name: 'United Bank For Africa', code: '033', slug: 'united-bank-for-africa' },
      { id: 17, name: 'Unity Bank', code: '215', slug: 'unity-bank' },
      { id: 18, name: 'Wema Bank', code: '035', slug: 'wema-bank' },
      { id: 19, name: 'Zenith Bank', code: '057', slug: 'zenith-bank' },
    ];

    res.status(200).json({
      success: true,
      data: banks,
    });
  }
});

// Resolve bank account name
router.post('/resolve-account', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { accountNumber, bankCode } = req.body;

    if (!accountNumber || !bankCode) {
      res.status(400).json({
        success: false,
        message: 'Account number and bank code are required',
      });
      return;
    }

    if (accountNumber.length !== 10) {
      res.status(400).json({
        success: false,
        message: 'Account number must be 10 digits',
      });
      return;
    }

    // Resolve account with Paystack API
    const accountData = await callPaystackAPI(
      `/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`
    );

    res.status(200).json({
      success: true,
      data: {
        account_number: accountData.data.account_number,
        account_name: accountData.data.account_name,
        bank_id: accountData.data.bank_id,
      },
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to resolve account',
    });
  }
});

export default router;
