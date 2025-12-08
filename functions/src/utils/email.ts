import * as admin from 'firebase-admin';
import * as nodemailer from 'nodemailer';

const db = admin.firestore();

interface EmailOptions {
  to: string;
  subject: string;
  template: string;
  data: any;
}

// Email templates
const templates = {
  welcome: (data: any) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #4F46E5;">Welcome to REMIE!</h1>
      <p>Hello ${data.firstName},</p>
      <p>Thank you for joining REMIE - Your digital payment platform for seamless student transactions.</p>
      <p>Best regards,<br/>The REMIE Team</p>
    </div>
  `,

  notification: (data: any) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #4F46E5;">Notification</h1>
      <p>Hello ${data.firstName},</p>
      <p>${data.message}</p>
      <p>Best regards,<br/>The REMIE Team</p>
    </div>
  `,

  'loan-approved': (data: any) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #10B981;">Loan Approved!</h1>
      <p>Hello ${data.firstName},</p>
      <p>Your loan of ₦${data.amount} has been approved and disbursed.</p>
      <p>Best regards,<br/>The REMIE Team</p>
    </div>
  `,

  'p2p-received': (data: any) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #4F46E5;">Money Received</h1>
      <p>Hello ${data.firstName},</p>
      <p>You received ₦${data.amount} from ${data.senderName}.</p>
      <p>Best regards,<br/>The REMIE Team</p>
    </div>
  `,
};

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  try {
    // Get email config from environment
    const config = {
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    };

    const transporter = nodemailer.createTransport(config);

    const template = templates[options.template as keyof typeof templates];
    if (!template) {
      console.error(`Email template "${options.template}" not found`);
      return;
    }

    const html = template(options.data);

    await transporter.sendMail({
      from: `REMIE <${config.auth.user}>`,
      to: options.to,
      subject: options.subject,
      html,
    });

    console.log(`Email sent to ${options.to}: ${options.subject}`);
  } catch (error) {
    console.error('Email sending failed:', error);
  }
};
