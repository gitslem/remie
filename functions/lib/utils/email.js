"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = void 0;
const admin = __importStar(require("firebase-admin"));
const nodemailer = __importStar(require("nodemailer"));
const db = admin.firestore();
// Email templates
const templates = {
    welcome: (data) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #4F46E5;">Welcome to REMIE!</h1>
      <p>Hello ${data.firstName},</p>
      <p>Thank you for joining REMIE - Your digital payment platform for seamless student transactions.</p>
      <p>Best regards,<br/>The REMIE Team</p>
    </div>
  `,
    notification: (data) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #4F46E5;">Notification</h1>
      <p>Hello ${data.firstName},</p>
      <p>${data.message}</p>
      <p>Best regards,<br/>The REMIE Team</p>
    </div>
  `,
    'loan-approved': (data) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #10B981;">Loan Approved!</h1>
      <p>Hello ${data.firstName},</p>
      <p>Your loan of ₦${data.amount} has been approved and disbursed.</p>
      <p>Best regards,<br/>The REMIE Team</p>
    </div>
  `,
    'p2p-received': (data) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #4F46E5;">Money Received</h1>
      <p>Hello ${data.firstName},</p>
      <p>You received ₦${data.amount} from ${data.senderName}.</p>
      <p>Best regards,<br/>The REMIE Team</p>
    </div>
  `,
};
const sendEmail = async (options) => {
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
        const template = templates[options.template];
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
    }
    catch (error) {
        console.error('Email sending failed:', error);
    }
};
exports.sendEmail = sendEmail;
//# sourceMappingURL=email.js.map