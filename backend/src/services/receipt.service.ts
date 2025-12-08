import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import { PrismaClient, Payment, User, RRRPayment } from '@prisma/client';
import logger from '../utils/logger';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

interface GenerateReceiptParams {
  paymentId: string;
  userId: string;
}

class ReceiptService {
  private receiptsDir: string;

  constructor() {
    // Create receipts directory if it doesn't exist
    this.receiptsDir = path.join(process.cwd(), 'receipts');
    if (!fs.existsSync(this.receiptsDir)) {
      fs.mkdirSync(this.receiptsDir, { recursive: true });
    }
  }

  /**
   * Generate a receipt for a payment
   */
  async generateReceipt(params: GenerateReceiptParams) {
    try {
      // Get payment details
      const payment = await prisma.payment.findUnique({
        where: { id: params.paymentId },
        include: {
          user: true,
          rrrPayment: true,
        },
      });

      if (!payment) {
        throw new Error('Payment not found');
      }

      if (payment.userId !== params.userId) {
        throw new Error('Unauthorized to generate receipt for this payment');
      }

      // Check if receipt already exists
      const existingReceipt = await prisma.receipt.findUnique({
        where: { paymentId: payment.id },
      });

      if (existingReceipt) {
        return existingReceipt;
      }

      // Generate receipt number
      const receiptNumber = this.generateReceiptNumber();

      // Generate QR code with receipt verification URL
      const verificationUrl = `${process.env.FRONTEND_URL}/verify-receipt/${receiptNumber}`;
      const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl);

      // Generate PDF
      const pdfPath = await this.generatePDF({
        payment,
        user: payment.user,
        rrrPayment: payment.rrrPayment,
        receiptNumber,
        qrCodeDataUrl,
      });

      // Save receipt record
      const receipt = await prisma.receipt.create({
        data: {
          receiptNumber,
          paymentId: payment.id,
          userId: payment.userId,
          amount: payment.amount,
          pdfUrl: pdfPath,
          qrCode: qrCodeDataUrl,
          metadata: {
            paymentType: payment.type,
            paymentMethod: payment.method,
            paymentReference: payment.reference,
          },
        },
      });

      logger.info('Receipt generated', {
        receiptNumber,
        paymentId: payment.id,
        userId: payment.userId,
      });

      // TODO: Send email with receipt
      // await this.sendReceiptEmail(payment.user.email, receipt);

      return receipt;
    } catch (error: any) {
      logger.error('Failed to generate receipt', {
        error: error.message,
        paymentId: params.paymentId,
      });
      throw error;
    }
  }

  /**
   * Generate PDF receipt
   */
  private async generatePDF(params: {
    payment: Payment & { user: User; rrrPayment: RRRPayment | null };
    user: User;
    rrrPayment: RRRPayment | null;
    receiptNumber: string;
    qrCodeDataUrl: string;
  }): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const { payment, user, rrrPayment, receiptNumber, qrCodeDataUrl } = params;

        // Create PDF document
        const doc = new PDFDocument({
          size: 'A4',
          margins: { top: 50, bottom: 50, left: 50, right: 50 },
        });

        // File path
        const fileName = `receipt_${receiptNumber}.pdf`;
        const filePath = path.join(this.receiptsDir, fileName);
        const writeStream = fs.createWriteStream(filePath);

        doc.pipe(writeStream);

        // Header - REMIE Logo & Title
        doc
          .fontSize(24)
          .font('Helvetica-Bold')
          .fillColor('#1a56db')
          .text('REMIE', { align: 'center' });

        doc
          .fontSize(10)
          .font('Helvetica')
          .fillColor('#6b7280')
          .text('Student Payment & Remittance Platform', { align: 'center' });

        doc.moveDown(0.5);

        // Receipt Title
        doc
          .fontSize(20)
          .font('Helvetica-Bold')
          .fillColor('#111827')
          .text('PAYMENT RECEIPT', { align: 'center' });

        doc.moveDown(1);

        // Horizontal line
        doc
          .strokeColor('#e5e7eb')
          .lineWidth(1)
          .moveTo(50, doc.y)
          .lineTo(545, doc.y)
          .stroke();

        doc.moveDown(1);

        // Receipt Details - Two Columns
        const leftColumn = 50;
        const rightColumn = 300;
        let currentY = doc.y;

        // Left Column
        doc.fontSize(10).fillColor('#6b7280');

        doc.text('Receipt Number:', leftColumn, currentY);
        doc
          .font('Helvetica-Bold')
          .fillColor('#111827')
          .text(receiptNumber, leftColumn, currentY + 15);

        currentY += 40;
        doc.font('Helvetica').fillColor('#6b7280');
        doc.text('Payment Reference:', leftColumn, currentY);
        doc
          .font('Helvetica-Bold')
          .fillColor('#111827')
          .text(payment.reference, leftColumn, currentY + 15);

        currentY += 40;
        doc.font('Helvetica').fillColor('#6b7280');
        doc.text('Date:', leftColumn, currentY);
        doc
          .font('Helvetica-Bold')
          .fillColor('#111827')
          .text(
            payment.completedAt
              ? new Date(payment.completedAt).toLocaleDateString('en-NG', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })
              : 'N/A',
            leftColumn,
            currentY + 15
          );

        // Right Column
        currentY = doc.y - 120; // Reset to top of left column

        doc.font('Helvetica').fillColor('#6b7280');
        doc.text('Customer Name:', rightColumn, currentY);
        doc
          .font('Helvetica-Bold')
          .fillColor('#111827')
          .text(`${user.firstName} ${user.lastName}`, rightColumn, currentY + 15);

        currentY += 40;
        doc.font('Helvetica').fillColor('#6b7280');
        doc.text('Email:', rightColumn, currentY);
        doc
          .font('Helvetica-Bold')
          .fillColor('#111827')
          .text(user.email, rightColumn, currentY + 15);

        currentY += 40;
        doc.font('Helvetica').fillColor('#6b7280');
        doc.text('Phone:', rightColumn, currentY);
        doc
          .font('Helvetica-Bold')
          .fillColor('#111827')
          .text(user.phoneNumber || 'N/A', rightColumn, currentY + 15);

        doc.moveDown(3);

        // Payment Details Section
        doc
          .fontSize(14)
          .font('Helvetica-Bold')
          .fillColor('#111827')
          .text('Payment Details');

        doc.moveDown(0.5);

        // Table Header
        const tableTop = doc.y;
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#6b7280');

        doc.text('Description', leftColumn, tableTop);
        doc.text('Amount', rightColumn + 150, tableTop, { width: 100, align: 'right' });

        doc.moveDown(0.5);

        // Horizontal line
        doc
          .strokeColor('#e5e7eb')
          .lineWidth(1)
          .moveTo(50, doc.y)
          .lineTo(545, doc.y)
          .stroke();

        doc.moveDown(0.5);

        // Table Content
        const itemY = doc.y;
        doc.font('Helvetica').fillColor('#111827');

        let description = this.getPaymentDescription(payment, rrrPayment);

        doc.text(description, leftColumn, itemY, { width: 400 });
        doc.text(
          `₦${payment.amount.toLocaleString('en-NG', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`,
          rightColumn + 150,
          itemY,
          { width: 100, align: 'right' }
        );

        doc.moveDown(1);

        // Horizontal line
        doc
          .strokeColor('#e5e7eb')
          .lineWidth(1)
          .moveTo(50, doc.y)
          .lineTo(545, doc.y)
          .stroke();

        doc.moveDown(0.5);

        // Total
        const totalY = doc.y;
        doc.fontSize(12).font('Helvetica-Bold').fillColor('#111827');

        doc.text('Total Paid:', leftColumn, totalY);
        doc.text(
          `₦${payment.amount.toLocaleString('en-NG', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`,
          rightColumn + 150,
          totalY,
          { width: 100, align: 'right' }
        );

        doc.moveDown(2);

        // Payment Method
        doc.fontSize(10).font('Helvetica').fillColor('#6b7280');
        doc.text(`Payment Method: ${payment.method}`, leftColumn);
        doc.text(`Status: ${payment.status}`, leftColumn);

        doc.moveDown(2);

        // QR Code
        doc.fontSize(10).fillColor('#6b7280').text('Scan to verify:', { align: 'center' });

        // Convert QR code data URL to buffer
        const qrBuffer = Buffer.from(qrCodeDataUrl.split(',')[1], 'base64');
        doc.image(qrBuffer, 230, doc.y + 5, { width: 130, height: 130 });

        doc.moveDown(10);

        // Footer
        doc
          .fontSize(8)
          .fillColor('#9ca3af')
          .text(
            'This is a computer-generated receipt and does not require a signature.',
            { align: 'center' }
          );

        doc.text(
          `Generated on ${new Date().toLocaleString('en-NG')}`,
          { align: 'center' }
        );

        doc.moveDown(0.5);

        doc.text('For inquiries, contact support@remie.app | www.remie.app', {
          align: 'center',
        });

        // Finalize PDF
        doc.end();

        writeStream.on('finish', () => {
          resolve(`/receipts/${fileName}`);
        });

        writeStream.on('error', (error) => {
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Get payment description based on type
   */
  private getPaymentDescription(payment: Payment, rrrPayment: RRRPayment | null): string {
    switch (payment.type) {
      case 'WALLET_FUNDING':
        return 'Wallet Top-up';

      case 'WITHDRAWAL':
        return 'Wallet Withdrawal';

      case 'RRR_PAYMENT':
        if (rrrPayment) {
          return `${rrrPayment.paymentType} - ${rrrPayment.institution || 'Institution'}`;
        }
        return 'RRR Payment';

      case 'P2P_TRANSFER':
        return 'Peer-to-Peer Transfer';

      case 'LOAN_REPAYMENT':
        return 'Loan Repayment';

      case 'SCHOOL_FEE':
        return 'School Fee Payment';

      case 'ACCEPTANCE_FEE':
        return 'Acceptance Fee Payment';

      case 'HOSTEL_FEE':
        return 'Hostel Fee Payment';

      case 'EXAM_FEE':
        return 'Exam Fee Payment (JAMB/WAEC/NECO)';

      case 'GOVERNMENT':
        return 'Government Payment (NIN/JAMB/etc.)';

      default:
        return payment.type.replace(/_/g, ' ');
    }
  }

  /**
   * Generate unique receipt number
   */
  private generateReceiptNumber(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();

    return `RCP-${year}${month}-${random}`;
  }

  /**
   * Get receipt by number
   */
  async getReceiptByNumber(receiptNumber: string) {
    try {
      const receipt = await prisma.receipt.findUnique({
        where: { receiptNumber },
        include: {
          payment: {
            include: {
              user: true,
              rrrPayment: true,
            },
          },
        },
      });

      if (!receipt) {
        throw new Error('Receipt not found');
      }

      // Increment download count
      await prisma.receipt.update({
        where: { id: receipt.id },
        data: {
          downloadCount: { increment: 1 },
        },
      });

      return receipt;
    } catch (error: any) {
      logger.error('Failed to get receipt', {
        error: error.message,
        receiptNumber,
      });
      throw error;
    }
  }

  /**
   * Get user receipts
   */
  async getUserReceipts(userId: string, page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;

      const [receipts, total] = await prisma.$transaction([
        prisma.receipt.findMany({
          where: { userId },
          include: {
            payment: true,
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.receipt.count({ where: { userId } }),
      ]);

      return {
        receipts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error: any) {
      logger.error('Failed to get user receipts', {
        error: error.message,
        userId,
      });
      throw error;
    }
  }
}

export default new ReceiptService();
