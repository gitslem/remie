import axios, { AxiosInstance } from 'axios';
import crypto from 'crypto';
import logger from '../utils/logger';

interface PaystackInitializeResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    domain: string;
    status: string;
    reference: string;
    amount: number;
    message: string | null;
    gateway_response: string;
    paid_at: string;
    created_at: string;
    channel: string;
    currency: string;
    ip_address: string;
    metadata: any;
    customer: {
      id: number;
      first_name: string;
      last_name: string;
      email: string;
      customer_code: string;
      phone: string | null;
      metadata: any;
    };
    authorization: {
      authorization_code: string;
      bin: string;
      last4: string;
      exp_month: string;
      exp_year: string;
      channel: string;
      card_type: string;
      bank: string;
      country_code: string;
      brand: string;
      reusable: boolean;
      signature: string;
    };
  };
}

interface PaystackTransferRecipient {
  status: boolean;
  message: string;
  data: {
    active: boolean;
    createdAt: string;
    currency: string;
    domain: string;
    id: number;
    integration: number;
    name: string;
    recipient_code: string;
    type: string;
    updatedAt: string;
    is_deleted: boolean;
    details: {
      authorization_code: string | null;
      account_number: string;
      account_name: string | null;
      bank_code: string;
      bank_name: string;
    };
  };
}

interface PaystackTransferResponse {
  status: boolean;
  message: string;
  data: {
    integration: number;
    domain: string;
    amount: number;
    currency: string;
    source: string;
    reason: string;
    recipient: number;
    status: string;
    transfer_code: string;
    id: number;
    createdAt: string;
    updatedAt: string;
  };
}

class PaystackService {
  private apiKey: string;
  private baseURL: string;
  private client: AxiosInstance;

  constructor() {
    this.apiKey = process.env.PAYSTACK_SECRET_KEY || '';
    this.baseURL = 'https://api.paystack.co';

    if (!this.apiKey) {
      logger.error('Paystack API key not configured');
    }

    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Initialize a payment transaction
   */
  async initializePayment(params: {
    email: string;
    amount: number; // Amount in kobo (multiply NGN by 100)
    reference?: string;
    callbackUrl?: string;
    metadata?: any;
  }): Promise<PaystackInitializeResponse> {
    try {
      const reference = params.reference || this.generateReference();

      const response = await this.client.post<PaystackInitializeResponse>('/transaction/initialize', {
        email: params.email,
        amount: params.amount,
        reference,
        callback_url: params.callbackUrl || process.env.PAYSTACK_CALLBACK_URL,
        metadata: params.metadata,
      });

      logger.info(`Payment initialized: ${reference}`, { email: params.email });
      return response.data;
    } catch (error: any) {
      logger.error('Failed to initialize Paystack payment', {
        error: error.response?.data || error.message,
      });
      throw new Error(error.response?.data?.message || 'Payment initialization failed');
    }
  }

  /**
   * Verify a payment transaction
   */
  async verifyPayment(reference: string): Promise<PaystackVerifyResponse> {
    try {
      const response = await this.client.get<PaystackVerifyResponse>(
        `/transaction/verify/${reference}`
      );

      logger.info(`Payment verified: ${reference}`, { status: response.data.data.status });
      return response.data;
    } catch (error: any) {
      logger.error('Failed to verify Paystack payment', {
        reference,
        error: error.response?.data || error.message,
      });
      throw new Error(error.response?.data?.message || 'Payment verification failed');
    }
  }

  /**
   * Create a transfer recipient (for withdrawals)
   */
  async createTransferRecipient(params: {
    type: 'nuban' | 'mobile_money' | 'basa';
    name: string;
    accountNumber: string;
    bankCode: string;
    currency?: string;
  }): Promise<PaystackTransferRecipient> {
    try {
      const response = await this.client.post<PaystackTransferRecipient>('/transferrecipient', {
        type: params.type,
        name: params.name,
        account_number: params.accountNumber,
        bank_code: params.bankCode,
        currency: params.currency || 'NGN',
      });

      logger.info(`Transfer recipient created: ${params.accountNumber}`);
      return response.data;
    } catch (error: any) {
      logger.error('Failed to create transfer recipient', {
        error: error.response?.data || error.message,
      });
      throw new Error(error.response?.data?.message || 'Failed to create transfer recipient');
    }
  }

  /**
   * Initiate a transfer (withdrawal)
   */
  async initiateTransfer(params: {
    amount: number; // Amount in kobo
    recipientCode: string;
    reason?: string;
    reference?: string;
  }): Promise<PaystackTransferResponse> {
    try {
      const reference = params.reference || this.generateReference();

      const response = await this.client.post<PaystackTransferResponse>('/transfer', {
        source: 'balance',
        amount: params.amount,
        recipient: params.recipientCode,
        reason: params.reason || 'Wallet withdrawal',
        reference,
      });

      logger.info(`Transfer initiated: ${reference}`, { amount: params.amount });
      return response.data;
    } catch (error: any) {
      logger.error('Failed to initiate transfer', {
        error: error.response?.data || error.message,
      });
      throw new Error(error.response?.data?.message || 'Transfer initiation failed');
    }
  }

  /**
   * Resolve bank account details (verify account number)
   */
  async resolveAccountNumber(params: {
    accountNumber: string;
    bankCode: string;
  }): Promise<{ account_number: string; account_name: string; bank_id: number }> {
    try {
      const response = await this.client.get(
        `/bank/resolve?account_number=${params.accountNumber}&bank_code=${params.bankCode}`
      );

      logger.info(`Account resolved: ${params.accountNumber}`);
      return response.data.data;
    } catch (error: any) {
      logger.error('Failed to resolve account', {
        error: error.response?.data || error.message,
      });
      throw new Error(error.response?.data?.message || 'Account resolution failed');
    }
  }

  /**
   * List all Nigerian banks
   */
  async listBanks(): Promise<Array<{ name: string; code: string; id: number }>> {
    try {
      const response = await this.client.get('/bank?country=nigeria');
      return response.data.data;
    } catch (error: any) {
      logger.error('Failed to fetch banks', {
        error: error.response?.data || error.message,
      });
      throw new Error('Failed to fetch banks list');
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    const hash = crypto
      .createHmac('sha512', process.env.PAYSTACK_WEBHOOK_SECRET || '')
      .update(payload)
      .digest('hex');

    return hash === signature;
  }

  /**
   * Generate a unique payment reference
   */
  generateReference(): string {
    return `REMIE_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`.toUpperCase();
  }

  /**
   * Convert Naira to Kobo (Paystack uses kobo)
   */
  toKobo(amountInNaira: number): number {
    return Math.round(amountInNaira * 100);
  }

  /**
   * Convert Kobo to Naira
   */
  toNaira(amountInKobo: number): number {
    return amountInKobo / 100;
  }
}

export default new PaystackService();
