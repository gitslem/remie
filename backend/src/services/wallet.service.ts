import { PrismaClient, PaymentMethod, PaymentStatus, PaymentType } from '@prisma/client';
import paystackService from './paystack.service';
import receiptService from './receipt.service';
import emailService from './email.service';
import logger from '../utils/logger';

const prisma = new PrismaClient();

interface FundWalletParams {
  userId: string;
  amount: number;
  email: string;
  callbackUrl?: string;
  metadata?: any;
}

interface WithdrawParams {
  userId: string;
  amount: number;
  bankAccount: {
    accountNumber: string;
    bankCode: string;
    accountName?: string;
  };
  reason?: string;
}

class WalletService {
  /**
   * Reset spending limits if needed
   */
  private async resetSpendingLimitsIfNeeded(wallet: any) {
    const now = new Date();
    const updates: any = {};

    // Check if daily reset is needed (last reset was yesterday or earlier)
    const lastDailyReset = new Date(wallet.lastDailyReset);
    lastDailyReset.setHours(0, 0, 0, 0);
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    if (lastDailyReset < today) {
      updates.dailyFundingSpent = 0;
      updates.lastDailyReset = now;
    }

    // Check if monthly reset is needed (last reset was last month or earlier)
    const lastMonthlyReset = new Date(wallet.lastMonthlyReset);
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const lastResetMonth = lastMonthlyReset.getMonth();
    const lastResetYear = lastMonthlyReset.getFullYear();

    if (lastResetYear < currentYear || (lastResetYear === currentYear && lastResetMonth < currentMonth)) {
      updates.monthlyFundingSpent = 0;
      updates.lastMonthlyReset = now;
    }

    // Apply updates if needed
    if (Object.keys(updates).length > 0) {
      await prisma.wallet.update({
        where: { id: wallet.id },
        data: updates,
      });

      // Return updated values
      return {
        ...wallet,
        ...updates,
      };
    }

    return wallet;
  }

  /**
   * Initialize wallet funding via Paystack
   */
  async initiateFunding(params: FundWalletParams) {
    try {
      // Get user and wallet
      const user = await prisma.user.findUnique({
        where: { id: params.userId },
        include: { wallet: true },
      });

      if (!user) {
        throw new Error('User not found');
      }

      if (!user.wallet) {
        throw new Error('Wallet not found');
      }

      // Check if user is approved
      if (user.status === 'PENDING_APPROVAL') {
        throw new Error('Your account is pending admin approval. Please wait for approval before funding your wallet.');
      }

      if (user.status !== 'ACTIVE' && user.status !== 'PENDING_VERIFICATION') {
        throw new Error('Your account is not active. Please contact support.');
      }

      let wallet = user.wallet;

      if (wallet.isFrozen) {
        throw new Error('Wallet is frozen. Please contact support.');
      }

      // Reset spending limits if needed
      wallet = await this.resetSpendingLimitsIfNeeded(wallet);

      // Validate amount
      if (params.amount < 100) {
        throw new Error('Minimum funding amount is ₦100');
      }

      if (params.amount > 1000000) {
        throw new Error('Maximum funding amount is ₦1,000,000');
      }

      // Check daily funding limit
      const dailySpent = parseFloat(wallet.dailyFundingSpent.toString());
      const dailyLimit = parseFloat(wallet.dailyLimit.toString());

      if (dailySpent + params.amount > dailyLimit) {
        const remaining = dailyLimit - dailySpent;
        throw new Error(
          `Daily funding limit exceeded. You can fund ₦${remaining.toFixed(2)} more today. Limit resets tomorrow.`
        );
      }

      // Check monthly funding limit
      const monthlySpent = parseFloat(wallet.monthlyFundingSpent.toString());
      const monthlyLimit = parseFloat(wallet.monthlyLimit.toString());

      if (monthlySpent + params.amount > monthlyLimit) {
        const remaining = monthlyLimit - monthlySpent;
        throw new Error(
          `Monthly funding limit exceeded. You can fund ₦${remaining.toFixed(2)} more this month.`
        );
      }

      // Generate reference
      const reference = paystackService.generateReference();

      // Create payment record
      const payment = await prisma.payment.create({
        data: {
          userId: params.userId,
          amount: params.amount,
          type: PaymentType.WALLET_FUNDING,
          method: PaymentMethod.CARD,
          status: PaymentStatus.PENDING,
          reference,
          metadata: {
            ...params.metadata,
            walletId: wallet.id,
          },
        },
      });

      // Initialize Paystack payment
      const paystackResponse = await paystackService.initializePayment({
        email: params.email,
        amount: paystackService.toKobo(params.amount),
        reference,
        callbackUrl: params.callbackUrl,
        metadata: {
          paymentId: payment.id,
          userId: params.userId,
          type: 'wallet_funding',
          ...params.metadata,
        },
      });

      // Update payment with authorization URL
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          gatewayResponse: paystackResponse,
        },
      });

      logger.info(`Wallet funding initiated for user ${params.userId}`, {
        reference,
        amount: params.amount,
      });

      return {
        success: true,
        payment,
        authorizationUrl: paystackResponse.data.authorization_url,
        accessCode: paystackResponse.data.access_code,
        reference: paystackResponse.data.reference,
      };
    } catch (error: any) {
      logger.error('Failed to initiate wallet funding', {
        userId: params.userId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Verify and complete wallet funding
   */
  async verifyFunding(reference: string) {
    try {
      // Get payment record
      const payment = await prisma.payment.findUnique({
        where: { reference },
        include: { user: true },
      });

      if (!payment) {
        throw new Error('Payment not found');
      }

      if (payment.status === PaymentStatus.COMPLETED) {
        return {
          success: true,
          message: 'Payment already processed',
          payment,
        };
      }

      // Verify with Paystack
      const verification = await paystackService.verifyPayment(reference);

      if (!verification.status || verification.data.status !== 'success') {
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.FAILED,
            gatewayResponse: verification,
          },
        });

        throw new Error('Payment verification failed');
      }

      // Get wallet
      const wallet = await prisma.wallet.findUnique({
        where: { userId: payment.userId },
      });

      if (!wallet) {
        throw new Error('Wallet not found');
      }

      // Calculate actual amount received (Paystack may deduct fees)
      const amountPaid = paystackService.toNaira(verification.data.amount);
      const processingFee = 0; // Paystack charges the customer directly

      // Update wallet balance, spending trackers, and payment status in a transaction
      const [updatedWallet, updatedPayment] = await prisma.$transaction([
        prisma.wallet.update({
          where: { id: wallet.id },
          data: {
            balance: { increment: amountPaid },
            ledgerBalance: { increment: amountPaid },
            availableBalance: { increment: amountPaid },
            dailyFundingSpent: { increment: amountPaid },
            monthlyFundingSpent: { increment: amountPaid },
            lastTransactionAt: new Date(),
          },
        }),
        prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.COMPLETED,
            processingFee,
            gatewayResponse: verification,
            completedAt: new Date(verification.data.paid_at),
          },
        }),
      ]);

      logger.info(`Wallet funded successfully for user ${payment.userId}`, {
        reference,
        amount: amountPaid,
        newBalance: updatedWallet.balance,
      });

      // Generate receipt and send email
      try {
        const receipt = await receiptService.generateReceipt({
          paymentId: updatedPayment.id,
          userId: payment.userId,
        });

        if (receipt && payment.user) {
          await emailService.sendReceipt({
            email: payment.user.email,
            firstName: payment.user.firstName,
            receipt: { ...receipt, payment: updatedPayment },
          });

          // Send payment success notification
          await emailService.sendPaymentSuccess({
            email: payment.user.email,
            firstName: payment.user.firstName,
            amount: amountPaid,
            reference,
            paymentType: 'Wallet Funding',
          });
        }
      } catch (notificationError: any) {
        logger.warn('Failed to send receipt/notification', {
          error: notificationError.message,
          reference,
        });
      }

      return {
        success: true,
        message: 'Wallet funded successfully',
        payment: updatedPayment,
        wallet: updatedWallet,
      };
    } catch (error: any) {
      logger.error('Failed to verify wallet funding', {
        reference,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Initiate wallet withdrawal
   */
  async initiateWithdrawal(params: WithdrawParams) {
    try {
      const wallet = await prisma.wallet.findUnique({
        where: { userId: params.userId },
        include: { user: true },
      });

      if (!wallet) {
        throw new Error('Wallet not found');
      }

      if (wallet.isFrozen) {
        throw new Error('Wallet is frozen. Please contact support.');
      }

      // Validate amount
      if (params.amount < 100) {
        throw new Error('Minimum withdrawal amount is ₦100');
      }

      if (params.amount > wallet.availableBalance) {
        throw new Error('Insufficient balance');
      }

      // Check daily withdrawal limit
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayWithdrawals = await prisma.payment.aggregate({
        where: {
          userId: params.userId,
          type: PaymentType.WITHDRAWAL,
          status: PaymentStatus.COMPLETED,
          createdAt: { gte: today },
        },
        _sum: { amount: true },
      });

      const totalWithdrawnToday = todayWithdrawals._sum.amount || 0;

      if (totalWithdrawnToday + params.amount > wallet.dailyLimit) {
        throw new Error(
          `Daily withdrawal limit exceeded. You can withdraw ₦${
            wallet.dailyLimit - totalWithdrawnToday
          } more today.`
        );
      }

      // Resolve account number to verify it exists
      let accountName = params.bankAccount.accountName;

      if (!accountName) {
        const accountDetails = await paystackService.resolveAccountNumber({
          accountNumber: params.bankAccount.accountNumber,
          bankCode: params.bankAccount.bankCode,
        });
        accountName = accountDetails.account_name;
      }

      // Create transfer recipient on Paystack
      const recipient = await paystackService.createTransferRecipient({
        type: 'nuban',
        name: accountName,
        accountNumber: params.bankAccount.accountNumber,
        bankCode: params.bankAccount.bankCode,
      });

      // Generate reference
      const reference = paystackService.generateReference();

      // Initiate transfer
      const transfer = await paystackService.initiateTransfer({
        amount: paystackService.toKobo(params.amount),
        recipientCode: recipient.data.recipient_code,
        reason: params.reason || 'Wallet withdrawal',
        reference,
      });

      // Deduct from available balance immediately (pending status)
      const [updatedWallet, payment] = await prisma.$transaction([
        prisma.wallet.update({
          where: { id: wallet.id },
          data: {
            availableBalance: { decrement: params.amount },
            lastTransactionAt: new Date(),
          },
        }),
        prisma.payment.create({
          data: {
            userId: params.userId,
            amount: params.amount,
            type: PaymentType.WITHDRAWAL,
            method: PaymentMethod.BANK_TRANSFER,
            status: PaymentStatus.PROCESSING,
            reference,
            metadata: {
              recipientCode: recipient.data.recipient_code,
              accountNumber: params.bankAccount.accountNumber,
              accountName,
              bankCode: params.bankAccount.bankCode,
            },
            gatewayResponse: transfer,
          },
        }),
      ]);

      logger.info(`Withdrawal initiated for user ${params.userId}`, {
        reference,
        amount: params.amount,
        accountNumber: params.bankAccount.accountNumber,
      });

      // TODO: Send notification to user

      return {
        success: true,
        message: 'Withdrawal initiated. Funds will be sent to your account shortly.',
        payment,
        wallet: updatedWallet,
      };
    } catch (error: any) {
      logger.error('Failed to initiate withdrawal', {
        userId: params.userId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get wallet balance
   */
  async getBalance(userId: string) {
    try {
      const wallet = await prisma.wallet.findUnique({
        where: { userId },
      });

      if (!wallet) {
        throw new Error('Wallet not found');
      }

      return {
        balance: wallet.balance,
        availableBalance: wallet.availableBalance,
        ledgerBalance: wallet.ledgerBalance,
        usdtBalance: wallet.usdtBalance,
        usdcBalance: wallet.usdcBalance,
        isFrozen: wallet.isFrozen,
        dailyLimit: wallet.dailyLimit,
        monthlyLimit: wallet.monthlyLimit,
      };
    } catch (error: any) {
      logger.error('Failed to get wallet balance', {
        userId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get transaction history
   */
  async getTransactions(userId: string, page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;

      const [transactions, total] = await prisma.$transaction([
        prisma.payment.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.payment.count({ where: { userId } }),
      ]);

      return {
        transactions,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error: any) {
      logger.error('Failed to get transactions', {
        userId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get transaction by reference
   */
  async getTransaction(reference: string) {
    try {
      const transaction = await prisma.payment.findUnique({
        where: { reference },
        include: { user: true },
      });

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      return transaction;
    } catch (error: any) {
      logger.error('Failed to get transaction', {
        reference,
        error: error.message,
      });
      throw error;
    }
  }
}

export default new WalletService();
