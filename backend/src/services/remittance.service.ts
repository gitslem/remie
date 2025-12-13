import { PrismaClient, PaymentStatus, PaymentMethod, PaymentType } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import emailService from './email.service';
import logger from '../utils/logger';

const prisma = new PrismaClient();

interface SendRemittanceParams {
  senderId: string;
  recipientEmail: string;
  recipientPhone?: string;
  amount: number; // Amount in NGN
  purpose: string;
  senderName: string;
  senderEmail: string;
  recipientName: string;
  relationship: string;
  country: string; // Destination country
}

interface ExchangeRate {
  from: string;
  to: string;
  rate: number;
  fee: number; // Transfer fee percentage
}

class RemittanceService {
  // Exchange rates (in production, these should be fetched from a real API)
  private exchangeRates: Map<string, ExchangeRate> = new Map([
    [
      'NGN-USD',
      { from: 'NGN', to: 'USD', rate: 0.0013, fee: 2.5 }, // ~750 NGN = 1 USD, 2.5% fee
    ],
    [
      'NGN-GBP',
      { from: 'NGN', to: 'GBP', rate: 0.001, fee: 2.5 }, // ~1000 NGN = 1 GBP, 2.5% fee
    ],
    [
      'NGN-EUR',
      { from: 'NGN', to: 'EUR', rate: 0.0012, fee: 2.5 }, // ~833 NGN = 1 EUR, 2.5% fee
    ],
    [
      'NGN-CAD',
      { from: 'NGN', to: 'CAD', rate: 0.0017, fee: 2.5 }, // ~588 NGN = 1 CAD, 2.5% fee
    ],
    [
      'NGN-ZAR',
      { from: 'NGN', to: 'ZAR', rate: 0.024, fee: 1.5 }, // ~42 NGN = 1 ZAR, 1.5% fee
    ],
  ]);

  /**
   * Get exchange rate for a currency pair
   */
  getExchangeRate(from: string, to: string): ExchangeRate | null {
    return this.exchangeRates.get(`${from}-${to}`) || null;
  }

  /**
   * Calculate remittance details
   */
  calculateRemittance(params: {
    amount: number;
    fromCurrency: string;
    toCurrency: string;
  }): {
    sendAmount: number;
    fee: number;
    rate: number;
    receiveAmount: number;
    total: number;
  } | null {
    const exchangeRate = this.getExchangeRate(params.fromCurrency, params.toCurrency);

    if (!exchangeRate) {
      return null;
    }

    const fee = (params.amount * exchangeRate.fee) / 100;
    const sendAmount = params.amount;
    const total = sendAmount + fee;
    const receiveAmount = sendAmount * exchangeRate.rate;

    return {
      sendAmount,
      fee,
      rate: exchangeRate.rate,
      receiveAmount,
      total,
    };
  }

  /**
   * Initiate international remittance
   */
  async initiateRemittance(params: SendRemittanceParams) {
    try {
      // Validate minimum amount
      if (params.amount < 5000) {
        throw new Error('Minimum remittance amount is ₦5,000');
      }

      // Validate maximum amount
      if (params.amount > 5000000) {
        throw new Error('Maximum remittance amount is ₦5,000,000');
      }

      // Check sender wallet
      const senderWallet = await prisma.wallet.findUnique({
        where: { userId: params.senderId },
      });

      if (!senderWallet) {
        throw new Error('Sender wallet not found');
      }

      if (senderWallet.isFrozen) {
        throw new Error('Your wallet is frozen. Please contact support.');
      }

      // Get destination currency based on country
      const destinationCurrency = this.getCountryCurrency(params.country);
      const exchangeRate = this.getExchangeRate('NGN', destinationCurrency);

      if (!exchangeRate) {
        throw new Error(`Remittance to ${params.country} is not supported yet`);
      }

      // Calculate remittance details
      const calculation = this.calculateRemittance({
        amount: params.amount,
        fromCurrency: 'NGN',
        toCurrency: destinationCurrency,
      });

      if (!calculation) {
        throw new Error('Failed to calculate remittance');
      }

      // Check if sender has sufficient balance
      if (senderWallet.availableBalance.toNumber() < calculation.total) {
        throw new Error(
          `Insufficient balance. You need ₦${calculation.total.toLocaleString(
            'en-NG'
          )} (including ₦${calculation.fee.toLocaleString('en-NG')} fee)`
        );
      }

      // Find or create recipient user
      let recipient = await prisma.user.findUnique({
        where: { email: params.recipientEmail },
      });

      if (!recipient) {
        // Generate temporary password for the recipient
        const temporaryPassword = this.generateTemporaryPassword();
        const hashedPassword = await this.hashPassword(temporaryPassword);

        // Generate password reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
        const resetTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        // Create a new user for the recipient
        recipient = await prisma.user.create({
          data: {
            email: params.recipientEmail,
            password: hashedPassword,
            phoneNumber: params.recipientPhone,
            firstName: params.recipientName.split(' ')[0],
            lastName: params.recipientName.split(' ').slice(1).join(' ') || '',
            role: 'STUDENT',
            status: 'PENDING_VERIFICATION',
            resetToken: resetTokenHash,
            resetTokenExpiry,
          },
        });

        // Create wallet for recipient
        await prisma.wallet.create({
          data: {
            userId: recipient.id,
          },
        });

        // Send welcome email with password reset link
        try {
          const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
          await emailService.sendEmail({
            to: params.recipientEmail,
            subject: 'Welcome to REMIE - Set Your Password',
            html: this.getWelcomeEmailTemplate({
              recipientName: params.recipientName,
              senderName: params.senderName,
              resetUrl,
            }),
          });
        } catch (emailError: any) {
          logger.warn('Failed to send welcome email to new recipient', {
            error: emailError.message,
          });
        }
      }

      // Generate reference
      const reference = `REM_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`.toUpperCase();

      // Create remittance transaction
      const [_updatedSenderWallet, payment] = await prisma.$transaction([
        // Deduct from sender
        prisma.wallet.update({
          where: { id: senderWallet.id },
          data: {
            balance: { decrement: calculation.total },
            availableBalance: { decrement: calculation.total },
            ledgerBalance: { decrement: calculation.total },
            lastTransactionAt: new Date(),
          },
        }),
        // Create payment record
        prisma.payment.create({
          data: {
            userId: params.senderId,
            amount: params.amount,
            type: PaymentType.INTERNATIONAL_REMITTANCE,
            method: PaymentMethod.WALLET,
            status: PaymentStatus.PROCESSING,
            reference,
            recipientName: params.recipientName,
            description: `International remittance to ${params.country} - ${params.purpose}`,
            totalAmount: calculation.total,
            processingFee: calculation.fee,
            metadata: {
              recipientId: recipient.id,
              recipientEmail: params.recipientEmail,
              recipientName: params.recipientName,
              relationship: params.relationship,
              purpose: params.purpose,
              country: params.country,
              destinationCurrency,
              exchangeRate: calculation.rate,
              receiveAmount: calculation.receiveAmount,
              senderName: params.senderName,
            },
          },
        }),
      ]);

      // In a real system, this would integrate with a remittance provider
      // For now, we'll mark it as completed and credit the recipient
      const [finalPayment, _recipientWallet] = await prisma.$transaction([
        prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.COMPLETED,
            completedAt: new Date(),
          },
        }),
        prisma.wallet.update({
          where: { userId: recipient.id },
          data: {
            balance: { increment: params.amount },
            availableBalance: { increment: params.amount },
            ledgerBalance: { increment: params.amount },
            lastTransactionAt: new Date(),
          },
        }),
      ]);

      logger.info('Remittance completed', {
        reference,
        senderId: params.senderId,
        recipientId: recipient.id,
        amount: params.amount,
        country: params.country,
      });

      // Send notifications
      try {
        // Notify sender
        await emailService.sendEmail({
          to: params.senderEmail,
          subject: 'Remittance Sent Successfully - REMIE',
          html: this.getSenderEmailTemplate({
            senderName: params.senderName,
            recipientName: params.recipientName,
            amount: params.amount,
            fee: calculation.fee,
            receiveAmount: calculation.receiveAmount,
            currency: destinationCurrency,
            reference,
            country: params.country,
          }),
        });

        // Notify recipient
        await emailService.sendEmail({
          to: params.recipientEmail,
          subject: 'Money Received - REMIE',
          html: this.getRecipientEmailTemplate({
            recipientName: params.recipientName,
            senderName: params.senderName,
            amount: params.amount,
            reference,
            relationship: params.relationship,
          }),
        });
      } catch (emailError: any) {
        logger.warn('Failed to send remittance emails', {
          error: emailError.message,
        });
      }

      return {
        success: true,
        message: 'Remittance sent successfully',
        payment: finalPayment,
        details: {
          reference,
          sendAmount: calculation.sendAmount,
          fee: calculation.fee,
          total: calculation.total,
          receiveAmount: calculation.receiveAmount,
          currency: destinationCurrency,
          exchangeRate: calculation.rate,
        },
      };
    } catch (error: any) {
      logger.error('Failed to process remittance', {
        error: error.message,
        senderId: params.senderId,
      });
      throw error;
    }
  }

  /**
   * Get remittance history
   */
  async getRemittances(userId: string, type: 'sent' | 'received', page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;

      const whereClause =
        type === 'sent'
          ? { userId, type: PaymentType.INTERNATIONAL_REMITTANCE }
          : { metadata: { path: ['recipientId'], equals: userId } };

      const [remittances, total] = await prisma.$transaction([
        prisma.payment.findMany({
          where: whereClause as any,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.payment.count({ where: whereClause as any }),
      ]);

      return {
        remittances,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error: any) {
      logger.error('Failed to get remittances', {
        error: error.message,
        userId,
      });
      throw error;
    }
  }

  /**
   * Generate temporary password for new recipients
   */
  private generateTemporaryPassword(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Hash password
   */
  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  /**
   * Get country currency
   */
  private getCountryCurrency(country: string): string {
    const currencyMap: Record<string, string> = {
      'United States': 'USD',
      USA: 'USD',
      'United Kingdom': 'GBP',
      UK: 'GBP',
      Canada: 'CAD',
      Germany: 'EUR',
      France: 'EUR',
      Spain: 'EUR',
      Italy: 'EUR',
      'South Africa': 'ZAR',
    };

    return currencyMap[country] || 'USD'; // Default to USD
  }

  /**
   * Sender email template
   */
  private getSenderEmailTemplate(params: {
    senderName: string;
    recipientName: string;
    amount: number;
    fee: number;
    receiveAmount: number;
    currency: string;
    reference: string;
    country: string;
  }): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; }
          .amount { font-size: 32px; font-weight: bold; color: #10b981; text-align: center; margin: 20px 0; }
          .detail-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .footer { text-align: center; color: #6b7280; font-size: 12px; padding: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Remittance Sent Successfully</h1>
          </div>

          <div class="content">
            <h2>Hi ${params.senderName},</h2>
            <p>You have successfully sent money to ${params.recipientName} in ${params.country}.</p>

            <div class="amount">₦${params.amount.toLocaleString('en-NG')}</div>

            <div class="detail-box">
              <p><strong>Recipient:</strong> ${params.recipientName}</p>
              <p><strong>Amount Sent:</strong> ₦${params.amount.toLocaleString('en-NG')}</p>
              <p><strong>Transfer Fee:</strong> ₦${params.fee.toLocaleString('en-NG')}</p>
              <p><strong>Total Charged:</strong> ₦${(params.amount + params.fee).toLocaleString('en-NG')}</p>
              <p><strong>Amount Received:</strong> ${params.currency} ${params.receiveAmount.toFixed(2)}</p>
              <p><strong>Reference:</strong> ${params.reference}</p>
            </div>
          </div>

          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} REMIE. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Recipient email template
   */
  private getRecipientEmailTemplate(params: {
    recipientName: string;
    senderName: string;
    amount: number;
    reference: string;
    relationship: string;
  }): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; }
          .amount { font-size: 32px; font-weight: bold; color: #3b82f6; text-align: center; margin: 20px 0; }
          .footer { text-align: center; color: #6b7280; font-size: 12px; padding: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Money Received!</h1>
          </div>

          <div class="content">
            <h2>Hi ${params.recipientName},</h2>
            <p>You have received money from ${params.senderName} (${params.relationship}).</p>

            <div class="amount">₦${params.amount.toLocaleString('en-NG')}</div>

            <p><strong>Reference:</strong> ${params.reference}</p>
            <p>The money has been credited to your REMIE wallet and is ready to use.</p>

            <center>
              <a href="${process.env.FRONTEND_URL}/dashboard" style="background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0;">View Wallet</a>
            </center>
          </div>

          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} REMIE. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Welcome email template for new recipients
   */
  private getWelcomeEmailTemplate(params: {
    recipientName: string;
    senderName: string;
    resetUrl: string;
  }): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; }
          .button { background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
          .footer { text-align: center; color: #6b7280; font-size: 12px; padding: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to REMIE!</h1>
          </div>

          <div class="content">
            <h2>Hi ${params.recipientName},</h2>
            <p>${params.senderName} has sent you money through REMIE, and we've created an account for you.</p>

            <p>To access your funds and set up your password, please click the button below:</p>

            <center>
              <a href="${params.resetUrl}" class="button">Set Your Password</a>
            </center>

            <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
              This link will expire in 7 days. If you didn't expect this email, you can safely ignore it.
            </p>
          </div>

          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} REMIE. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

export default new RemittanceService();
