import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import crypto from 'crypto';
import { AppError } from '../middleware/errorHandler';
import logger from '../utils/logger';
import { sendEmail } from '../utils/email';

const prisma = new PrismaClient();

interface GenerateRRRData {
  userId: string;
  amount: number;
  institutionCode: string;
  institutionName: string;
  serviceTypeId: string;
  payerName: string;
  payerEmail: string;
  payerPhone: string;
  description: string;
}

export class RRRService {
  private readonly baseUrl: string;
  private readonly merchantId: string;
  private readonly apiKey: string;
  private readonly serviceTypeId: string;

  constructor() {
    this.baseUrl = process.env.REMITA_BASE_URL || 'https://remitademo.net';
    this.merchantId = process.env.REMITA_MERCHANT_ID || '';
    this.apiKey = process.env.REMITA_API_KEY || '';
    this.serviceTypeId = process.env.REMITA_SERVICE_TYPE_ID || '';
  }

  // Generate API hash for Remita
  private generateHash(data: string): string {
    return crypto
      .createHmac('sha512', this.apiKey)
      .update(data)
      .digest('hex');
  }

  // Generate RRR code
  async generateRRR(data: GenerateRRRData) {
    try {
      const orderId = `REMIE-${Date.now()}`;

      // Create payment record first
      const payment = await prisma.payment.create({
        data: {
          userId: data.userId,
          reference: orderId,
          amount: data.amount,
          currency: 'NGN',
          type: 'SCHOOL_FEE',
          method: 'RRR',
          status: 'PENDING',
          recipientName: data.institutionName,
          institutionName: data.institutionName,
          description: data.description,
          totalAmount: data.amount,
        },
      });

      // Prepare Remita request
      const hashString = `${this.merchantId}${data.serviceTypeId}${orderId}${data.amount}${this.apiKey}`;
      const hash = this.generateHash(hashString);

      const requestData = {
        serviceTypeId: data.serviceTypeId,
        amount: data.amount,
        orderId,
        payerName: data.payerName,
        payerEmail: data.payerEmail,
        payerPhone: data.payerPhone,
        description: data.description,
      };

      // Call Remita API to generate RRR
      const response = await axios.post(
        `${this.baseUrl}/exapp/api/v1/send/api/echannelsvc/merchant/api/paymentinit`,
        requestData,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `remitaConsumerKey=${this.merchantId},remitaConsumerToken=${hash}`,
          },
        }
      );

      if (response.data.statuscode !== '025') {
        throw new AppError('Failed to generate RRR', 500);
      }

      const rrr = response.data.RRR;

      // Create RRR payment record
      const rrrPayment = await prisma.rRRPayment.create({
        data: {
          userId: data.userId,
          paymentId: payment.id,
          rrr,
          orderId,
          amount: data.amount,
          institutionCode: data.institutionCode,
          institutionName: data.institutionName,
          serviceTypeId: data.serviceTypeId,
          payerName: data.payerName,
          payerEmail: data.payerEmail,
          payerPhone: data.payerPhone,
          status: 'INITIATED',
          expiresAt: new Date(Date.now() + 86400000 * 7), // 7 days
        },
      });

      logger.info(`RRR generated: ${rrr} for user ${data.userId}`);

      // Send email with RRR details
      await sendEmail({
        to: data.payerEmail,
        subject: 'RRR Code Generated',
        template: 'rrr-generated',
        data: {
          firstName: data.payerName.split(' ')[0],
          rrr,
          amount: data.amount,
          institutionName: data.institutionName,
          description: data.description,
        },
      });

      return {
        rrr,
        orderId,
        amount: data.amount,
        paymentId: payment.id,
        expiresAt: rrrPayment.expiresAt,
      };
    } catch (error) {
      logger.error('RRR generation error:', error);
      throw error;
    }
  }

  // Verify RRR payment status
  async verifyRRR(rrr: string) {
    try {
      const rrrPayment = await prisma.rRRPayment.findUnique({
        where: { rrr },
        include: { payment: true },
      });

      if (!rrrPayment) {
        throw new AppError('RRR not found', 404);
      }

      // Call Remita to verify payment status
      const hashString = `${rrr}${this.apiKey}${this.merchantId}`;
      const hash = this.generateHash(hashString);

      const response = await axios.get(
        `${this.baseUrl}/exapp/api/v1/send/api/echannelsvc/${this.merchantId}/${rrr}/${hash}/status.reg`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const paymentStatus = response.data.status;

      // Update payment status
      if (paymentStatus === '00' || paymentStatus === '01') {
        // Payment successful
        await prisma.$transaction([
          prisma.rRRPayment.update({
            where: { rrr },
            data: {
              status: 'PAID',
              paidAt: new Date(),
              remitaReference: response.data.transactionRef,
            },
          }),
          prisma.payment.update({
            where: { id: rrrPayment.paymentId },
            data: {
              status: 'COMPLETED',
              completedAt: new Date(),
            },
          }),
        ]);

        // Generate receipt
        // This will be handled by receipt service

        logger.info(`RRR ${rrr} payment verified and completed`);

        return {
          status: 'PAID',
          message: 'Payment successful',
          data: response.data,
        };
      } else {
        return {
          status: 'PENDING',
          message: 'Payment pending',
          data: response.data,
        };
      }
    } catch (error) {
      logger.error('RRR verification error:', error);
      throw error;
    }
  }

  // Get RRR payment details
  async getRRRDetails(rrr: string, userId: string) {
    try {
      const rrrPayment = await prisma.rRRPayment.findFirst({
        where: {
          rrr,
          userId,
        },
        include: {
          payment: true,
        },
      });

      if (!rrrPayment) {
        throw new AppError('RRR not found', 404);
      }

      return rrrPayment;
    } catch (error) {
      logger.error('Get RRR details error:', error);
      throw error;
    }
  }

  // Get user's RRR payments
  async getUserRRRPayments(userId: string, page: number = 1, limit: number = 20) {
    try {
      const skip = (page - 1) * limit;

      const [payments, total] = await Promise.all([
        prisma.rRRPayment.findMany({
          where: { userId },
          include: { payment: true },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.rRRPayment.count({ where: { userId } }),
      ]);

      return {
        payments,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Get user RRR payments error:', error);
      throw error;
    }
  }
}

export default new RRRService();
