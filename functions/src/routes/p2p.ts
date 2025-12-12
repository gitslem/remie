import { Router, Request, Response } from 'express';
import * as admin from 'firebase-admin';
import { authenticate } from './auth';

const router = Router();
const db = admin.firestore();

// Send money to another user
router.post('/send', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { uid } = (req as any).user;
    const { receiverIdentifier, amount, description, category } = req.body;

    if (amount <= 0 || amount > 50000) {
      res.status(400).json({
        status: 'error',
        message: 'Amount must be between 0 and 50,000',
      });
      return;
    }

    // Find receiver by email or nickname
    let receiverSnapshot = await db.collection('users')
      .where('email', '==', receiverIdentifier)
      .limit(1)
      .get();

    // If not found by email, try nickname
    if (receiverSnapshot.empty) {
      receiverSnapshot = await db.collection('users')
        .where('nickname', '==', receiverIdentifier.toLowerCase())
        .limit(1)
        .get();
    }

    if (receiverSnapshot.empty) {
      res.status(404).json({
        status: 'error',
        message: 'Receiver not found. Check email or nickname.',
      });
      return;
    }

    const receiverDoc = receiverSnapshot.docs[0];
    const receiverId = receiverDoc.id;

    if (uid === receiverId) {
      res.status(400).json({
        status: 'error',
        message: 'Cannot send money to yourself',
      });
      return;
    }

    // Use Firestore transaction for atomic operation
    const result = await db.runTransaction(async (transaction) => {
      const senderWalletRef = db.collection('wallets').doc(uid);
      const receiverWalletRef = db.collection('wallets').doc(receiverId);

      const senderWallet = await transaction.get(senderWalletRef);
      const receiverWallet = await transaction.get(receiverWalletRef);

      if (!senderWallet.exists || !receiverWallet.exists) {
        throw new Error('Wallet not found');
      }

      const senderBalance = senderWallet.data()?.availableBalance || 0;

      if (senderBalance < amount) {
        throw new Error('Insufficient balance');
      }

      // Debit sender
      transaction.update(senderWalletRef, {
        balance: admin.firestore.FieldValue.increment(-amount),
        availableBalance: admin.firestore.FieldValue.increment(-amount),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Credit receiver
      transaction.update(receiverWalletRef, {
        balance: admin.firestore.FieldValue.increment(amount),
        availableBalance: admin.firestore.FieldValue.increment(amount),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Create transfer record
      const transferRef = db.collection('p2pTransfers').doc();
      const reference = `P2P-${Date.now()}`;

      transaction.set(transferRef, {
        senderId: uid,
        receiverId,
        reference,
        amount,
        fee: 0,
        totalAmount: amount,
        description,
        category,
        status: 'COMPLETED',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return { transferId: transferRef.id, reference };
    });

    res.status(201).json({
      status: 'success',
      message: 'Money sent successfully',
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
});

// Get user transfers
router.get('/transfers', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { uid } = (req as any).user;
    const type = req.query.type || 'all';
    const limit = parseInt(req.query.limit as string) || 20;

    let query = db.collection('p2pTransfers').orderBy('createdAt', 'desc').limit(limit);

    if (type === 'sent') {
      query = query.where('senderId', '==', uid) as any;
    } else if (type === 'received') {
      query = query.where('receiverId', '==', uid) as any;
    }

    const snapshot = await query.get();
    const transfers = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json({
      status: 'success',
      data: { transfers },
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
});

// Search users
router.get('/search-users', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { uid } = (req as any).user;
    const query = req.query.q as string;

    if (!query || query.length < 2) {
      res.status(400).json({
        status: 'error',
        message: 'Search query must be at least 2 characters',
      });
      return;
    }

    const usersSnapshot = await db.collection('users')
      .where('email', '>=', query)
      .where('email', '<=', query + '\uf8ff')
      .limit(10)
      .get();

    const users = usersSnapshot.docs
      .filter(doc => doc.id !== uid)
      .map(doc => ({
        id: doc.id,
        firstName: doc.data().firstName,
        lastName: doc.data().lastName,
        email: doc.data().email,
        studentId: doc.data().studentId,
      }));

    res.status(200).json({
      status: 'success',
      data: users,
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
});

export default router;
