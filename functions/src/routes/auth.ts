import { Router, Request, Response, NextFunction } from 'express';
import * as admin from 'firebase-admin';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';
import { sendEmail } from '../utils/email';

const router = Router();
const db = admin.firestore();
const auth = admin.auth();

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'your-refresh-secret';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '30d';

// Helper functions
const generateToken = (userId: string, email: string, role: string): string => {
  return jwt.sign({ userId, email, role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions) as string;
};

const generateRefreshToken = (userId: string): string => {
  return jwt.sign({ userId }, REFRESH_TOKEN_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN } as jwt.SignOptions) as string;
};

// Middleware to verify JWT token (for custom auth)
const authenticateJWT = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];

    if (!token) {
      res.status(401).json({
        status: 'error',
        message: 'Authentication token required',
      });
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string; role: string };
    (req as any).user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    res.status(401).json({
      status: 'error',
      message: 'Invalid or expired token',
    });
  }
};

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

// Register new user
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, firstName, lastName, phoneNumber, studentId, institution } = req.body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      res.status(400).json({
        status: 'error',
        message: 'Email, password, firstName, and lastName are required',
      });
      return;
    }

    // Validate password length
    if (password.length < 8) {
      res.status(400).json({
        status: 'error',
        message: 'Password must be at least 8 characters',
      });
      return;
    }

    // Check if user already exists
    const existingUser = await db.collection('users')
      .where('email', '==', email.toLowerCase())
      .limit(1)
      .get();

    if (!existingUser.empty) {
      res.status(409).json({
        status: 'error',
        message: 'User with this email already exists',
      });
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user document
    const userRef = db.collection('users').doc();
    const userId = userRef.id;

    await userRef.set({
      email: email.toLowerCase(),
      password: hashedPassword,
      firstName,
      lastName,
      phoneNumber: phoneNumber || null,
      studentId: studentId || null,
      institution: institution || null,
      role: 'STUDENT',
      status: 'PENDING_APPROVAL',
      emailVerified: false,
      phoneVerified: false,
      kycVerified: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Create wallet for user
    await db.collection('wallets').doc(userId).set({
      userId,
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

    // Generate tokens
    const token = generateToken(userId, email, 'STUDENT');
    const refreshToken = generateRefreshToken(userId);

    // Save refresh token
    await userRef.update({ refreshToken });

    res.status(201).json({
      status: 'success',
      message: 'Registration successful',
      data: {
        user: {
          id: userId,
          email: email.toLowerCase(),
          firstName,
          lastName,
          role: 'STUDENT',
          status: 'PENDING_APPROVAL',
        },
        token,
        refreshToken,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Registration failed',
    });
  }
});

// Login user
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        status: 'error',
        message: 'Email and password are required',
      });
      return;
    }

    // Find user
    const userSnapshot = await db.collection('users')
      .where('email', '==', email.toLowerCase())
      .limit(1)
      .get();

    if (userSnapshot.empty) {
      res.status(401).json({
        status: 'error',
        message: 'Invalid email or password',
      });
      return;
    }

    const userDoc = userSnapshot.docs[0];
    const user = userDoc.data();

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      res.status(401).json({
        status: 'error',
        message: 'Invalid email or password',
      });
      return;
    }

    // Check user status
    if (user.status === 'PENDING_APPROVAL') {
      res.status(403).json({
        status: 'error',
        message: 'Your account is pending admin approval. Please wait for approval to access the platform.',
      });
      return;
    }

    if (user.status === 'SUSPENDED') {
      res.status(403).json({
        status: 'error',
        message: 'Your account has been suspended. Please contact support.',
      });
      return;
    }

    if (user.status === 'INACTIVE') {
      res.status(403).json({
        status: 'error',
        message: 'Your account is inactive. Please contact support.',
      });
      return;
    }

    // Generate tokens
    const token = generateToken(userDoc.id, user.email, user.role);
    const refreshToken = generateRefreshToken(userDoc.id);

    // Update refresh token and last login
    await userDoc.ref.update({
      refreshToken,
      lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(200).json({
      status: 'success',
      message: 'Login successful',
      data: {
        user: {
          id: userDoc.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          status: user.status,
        },
        token,
        refreshToken,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Login failed',
    });
  }
});

// Get current user
router.get('/me', authenticateJWT, async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = (req as any).user;

    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
      return;
    }

    const userData = userDoc.data();
    if (!userData) {
      res.status(404).json({
        status: 'error',
        message: 'User data not found',
      });
      return;
    }

    delete userData.password;
    delete userData.refreshToken;

    res.status(200).json({
      status: 'success',
      data: {
        id: userDoc.id,
        ...userData,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
});

// Forgot password - Request password reset
router.post('/forgot-password', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({
        status: 'error',
        message: 'Email is required',
      });
      return;
    }

    // Find user
    const userSnapshot = await db.collection('users')
      .where('email', '==', email.toLowerCase())
      .limit(1)
      .get();

    // Always return success to avoid email enumeration
    if (userSnapshot.empty) {
      res.status(200).json({
        status: 'success',
        message: 'If user exists, password reset email will be sent',
      });
      return;
    }

    const userDoc = userSnapshot.docs[0];
    const userData = userDoc.data();

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    // Save reset token to user document
    await userDoc.ref.update({
      resetToken: resetTokenHash,
      resetTokenExpiry: admin.firestore.Timestamp.fromDate(resetTokenExpiry),
    });

    // Get frontend URL from environment or use default
    const frontendUrl = process.env.FRONTEND_URL || 'https://remiepay.web.app';
    const resetUrl = `${frontendUrl}/auth/reset-password/${resetToken}`;

    // Send password reset email
    try {
      await sendEmail({
        to: email.toLowerCase(),
        subject: 'Reset Your REMIE Password',
        template: 'password-reset',
        data: {
          firstName: userData.firstName || 'User',
          resetUrl,
        },
      });
      console.log(`Password reset email sent to ${email}`);
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
      // Continue even if email fails - user can still use the link from logs
    }

    res.status(200).json({
      status: 'success',
      message: 'Password reset email sent',
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to process password reset request',
    });
  }
});

// Reset password - Complete password reset
router.post('/reset-password/:token', async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      res.status(400).json({
        status: 'error',
        message: 'Password is required',
      });
      return;
    }

    // Validate password length
    if (password.length < 8) {
      res.status(400).json({
        status: 'error',
        message: 'Password must be at least 8 characters',
      });
      return;
    }

    // Hash the token to match what's stored
    const resetTokenHash = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user with valid reset token
    const now = admin.firestore.Timestamp.now();
    const usersSnapshot = await db.collection('users')
      .where('resetToken', '==', resetTokenHash)
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid or expired reset token',
      });
      return;
    }

    const userDoc = usersSnapshot.docs[0];
    const userData = userDoc.data();

    // Check if token has expired
    if (!userData.resetTokenExpiry || userData.resetTokenExpiry.toDate() < now.toDate()) {
      res.status(400).json({
        status: 'error',
        message: 'Reset token has expired',
      });
      return;
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update password and clear reset token
    await userDoc.ref.update({
      password: hashedPassword,
      resetToken: admin.firestore.FieldValue.delete(),
      resetTokenExpiry: admin.firestore.FieldValue.delete(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(200).json({
      status: 'success',
      message: 'Password reset successful',
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to reset password',
    });
  }
});

// Create user profile after Firebase Auth registration
router.post('/create-profile', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { uid } = (req as any).user;
    const { firstName, lastName, phoneNumber, studentId, institution, nickname } = req.body;

    // Validate nickname if provided (optional during signup)
    if (nickname) {
      const nicknameExists = await db.collection('users')
        .where('nickname', '==', nickname.toLowerCase())
        .limit(1)
        .get();

      if (!nicknameExists.empty) {
        res.status(400).json({
          status: 'error',
          message: 'Nickname already taken',
        });
        return;
      }
    }

    // Create user document
    await db.collection('users').doc(uid).set({
      email: (req as any).user.email,
      firstName,
      lastName,
      phoneNumber,
      studentId,
      institution,
      nickname: nickname ? nickname.toLowerCase() : null,
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
    delete updates.email; // Email cannot be changed
    delete updates.createdAt;

    // Validate nickname if being updated
    if (updates.nickname !== undefined) {
      if (updates.nickname) {
        // Check if nickname is already taken by another user
        const nicknameExists = await db.collection('users')
          .where('nickname', '==', updates.nickname.toLowerCase())
          .limit(1)
          .get();

        if (!nicknameExists.empty && nicknameExists.docs[0].id !== uid) {
          res.status(400).json({
            status: 'error',
            message: 'Nickname already taken',
          });
          return;
        }

        // Store nickname in lowercase
        updates.nickname = updates.nickname.toLowerCase();
      } else {
        // Allow setting nickname to null/empty
        updates.nickname = null;
      }
    }

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
