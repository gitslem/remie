import nodemailer, { Transporter } from 'nodemailer';
import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';
import path from 'path';

const prisma = new PrismaClient();

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    path: string;
  }>;
}

class EmailService {
  private transporter: Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    // Verify connection
    this.verifyConnection();
  }

  /**
   * Verify SMTP connection
   */
  private async verifyConnection() {
    try {
      await this.transporter.verify();
      logger.info('SMTP connection verified successfully');
    } catch (error: any) {
      logger.error('SMTP connection failed', {
        error: error.message,
      });
    }
  }

  /**
   * Send email
   */
  async sendEmail(params: SendEmailParams) {
    try {
      const mailOptions = {
        from: `REMIE <${process.env.EMAIL_FROM}>`,
        to: params.to,
        subject: params.subject,
        html: params.html,
        attachments: params.attachments,
      };

      const info = await this.transporter.sendMail(mailOptions);

      logger.info('Email sent successfully', {
        to: params.to,
        subject: params.subject,
        messageId: info.messageId,
      });

      return info;
    } catch (error: any) {
      logger.error('Failed to send email', {
        error: error.message,
        to: params.to,
      });
      throw error;
    }
  }

  /**
   * Send receipt email
   */
  async sendReceipt(params: {
    email: string;
    firstName: string;
    receipt: any;
  }) {
    try {
      const { email, firstName, receipt } = params;

      const html = this.getReceiptEmailTemplate({
        firstName,
        receiptNumber: receipt.receiptNumber,
        amount: receipt.amount,
        date: receipt.createdAt,
        reference: receipt.payment.reference,
      });

      // Get PDF path
      const pdfPath = path.join(process.cwd(), receipt.pdfUrl);

      await this.sendEmail({
        to: email,
        subject: `Payment Receipt - ${receipt.receiptNumber}`,
        html,
        attachments: [
          {
            filename: `Receipt_${receipt.receiptNumber}.pdf`,
            path: pdfPath,
          },
        ],
      });

      // Update receipt as emailed
      await prisma.receipt.update({
        where: { id: receipt.id },
        data: {
          emailSent: true,
          emailSentAt: new Date(),
        },
      });

      logger.info('Receipt email sent', {
        email,
        receiptNumber: receipt.receiptNumber,
      });
    } catch (error: any) {
      logger.error('Failed to send receipt email', {
        error: error.message,
        email: params.email,
      });
      throw error;
    }
  }

  /**
   * Send payment success notification
   */
  async sendPaymentSuccess(params: {
    email: string;
    firstName: string;
    amount: number;
    reference: string;
    paymentType: string;
  }) {
    try {
      const { email, firstName, amount, reference, paymentType } = params;

      const html = this.getPaymentSuccessTemplate({
        firstName,
        amount,
        reference,
        paymentType,
      });

      await this.sendEmail({
        to: email,
        subject: 'Payment Successful - REMIE',
        html,
      });

      logger.info('Payment success email sent', { email, reference });
    } catch (error: any) {
      logger.error('Failed to send payment success email', {
        error: error.message,
        email: params.email,
      });
    }
  }

  /**
   * Send withdrawal notification
   */
  async sendWithdrawalNotification(params: {
    email: string;
    firstName: string;
    amount: number;
    accountNumber: string;
    bankName: string;
  }) {
    try {
      const { email, firstName, amount, accountNumber, bankName } = params;

      const html = this.getWithdrawalTemplate({
        firstName,
        amount,
        accountNumber,
        bankName,
      });

      await this.sendEmail({
        to: email,
        subject: 'Withdrawal Initiated - REMIE',
        html,
      });

      logger.info('Withdrawal notification sent', { email });
    } catch (error: any) {
      logger.error('Failed to send withdrawal notification', {
        error: error.message,
        email: params.email,
      });
    }
  }

  /**
   * Send loan approval notification
   */
  async sendLoanApproval(params: {
    email: string;
    firstName: string;
    amount: number;
    tenure: number;
    interestRate: number;
  }) {
    try {
      const { email, firstName, amount, tenure, interestRate } = params;

      const html = this.getLoanApprovalTemplate({
        firstName,
        amount,
        tenure,
        interestRate,
      });

      await this.sendEmail({
        to: email,
        subject: 'Loan Approved - REMIE',
        html,
      });

      logger.info('Loan approval email sent', { email });
    } catch (error: any) {
      logger.error('Failed to send loan approval email', {
        error: error.message,
        email: params.email,
      });
    }
  }

  /**
   * Receipt email template
   */
  private getReceiptEmailTemplate(params: {
    firstName: string;
    receiptNumber: string;
    amount: number;
    date: Date;
    reference: string;
  }): string {
    const { firstName, receiptNumber, amount, date, reference } = params;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #1a56db 0%, #1e40af 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; }
          .receipt-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e7eb; }
          .amount { font-size: 32px; font-weight: bold; color: #1a56db; text-align: center; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
          .detail-label { color: #6b7280; font-weight: 500; }
          .detail-value { color: #111827; font-weight: 600; }
          .button { background: #1a56db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
          .footer { text-align: center; color: #6b7280; font-size: 12px; padding: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>REMIE</h1>
            <p>Payment Receipt</p>
          </div>

          <div class="content">
            <h2>Hi ${firstName},</h2>
            <p>Thank you for your payment. Your transaction was successful!</p>

            <div class="receipt-box">
              <div class="amount">₦${amount.toLocaleString('en-NG', {
                minimumFractionDigits: 2,
              })}</div>

              <div class="detail-row">
                <span class="detail-label">Receipt Number:</span>
                <span class="detail-value">${receiptNumber}</span>
              </div>

              <div class="detail-row">
                <span class="detail-label">Payment Reference:</span>
                <span class="detail-value">${reference}</span>
              </div>

              <div class="detail-row">
                <span class="detail-label">Date:</span>
                <span class="detail-value">${new Date(date).toLocaleString('en-NG')}</span>
              </div>
            </div>

            <p>Your payment receipt is attached to this email. You can also download it from your dashboard.</p>

            <center>
              <a href="${
                process.env.FRONTEND_URL
              }/dashboard/receipts" class="button">View in Dashboard</a>
            </center>
          </div>

          <div class="footer">
            <p>This is an automated email from REMIE. Please do not reply.</p>
            <p>For support, contact us at ${process.env.SUPPORT_EMAIL}</p>
            <p>&copy; ${new Date().getFullYear()} REMIE. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Payment success email template
   */
  private getPaymentSuccessTemplate(params: {
    firstName: string;
    amount: number;
    reference: string;
    paymentType: string;
  }): string {
    const { firstName, amount, reference, paymentType } = params;

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
          .success-icon { font-size: 48px; text-align: center; margin: 20px 0; }
          .amount { font-size: 32px; font-weight: bold; color: #10b981; text-align: center; margin: 20px 0; }
          .button { background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
          .footer { text-align: center; color: #6b7280; font-size: 12px; padding: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Payment Successful!</h1>
          </div>

          <div class="content">
            <div class="success-icon">✅</div>

            <h2>Hi ${firstName},</h2>
            <p>Your payment has been processed successfully.</p>

            <div class="amount">₦${amount.toLocaleString('en-NG', {
              minimumFractionDigits: 2,
            })}</div>

            <p><strong>Payment Type:</strong> ${paymentType}</p>
            <p><strong>Reference:</strong> ${reference}</p>

            <p>Your receipt will be sent to you shortly in a separate email.</p>

            <center>
              <a href="${
                process.env.FRONTEND_URL
              }/dashboard/transactions" class="button">View Transactions</a>
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
   * Withdrawal email template
   */
  private getWithdrawalTemplate(params: {
    firstName: string;
    amount: number;
    accountNumber: string;
    bankName: string;
  }): string {
    const { firstName, amount, accountNumber, bankName } = params;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; }
          .amount { font-size: 32px; font-weight: bold; color: #f59e0b; text-align: center; margin: 20px 0; }
          .footer { text-align: center; color: #6b7280; font-size: 12px; padding: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Withdrawal Initiated</h1>
          </div>

          <div class="content">
            <h2>Hi ${firstName},</h2>
            <p>Your withdrawal request has been initiated and is being processed.</p>

            <div class="amount">₦${amount.toLocaleString('en-NG', {
              minimumFractionDigits: 2,
            })}</div>

            <p><strong>Bank:</strong> ${bankName}</p>
            <p><strong>Account Number:</strong> ${accountNumber}</p>

            <p>Funds will be credited to your account within 24 hours.</p>
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
   * Loan approval email template
   */
  private getLoanApprovalTemplate(params: {
    firstName: string;
    amount: number;
    tenure: number;
    interestRate: number;
  }): string {
    const { firstName, amount, tenure, interestRate } = params;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; }
          .amount { font-size: 32px; font-weight: bold; color: #8b5cf6; text-align: center; margin: 20px 0; }
          .button { background: #8b5cf6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
          .footer { text-align: center; color: #6b7280; font-size: 12px; padding: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Loan Approved!</h1>
          </div>

          <div class="content">
            <h2>Hi ${firstName},</h2>
            <p>Congratulations! Your loan application has been approved.</p>

            <div class="amount">₦${amount.toLocaleString('en-NG', {
              minimumFractionDigits: 2,
            })}</div>

            <p><strong>Tenure:</strong> ${tenure} days</p>
            <p><strong>Interest Rate:</strong> ${interestRate}% per annum</p>

            <p>The loan amount has been credited to your wallet and is ready to use.</p>

            <center>
              <a href="${process.env.FRONTEND_URL}/dashboard/loans" class="button">View Loan Details</a>
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
}

export default new EmailService();
