import * as nodemailer from 'nodemailer';

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

  'password-reset': (data: any) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #4F46E5; margin: 0;">REMIE</h1>
      </div>

      <div style="background-color: #f9fafb; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
        <h2 style="color: #1f2937; margin-top: 0;">Password Reset Request</h2>
        <p style="color: #4b5563; line-height: 1.6;">Hello ${data.firstName},</p>
        <p style="color: #4b5563; line-height: 1.6;">
          We received a request to reset your password for your REMIE account.
          Click the button below to create a new password:
        </p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.resetUrl}"
             style="display: inline-block; background-color: #4F46E5; color: white;
                    padding: 14px 28px; text-decoration: none; border-radius: 8px;
                    font-weight: 600; font-size: 16px;">
            Reset Password
          </a>
        </div>

        <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
          Or copy and paste this link into your browser:<br/>
          <a href="${data.resetUrl}" style="color: #4F46E5; word-break: break-all;">
            ${data.resetUrl}
          </a>
        </p>

        <div style="border-top: 1px solid #e5e7eb; margin-top: 20px; padding-top: 20px;">
          <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0;">
            <strong>Important:</strong> This link will expire in 1 hour for security reasons.
          </p>
          <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
            If you didn't request a password reset, please ignore this email or contact support if you have concerns.
          </p>
        </div>
      </div>

      <div style="text-align: center; color: #9ca3af; font-size: 12px;">
        <p>Best regards,<br/>The REMIE Team</p>
        <p style="margin-top: 20px;">
          © ${new Date().getFullYear()} REMIE. All rights reserved.
        </p>
      </div>
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
