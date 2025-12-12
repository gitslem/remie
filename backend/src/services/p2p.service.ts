import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';
import logger from '../utils/logger';
import { sendEmail } from '../utils/email';

const prisma = new PrismaClient();

interface SendMoneyData {
  senderId: string;
  receiverIdentifier: string; // email, phone, or studentId
  amount: number;
  description?: string;
  category?: string;
}

export class P2PService {
  private readonly transactionFeePercent = 0; // No fee for student P2P
  private readonly maxTransferAmount = 50000; // Max 50k NGN per transfer

  // Generate unique reference
  private generateReference(): string {
    return `P2P-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Calculate fee (if any)
  private calculateFee(amount: number): number {
    return (amount * this.transactionFeePercent) / 100;
  }

  // Find receiver by identifier
  private async findReceiver(identifier: string) {
    const receiver = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { phoneNumber: identifier },
          { studentId: identifier },
        ],
        status: 'ACTIVE',
      },
      include: {
        wallet: true,
      },
    });

    return receiver;
  }

  // Send money to another user
  async sendMoney(data: SendMoneyData) {
    try {
      // Validate amount
      if (data.amount <= 0) {
        throw new AppError('Amount must be greater than 0', 400);
      }

      if (data.amount > this.maxTransferAmount) {
        throw new AppError(`Maximum transfer amount is ₦${this.maxTransferAmount}`, 400);
      }

      // Find receiver
      const receiver = await this.findReceiver(data.receiverIdentifier);
      if (!receiver) {
        throw new AppError('Receiver not found', 404);
      }

      if (!receiver.wallet) {
        throw new AppError('Receiver wallet not found', 404);
      }

      // Check if sender and receiver are the same
      if (data.senderId === receiver.id) {
        throw new AppError('Cannot send money to yourself', 400);
      }

      // Get sender wallet
      const senderWallet = await prisma.wallet.findUnique({
        where: { userId: data.senderId },
      });

      if (!senderWallet) {
        throw new AppError('Sender wallet not found', 404);
      }

      if (senderWallet.isFrozen) {
        throw new AppError('Your wallet is frozen', 403);
      }

      // Calculate fee and total
      const fee = this.calculateFee(data.amount);
      const totalAmount = data.amount + fee;

      // Check balance
      if (Number(senderWallet.availableBalance) < totalAmount) {
        throw new AppError('Insufficient balance', 400);
      }

      const reference = this.generateReference();

      // Perform transfer in transaction
      const transfer = await prisma.$transaction(async (tx: any) => {
        // Debit sender
        await tx.wallet.update({
          where: { userId: data.senderId },
          data: {
            balance: { decrement: totalAmount },
            availableBalance: { decrement: totalAmount },
          },
        });

        // Credit receiver
        await tx.wallet.update({
          where: { userId: receiver.id },
          data: {
            balance: { increment: data.amount },
            availableBalance: { increment: data.amount },
          },
        });

        // Create P2P transfer record
        const p2pTransfer = await tx.p2PTransfer.create({
          data: {
            senderId: data.senderId,
            receiverId: receiver.id,
            reference,
            amount: data.amount,
            fee,
            totalAmount,
            description: data.description,
            category: data.category,
            status: 'COMPLETED',
            completedAt: new Date(),
          },
          include: {
            sender: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            receiver: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        });

        // Create notifications
        await tx.notification.createMany({
          data: [
            {
              userId: data.senderId,
              type: 'P2P_SENT',
              title: 'Money Sent',
              message: `You sent ₦${data.amount} to ${receiver.firstName} ${receiver.lastName}`,
              data: { transferId: p2pTransfer.id, reference },
            },
            {
              userId: receiver.id,
              type: 'P2P_RECEIVED',
              title: 'Money Received',
              message: `You received ₦${data.amount}`,
              data: { transferId: p2pTransfer.id, reference },
            },
          ],
        });

        return p2pTransfer;
      });

      // Send email to receiver
      const sender = transfer.sender;
      await sendEmail({
        to: receiver.email,
        subject: 'Money Received',
        template: 'p2p-received',
        data: {
          firstName: receiver.firstName,
          amount: data.amount,
          senderName: `${sender.firstName} ${sender.lastName}`,
          description: data.description,
        },
      });

      logger.info(`P2P transfer completed: ${reference}`);

      return transfer;
    } catch (error) {
      logger.error('P2P transfer error:', error);
      throw error;
    }
  }

  // Get user's P2P transfers
  async getUserTransfers(
    userId: string,
    type: 'sent' | 'received' | 'all' = 'all',
    page: number = 1,
    limit: number = 20
  ) {
    try {
      const skip = (page - 1) * limit;

      let where: any = {};
      if (type === 'sent') {
        where.senderId = userId;
      } else if (type === 'received') {
        where.receiverId = userId;
      } else {
        where = {
          OR: [{ senderId: userId }, { receiverId: userId }],
        };
      }

      const [transfers, total] = await Promise.all([
        prisma.p2PTransfer.findMany({
          where,
          include: {
            sender: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                studentId: true,
              },
            },
            receiver: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                studentId: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.p2PTransfer.count({ where }),
      ]);

      return {
        transfers,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Get user transfers error:', error);
      throw error;
    }
  }

  // Get transfer details
  async getTransferDetails(reference: string, userId: string) {
    try {
      const transfer = await prisma.p2PTransfer.findFirst({
        where: {
          reference,
          OR: [{ senderId: userId }, { receiverId: userId }],
        },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              studentId: true,
            },
          },
          receiver: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              studentId: true,
            },
          },
        },
      });

      if (!transfer) {
        throw new AppError('Transfer not found', 404);
      }

      return transfer;
    } catch (error) {
      logger.error('Get transfer details error:', error);
      throw error;
    }
  }

  // Search users for P2P transfer
  async searchUsers(query: string, currentUserId: string) {
    try {
      const users = await prisma.user.findMany({
        where: {
          AND: [
            { id: { not: currentUserId } },
            { status: 'ACTIVE' },
            {
              OR: [
                { email: { contains: query, mode: 'insensitive' } },
                { firstName: { contains: query, mode: 'insensitive' } },
                { lastName: { contains: query, mode: 'insensitive' } },
                { studentId: { contains: query, mode: 'insensitive' } },
              ],
            },
          ],
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          studentId: true,
          institution: true,
        },
        take: 10,
      });

      return users;
    } catch (error) {
      logger.error('Search users error:', error);
      throw error;
    }
  }
}

export default new P2PService();
