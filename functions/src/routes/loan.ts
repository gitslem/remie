import { Router, Request, Response } from 'express';
import * as admin from 'firebase-admin';
import { authenticate } from './auth';

const router = Router();
const db = admin.firestore();

const MIN_LOAN_AMOUNT = 5000;
const MAX_LOAN_AMOUNT = 50000;
const INTEREST_RATE = 5; // 5% annual
const MAX_TENURE_DAYS = 90;

// Apply for loan
router.post('/apply', authenticate, async (req: Request, res: Response) => {
  try {
    const { uid } = (req as any).user;
    const { amount, purpose, purposeType, tenure } = req.body;

    if (amount < MIN_LOAN_AMOUNT || amount > MAX_LOAN_AMOUNT) {
      return res.status(400).json({
        status: 'error',
        message: `Loan amount must be between ₦${MIN_LOAN_AMOUNT} and ₦${MAX_LOAN_AMOUNT}`,
      });
    }

    if (tenure < 7 || tenure > MAX_TENURE_DAYS) {
      return res.status(400).json({
        status: 'error',
        message: `Loan tenure must be between 7 and ${MAX_TENURE_DAYS} days`,
      });
    }

    // Check for active loans
    const activeLoansSnapshot = await db.collection('loans')
      .where('userId', '==', uid)
      .where('status', 'in', ['ACTIVE', 'DISBURSED', 'APPROVED'])
      .limit(1)
      .get();

    if (!activeLoansSnapshot.empty) {
      return res.status(400).json({
        status: 'error',
        message: 'You already have an active loan',
      });
    }

    // Calculate repayable amount
    const interestAmount = (amount * INTEREST_RATE * tenure) / (365 * 100);
    const totalRepayable = amount + interestAmount;

    const loanNumber = `LOAN-${Date.now()}`;
    const dueDate = new Date(Date.now() + tenure * 24 * 60 * 60 * 1000);

    // Create loan (auto-approved for demo)
    const loanRef = db.collection('loans').doc();
    await loanRef.set({
      userId: uid,
      loanNumber,
      amount,
      interestRate: INTEREST_RATE,
      tenure,
      purpose,
      purposeType,
      totalRepayable,
      amountPaid: 0,
      amountOutstanding: totalRepayable,
      dueDate,
      status: 'DISBURSED',
      approvedBy: 'SYSTEM',
      approvedAt: admin.firestore.FieldValue.serverTimestamp(),
      disbursedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Credit wallet
    await db.collection('wallets').doc(uid).update({
      balance: admin.firestore.FieldValue.increment(amount),
      availableBalance: admin.firestore.FieldValue.increment(amount),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(201).json({
      status: 'success',
      message: 'Loan approved and disbursed',
      data: {
        loanId: loanRef.id,
        loanNumber,
        amount,
        totalRepayable,
        dueDate,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
});

// Repay loan
router.post('/:loanId/repay', authenticate, async (req: Request, res: Response) => {
  try {
    const { uid } = (req as any).user;
    const { loanId } = req.params;
    const { amount } = req.body;

    const loanDoc = await db.collection('loans').doc(loanId).get();

    if (!loanDoc.exists) {
      return res.status(404).json({
        status: 'error',
        message: 'Loan not found',
      });
    }

    const loan = loanDoc.data();

    if (loan?.userId !== uid) {
      return res.status(403).json({
        status: 'error',
        message: 'Unauthorized',
      });
    }

    if (amount <= 0 || amount > loan?.amountOutstanding) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid repayment amount',
      });
    }

    // Process repayment
    await db.runTransaction(async (transaction) => {
      const walletRef = db.collection('wallets').doc(uid);
      const wallet = await transaction.get(walletRef);

      if (!wallet.exists || wallet.data()?.availableBalance < amount) {
        throw new Error('Insufficient wallet balance');
      }

      // Debit wallet
      transaction.update(walletRef, {
        balance: admin.firestore.FieldValue.increment(-amount),
        availableBalance: admin.firestore.FieldValue.increment(-amount),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Update loan
      const newOutstanding = loan.amountOutstanding - amount;
      transaction.update(loanDoc.ref, {
        amountPaid: admin.firestore.FieldValue.increment(amount),
        amountOutstanding: newOutstanding,
        lastPaymentDate: admin.firestore.FieldValue.serverTimestamp(),
        status: newOutstanding === 0 ? 'COMPLETED' : 'ACTIVE',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Create repayment record
      const repaymentRef = db.collection('loanRepayments').doc();
      transaction.set(repaymentRef, {
        loanId,
        amount,
        reference: `REPAY-${Date.now()}`,
        paymentMethod: 'WALLET',
        status: 'COMPLETED',
        paidAt: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    res.status(200).json({
      status: 'success',
      message: 'Loan repayment successful',
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
});

// Get user loans
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { uid } = (req as any).user;
    const limit = parseInt(req.query.limit as string) || 20;

    const loansSnapshot = await db.collection('loans')
      .where('userId', '==', uid)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    const loans = loansSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json({
      status: 'success',
      data: { loans },
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
});

export default router;
