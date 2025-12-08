import { Router, Request, Response } from 'express';
import * as admin from 'firebase-admin';
import { authenticate } from './auth';

const router = Router();
const db = admin.firestore();

// Get all payments
router.get('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { uid } = (req as any).user;
    const limit = parseInt(req.query.limit as string) || 20;

    const paymentsSnapshot = await db.collection('payments')
      .where('userId', '==', uid)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    const payments = paymentsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json({
      status: 'success',
      data: { payments },
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
});

// Get payment by ID
router.get('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { uid } = (req as any).user;
    const { id } = req.params;

    const paymentDoc = await db.collection('payments').doc(id).get();

    if (!paymentDoc.exists) {
      res.status(404).json({
        status: 'error',
        message: 'Payment not found',
      });
      return;
    }

    const payment = paymentDoc.data();

    if (!payment || payment.userId !== uid) {
      res.status(403).json({
        status: 'error',
        message: 'Unauthorized',
      });
      return;
    }

    res.status(200).json({
      status: 'success',
      data: payment,
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
});

export default router;
