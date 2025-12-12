import { Request, Response } from 'express';
import paystackService from '../services/paystack.service';
import walletService from '../services/wallet.service';
import logger from '../utils/logger';
import { PrismaClient, PaymentStatus, PaymentType } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Handle Paystack webhook events
 */
export const handlePaystackWebhook = async (req: Request, res: Response) => {
  try {
    // Verify webhook signature
    const signature = req.headers['x-paystack-signature'] as string;

    if (!signature) {
      logger.warn('Paystack webhook received without signature');
      return res.status(400).json({
        success: false,
        message: 'Missing signature',
      });
    }

    const payload = JSON.stringify(req.body);
    const isValid = paystackService.verifyWebhookSignature(payload, signature);

    if (!isValid) {
      logger.warn('Invalid Paystack webhook signature');
      return res.status(400).json({
        success: false,
        message: 'Invalid signature',
      });
    }

    const event = req.body;

    logger.info('Paystack webhook received', {
      event: event.event,
      reference: event.data?.reference,
    });

    // Handle different event types
    switch (event.event) {
      case 'charge.success':
        await handleChargeSuccess(event.data);
        break;

      case 'transfer.success':
        await handleTransferSuccess(event.data);
        break;

      case 'transfer.failed':
        await handleTransferFailed(event.data);
        break;

      case 'transfer.reversed':
        await handleTransferReversed(event.data);
        break;

      default:
        logger.info('Unhandled Paystack webhook event', { event: event.event });
    }

    // Always respond with 200 to acknowledge receipt
    return res.status(200).json({
      success: true,
      message: 'Webhook processed',
    });
  } catch (error: any) {
    logger.error('Webhook processing error', {
      error: error.message,
      stack: error.stack,
    });

    // Still return 200 to prevent Paystack from retrying
    return res.status(200).json({
      success: false,
      message: 'Webhook processing failed',
    });
  }
};

/**
 * Handle successful charge (payment received)
 */
async function handleChargeSuccess(data: any) {
  try {
    const reference = data.reference;

    logger.info('Processing charge success', { reference });

    // Find payment record
    const payment = await prisma.payment.findUnique({
      where: { reference },
    });

    if (!payment) {
      logger.warn('Payment not found for charge success', { reference });
      return;
    }

    // Check if already processed
    if (payment.status === PaymentStatus.COMPLETED) {
      logger.info('Payment already processed', { reference });
      return;
    }

    // Process based on payment type
    if (payment.type === PaymentType.WALLET_FUNDING) {
      // Verify and complete wallet funding
      await walletService.verifyFunding(reference);
      logger.info('Wallet funding completed via webhook', { reference });
    } else if (payment.type === PaymentType.RRR_PAYMENT) {
      // Update RRR payment status
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.COMPLETED,
          completedAt: new Date(data.paid_at),
          gatewayResponse: data,
        },
      });

      // TODO: Generate and send receipt
      logger.info('RRR payment completed via webhook', { reference });
    } else {
      // Generic payment completion
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.COMPLETED,
          completedAt: new Date(data.paid_at),
          gatewayResponse: data,
        },
      });

      logger.info('Payment completed via webhook', {
        reference,
        type: payment.type,
      });
    }

    // TODO: Send notification to user
    // TODO: Generate receipt if applicable
  } catch (error: any) {
    logger.error('Error handling charge success', {
      reference: data.reference,
      error: error.message,
    });
  }
}

/**
 * Handle successful transfer (withdrawal completed)
 */
async function handleTransferSuccess(data: any) {
  try {
    const reference = data.reference;

    logger.info('Processing transfer success', { reference });

    // Find payment record
    const payment = await prisma.payment.findUnique({
      where: { reference },
      include: { user: true },
    });

    if (!payment) {
      logger.warn('Payment not found for transfer success', { reference });
      return;
    }

    // Check if already processed
    if (payment.status === PaymentStatus.COMPLETED) {
      logger.info('Transfer already processed', { reference });
      return;
    }

    // Get wallet
    const wallet = await prisma.wallet.findUnique({
      where: { userId: payment.userId },
    });

    if (!wallet) {
      logger.error('Wallet not found for transfer', { userId: payment.userId });
      return;
    }

    // Complete withdrawal: deduct from balance and ledger balance
    await prisma.$transaction([
      prisma.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: { decrement: payment.amount },
          ledgerBalance: { decrement: payment.amount },
          lastTransactionAt: new Date(),
        },
      }),
      prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.COMPLETED,
          completedAt: new Date(data.transfer_date || new Date()),
          gatewayResponse: data,
        },
      }),
    ]);

    logger.info('Withdrawal completed via webhook', {
      reference,
      amount: payment.amount,
    });

    // TODO: Send notification to user
  } catch (error: any) {
    logger.error('Error handling transfer success', {
      reference: data.reference,
      error: error.message,
    });
  }
}

/**
 * Handle failed transfer (withdrawal failed)
 */
async function handleTransferFailed(data: any) {
  try {
    const reference = data.reference;

    logger.info('Processing transfer failed', { reference });

    // Find payment record
    const payment = await prisma.payment.findUnique({
      where: { reference },
    });

    if (!payment) {
      logger.warn('Payment not found for transfer failed', { reference });
      return;
    }

    // Get wallet
    const wallet = await prisma.wallet.findUnique({
      where: { userId: payment.userId },
    });

    if (!wallet) {
      logger.error('Wallet not found for failed transfer', {
        userId: payment.userId,
      });
      return;
    }

    // Refund: add back to available balance
    await prisma.$transaction([
      prisma.wallet.update({
        where: { id: wallet.id },
        data: {
          availableBalance: { increment: payment.amount },
          lastTransactionAt: new Date(),
        },
      }),
      prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.FAILED,
          gatewayResponse: data,
        },
      }),
    ]);

    logger.info('Failed withdrawal refunded', {
      reference,
      amount: payment.amount,
    });

    // TODO: Send notification to user about failed withdrawal
  } catch (error: any) {
    logger.error('Error handling transfer failed', {
      reference: data.reference,
      error: error.message,
    });
  }
}

/**
 * Handle reversed transfer (withdrawal reversed)
 */
async function handleTransferReversed(data: any) {
  try {
    const reference = data.reference;

    logger.info('Processing transfer reversal', { reference });

    // Find payment record
    const payment = await prisma.payment.findUnique({
      where: { reference },
    });

    if (!payment) {
      logger.warn('Payment not found for transfer reversal', { reference });
      return;
    }

    // Get wallet
    const wallet = await prisma.wallet.findUnique({
      where: { userId: payment.userId },
    });

    if (!wallet) {
      logger.error('Wallet not found for transfer reversal', {
        userId: payment.userId,
      });
      return;
    }

    // Reverse: add back to all balances
    await prisma.$transaction([
      prisma.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: { increment: payment.amount },
          ledgerBalance: { increment: payment.amount },
          availableBalance: { increment: payment.amount },
          lastTransactionAt: new Date(),
        },
      }),
      prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.REFUNDED,
          gatewayResponse: data,
        },
      }),
    ]);

    logger.info('Transfer reversed and refunded', {
      reference,
      amount: payment.amount,
    });

    // TODO: Send notification to user about reversal
  } catch (error: any) {
    logger.error('Error handling transfer reversal', {
      reference: data.reference,
      error: error.message,
    });
  }
}
