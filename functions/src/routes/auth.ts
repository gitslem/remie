import { Router, Request, Response, NextFunction } from 'express';
import * as admin from 'firebase-admin';

const router = Router();
const db = admin.firestore();
const auth = admin.auth();

// Middleware to verify Firebase token
export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];

    if (!token) {
      res.status(401).json({
        status: 'error',
        message: 'Authentication token required',
      });
      return;
    }

    const decodedToken = await auth.verifyIdToken(token);
    (req as any).user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
    };

    next();
  } catch (error) {
    res.status(401).json({
      status: 'error',
      message: 'Invalid or expired token',
    });
  }
};

// Create user profile after Firebase Auth registration
router.post('/create-profile', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { uid } = (req as any).user;
    const { firstName, lastName, phoneNumber, studentId, institution } = req.body;

    // Create user document
    await db.collection('users').doc(uid).set({
      email: (req as any).user.email,
      firstName,
      lastName,
      phoneNumber,
      studentId,
      institution,
      role: 'STUDENT',
      status: 'PENDING_VERIFICATION',
      emailVerified: false,
      phoneVerified: false,
      kycVerified: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Create wallet
    await db.collection('wallets').doc(uid).set({
      userId: uid,
      balance: 0,
      ledgerBalance: 0,
      availableBalance: 0,
      usdtBalance: 0,
      usdcBalance: 0,
      dailyLimit: 100000,
      monthlyLimit: 500000,
      isActive: true,
      isFrozen: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(201).json({
      status: 'success',
      message: 'Profile created successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
});

// Get user profile
router.get('/profile', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { uid } = (req as any).user;

    const userDoc = await db.collection('users').doc(uid).get();

    if (!userDoc.exists) {
      res.status(404).json({
        status: 'error',
        message: 'User profile not found',
      });
      return;
    }

    res.status(200).json({
      status: 'success',
      data: userDoc.data(),
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
});

// Update user profile
router.put('/profile', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { uid } = (req as any).user;
    const updates = req.body;

    // Remove sensitive fields
    delete updates.role;
    delete updates.status;
    delete updates.emailVerified;

    await db.collection('users').doc(uid).update({
      ...updates,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(200).json({
      status: 'success',
      message: 'Profile updated successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
});

export default router;
