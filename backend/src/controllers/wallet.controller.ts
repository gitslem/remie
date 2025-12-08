import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import walletService from '../services/wallet.service';
import paystackService from '../services/paystack.service';
import logger from '../utils/logger';

/**
 * Get wallet balance
 */
export const getBalance = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    const balance = await walletService.getBalance(userId);

    res.json({
      success: true,
      data: balance,
    });
  } catch (error: any) {
    logger.error('Get balance error', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get wallet balance',
    });
  }
};

/**
 * Initiate wallet funding
 */
export const fundWallet = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const userId = (req as any).user.userId;
    const email = (req as any).user.email;
    const { amount, callbackUrl, metadata } = req.body;

    const result = await walletService.initiateFunding({
      userId,
      email,
      amount,
      callbackUrl,
      metadata,
    });

    res.json({
      success: true,
      message: 'Payment initialized. Complete payment to fund your wallet.',
      data: result,
    });
  } catch (error: any) {
    logger.error('Fund wallet error', { error: error.message });
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to initiate wallet funding',
    });
  }
};

/**
 * Verify wallet funding
 */
export const verifyFunding = async (req: Request, res: Response) => {
  try {
    const { reference } = req.params;

    const result = await walletService.verifyFunding(reference);

    res.json({
      success: true,
      message: result.message,
      data: {
        payment: result.payment,
        wallet: result.wallet,
      },
    });
  } catch (error: any) {
    logger.error('Verify funding error', { error: error.message });
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to verify payment',
    });
  }
};

/**
 * Withdraw from wallet
 */
export const withdraw = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const userId = (req as any).user.userId;
    const { amount, bankAccount, reason } = req.body;

    const result = await walletService.initiateWithdrawal({
      userId,
      amount,
      bankAccount,
      reason,
    });

    res.json({
      success: true,
      message: result.message,
      data: {
        payment: result.payment,
        wallet: result.wallet,
      },
    });
  } catch (error: any) {
    logger.error('Withdraw error', { error: error.message });
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to initiate withdrawal',
    });
  }
};

/**
 * Get wallet transactions
 */
export const getTransactions = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await walletService.getTransactions(userId, page, limit);

    res.json({
      success: true,
      data: result.transactions,
      pagination: result.pagination,
    });
  } catch (error: any) {
    logger.error('Get transactions error', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get transactions',
    });
  }
};

/**
 * Get transaction by reference
 */
export const getTransaction = async (req: Request, res: Response) => {
  try {
    const { reference } = req.params;

    const transaction = await walletService.getTransaction(reference);

    res.json({
      success: true,
      data: transaction,
    });
  } catch (error: any) {
    logger.error('Get transaction error', { error: error.message });
    res.status(404).json({
      success: false,
      message: error.message || 'Transaction not found',
    });
  }
};

/**
 * List banks
 */
export const listBanks = async (req: Request, res: Response) => {
  try {
    const banks = await paystackService.listBanks();

    res.json({
      success: true,
      data: banks,
    });
  } catch (error: any) {
    logger.error('List banks error', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch banks',
    });
  }
};

/**
 * Resolve account number
 */
export const resolveAccount = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { accountNumber, bankCode } = req.body;

    const accountDetails = await paystackService.resolveAccountNumber({
      accountNumber,
      bankCode,
    });

    res.json({
      success: true,
      data: accountDetails,
    });
  } catch (error: any) {
    logger.error('Resolve account error', { error: error.message });
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to resolve account',
    });
  }
};

/**
 * Validation rules
 */
export const fundWalletValidation = [
  body('amount')
    .isFloat({ min: 100, max: 1000000 })
    .withMessage('Amount must be between ₦100 and ₦1,000,000'),
  body('callbackUrl').optional().isURL().withMessage('Invalid callback URL'),
  body('metadata').optional().isObject().withMessage('Metadata must be an object'),
];

export const withdrawValidation = [
  body('amount').isFloat({ min: 100 }).withMessage('Amount must be at least ₦100'),
  body('bankAccount.accountNumber')
    .isString()
    .isLength({ min: 10, max: 10 })
    .withMessage('Account number must be 10 digits'),
  body('bankAccount.bankCode').isString().withMessage('Bank code is required'),
  body('reason').optional().isString().withMessage('Reason must be a string'),
];

export const resolveAccountValidation = [
  body('accountNumber')
    .isString()
    .isLength({ min: 10, max: 10 })
    .withMessage('Account number must be 10 digits'),
  body('bankCode').isString().withMessage('Bank code is required'),
];
