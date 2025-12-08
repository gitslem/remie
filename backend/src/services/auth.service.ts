import { PrismaClient, User } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { AppError } from '../middleware/errorHandler';
import { sendEmail } from '../utils/email';
import logger from '../utils/logger';

const prisma = new PrismaClient();

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  studentId?: string;
  institution?: string;
}

interface LoginData {
  email: string;
  password: string;
}

export class AuthService {
  // Generate JWT token
  private generateToken(userId: string, email: string, role: string): string {
    return jwt.sign(
      { userId, email, role },
      process.env.JWT_SECRET as string,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
  }

  // Generate refresh token
  private generateRefreshToken(userId: string): string {
    return jwt.sign(
      { userId },
      process.env.REFRESH_TOKEN_SECRET as string,
      { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '30d' }
    );
  }

  // Hash password
  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  // Compare password
  private async comparePassword(
    password: string,
    hashedPassword: string
  ): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  // Register new user
  async register(data: RegisterData) {
    try {
      // Check if user already exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email: data.email },
            ...(data.phoneNumber ? [{ phoneNumber: data.phoneNumber }] : []),
          ],
        },
      });

      if (existingUser) {
        throw new AppError('User with this email or phone already exists', 409);
      }

      // Hash password
      const hashedPassword = await this.hashPassword(data.password);

      // Create user and wallet in a transaction
      const user = await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            email: data.email,
            password: hashedPassword,
            firstName: data.firstName,
            lastName: data.lastName,
            phoneNumber: data.phoneNumber,
            studentId: data.studentId,
            institution: data.institution,
          },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            status: true,
          },
        });

        // Create wallet for user
        await tx.wallet.create({
          data: {
            userId: newUser.id,
          },
        });

        return newUser;
      });

      // Generate tokens
      const token = this.generateToken(user.id, user.email, user.role);
      const refreshToken = this.generateRefreshToken(user.id);

      // Save refresh token
      await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken },
      });

      // Send welcome email
      await sendEmail({
        to: user.email,
        subject: 'Welcome to REMIE',
        template: 'welcome',
        data: {
          firstName: user.firstName,
        },
      });

      logger.info(`New user registered: ${user.email}`);

      return {
        user,
        token,
        refreshToken,
      };
    } catch (error) {
      logger.error('Registration error:', error);
      throw error;
    }
  }

  // Login user
  async login(data: LoginData) {
    try {
      // Find user
      const user = await prisma.user.findUnique({
        where: { email: data.email },
      });

      if (!user) {
        throw new AppError('Invalid email or password', 401);
      }

      // Check password
      const isPasswordValid = await this.comparePassword(
        data.password,
        user.password
      );

      if (!isPasswordValid) {
        throw new AppError('Invalid email or password', 401);
      }

      // Check if user is active
      if (user.status !== 'ACTIVE' && user.status !== 'PENDING_VERIFICATION') {
        throw new AppError('Account is suspended or inactive', 403);
      }

      // Generate tokens
      const token = this.generateToken(user.id, user.email, user.role);
      const refreshToken = this.generateRefreshToken(user.id);

      // Update refresh token and last login
      await prisma.user.update({
        where: { id: user.id },
        data: {
          refreshToken,
          lastLoginAt: new Date(),
        },
      });

      logger.info(`User logged in: ${user.email}`);

      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          status: user.status,
        },
        token,
        refreshToken,
      };
    } catch (error) {
      logger.error('Login error:', error);
      throw error;
    }
  }

  // Refresh token
  async refreshToken(refreshToken: string) {
    try {
      const decoded = jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET as string
      ) as { userId: string };

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (!user || user.refreshToken !== refreshToken) {
        throw new AppError('Invalid refresh token', 401);
      }

      const newToken = this.generateToken(user.id, user.email, user.role);
      const newRefreshToken = this.generateRefreshToken(user.id);

      await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: newRefreshToken },
      });

      return {
        token: newToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      logger.error('Refresh token error:', error);
      throw new AppError('Invalid refresh token', 401);
    }
  }

  // Forgot password
  async forgotPassword(email: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        // Don't reveal that user doesn't exist
        return { message: 'If user exists, password reset email will be sent' };
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenHash = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

      const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetToken: resetTokenHash,
          resetTokenExpiry,
        },
      });

      // Send reset email
      const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
      await sendEmail({
        to: user.email,
        subject: 'Password Reset Request',
        template: 'password-reset',
        data: {
          firstName: user.firstName,
          resetUrl,
        },
      });

      logger.info(`Password reset requested for: ${user.email}`);

      return { message: 'Password reset email sent' };
    } catch (error) {
      logger.error('Forgot password error:', error);
      throw error;
    }
  }

  // Reset password
  async resetPassword(token: string, newPassword: string) {
    try {
      const resetTokenHash = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

      const user = await prisma.user.findFirst({
        where: {
          resetToken: resetTokenHash,
          resetTokenExpiry: {
            gt: new Date(),
          },
        },
      });

      if (!user) {
        throw new AppError('Invalid or expired reset token', 400);
      }

      const hashedPassword = await this.hashPassword(newPassword);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          resetToken: null,
          resetTokenExpiry: null,
        },
      });

      logger.info(`Password reset successful for: ${user.email}`);

      return { message: 'Password reset successful' };
    } catch (error) {
      logger.error('Reset password error:', error);
      throw error;
    }
  }

  // Logout
  async logout(userId: string) {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { refreshToken: null },
      });

      return { message: 'Logged out successfully' };
    } catch (error) {
      logger.error('Logout error:', error);
      throw error;
    }
  }
}

export default new AuthService();
