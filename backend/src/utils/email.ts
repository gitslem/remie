import nodemailer from 'nodemailer';
import logger from './logger';

interface EmailOptions {
  to: string;
  subject: string;
  template: string;
  data: any;
}

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
};

// Email templates
const templates = {
  welcome: (data: any) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #4F46E5;">Welcome to REMIE!</h1>
      <p>Hello ${data.firstName},</p>
      <p>Thank you for joining REMIE - Your digital payment platform for seamless student transactions.</p>
      <p>You can now:</p>
      <ul>
        <li>Pay RRR-linked fees instantly</li>
        <li>Track all your payments in one dashboard</li>
        <li>Send and receive money from fellow students</li>
        <li>Access microloans for urgent school fees</li>
      </ul>
      <p>Get started by completing your profile and verifying your account.</p>
      <p>Best regards,<br/>The REMIE Team</p>
    </div>
  `,

  'password-reset': (data: any) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #4F46E5;">Password Reset Request</h1>
      <p>Hello ${data.firstName},</p>
      <p>We received a request to reset your password. Click the button below to reset it:</p>
      <a href="${data.resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">Reset Password</a>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
      <p>Best regards,<br/>The REMIE Team</p>
    </div>
  `,

  'payment-receipt': (data: any) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #4F46E5;">Payment Receipt</h1>
      <p>Hello ${data.firstName},</p>
      <p>Your payment has been processed successfully!</p>
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Receipt Number:</strong> ${data.receiptNumber}</p>
        <p><strong>Amount:</strong> ₦${data.amount}</p>
        <p><strong>Payment Type:</strong> ${data.paymentType}</p>
        <p><strong>Date:</strong> ${data.date}</p>
      </div>
      <p>You can download your receipt from the attachment or view it in your dashboard.</p>
      <p>Best regards,<br/>The REMIE Team</p>
    </div>
  `,

  'loan-approved': (data: any) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #10B981;">Loan Approved!</h1>
      <p>Hello ${data.firstName},</p>
      <p>Great news! Your loan application has been approved.</p>
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Loan Amount:</strong> ₦${data.amount}</p>
        <p><strong>Interest Rate:</strong> ${data.interestRate}%</p>
        <p><strong>Repayment Due:</strong> ${data.dueDate}</p>
        <p><strong>Total Repayable:</strong> ₦${data.totalRepayable}</p>
      </div>
      <p>The funds will be credited to your wallet shortly.</p>
      <p>Best regards,<br/>The REMIE Team</p>
    </div>
  `,

  'p2p-received': (data: any) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #4F46E5;">Money Received</h1>
      <p>Hello ${data.firstName},</p>
      <p>You have received a payment from ${data.senderName}!</p>
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Amount:</strong> ₦${data.amount}</p>
        <p><strong>From:</strong> ${data.senderName}</p>
        <p><strong>Description:</strong> ${data.description || 'N/A'}</p>
      </div>
      <p>The money is now available in your wallet.</p>
      <p>Best regards,<br/>The REMIE Team</p>
    </div>
  `,
};

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  try {
    const transporter = createTransporter();

    const template = templates[options.template as keyof typeof templates];
    if (!template) {
      throw new Error(`Email template "${options.template}" not found`);
    }

    const html = template(options.data);

    const mailOptions = {
      from: `REMIE <${process.env.EMAIL_FROM}>`,
      to: options.to,
      subject: options.subject,
      html,
    };

    await transporter.sendMail(mailOptions);
    logger.info(`Email sent to ${options.to}: ${options.subject}`);
  } catch (error) {
    logger.error('Email sending failed:', error);
    // Don't throw error to prevent breaking the main flow
  }
};
