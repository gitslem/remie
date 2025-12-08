import { Router, Request, Response } from 'express';
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { authenticate } from './auth';

const router = Router();
const db = admin.firestore();

// Generate RRR code
router.post('/generate', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { uid } = (req as any).user;
    const {
      amount,
      institutionCode,
      institutionName,
      serviceTypeId,
      payerName,
      payerEmail,
      payerPhone,
      description,
    } = req.body;

    const orderId = `REMIE-${Date.now()}`;

    // Create payment record
    const paymentRef = db.collection('payments').doc();
    await paymentRef.set({
      userId: uid,
      reference: orderId,
      amount,
      currency: 'NGN',
      type: 'SCHOOL_FEE',
      method: 'RRR',
      status: 'PENDING',
      recipientName: institutionName,
      institutionName,
      description,
      totalAmount: amount,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // For demo purposes, generate a mock RRR
    const rrr = `${Math.floor(100000000000 + Math.random() * 900000000000)}`;

    // Create RRR payment record
    const rrrRef = db.collection('rrrPayments').doc();
    await rrrRef.set({
      userId: uid,
      paymentId: paymentRef.id,
      rrr,
      orderId,
      amount,
      institutionCode,
      institutionName,
      serviceTypeId,
      payerName,
      payerEmail,
      payerPhone,
      status: 'INITIATED',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(201).json({
      status: 'success',
      message: 'RRR generated successfully',
      data: {
        rrr,
        orderId,
        amount,
        paymentId: paymentRef.id,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
});

// Verify RRR payment
router.get('/verify/:rrr', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { rrr } = req.params;

    const rrrSnapshot = await db.collection('rrrPayments')
      .where('rrr', '==', rrr)
      .limit(1)
      .get();

    if (rrrSnapshot.empty) {
      res.status(404).json({
        status: 'error',
        message: 'RRR not found',
      });
      return;
    }

    const rrrDoc = rrrSnapshot.docs[0];
    const rrrData = rrrDoc.data();

    res.status(200).json({
      status: 'success',
      data: {
        status: rrrData.status,
        rrr: rrrData.rrr,
        amount: rrrData.amount,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
});

// Get user's RRR payments
router.get('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { uid } = (req as any).user;
    const limit = parseInt(req.query.limit as string) || 20;

    const snapshot = await db.collection('rrrPayments')
      .where('userId', '==', uid)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    const payments = snapshot.docs.map(doc => ({
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

export default router;
