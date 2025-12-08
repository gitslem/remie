import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import remittanceService from '../services/remittance.service';
import logger from '../utils/logger';

/**
 * Get exchange rates
 */
export const getExchangeRates = async (req: Request, res: Response) => {
  try {
    const rates = [
      { from: 'NGN', to: 'USD', rate: 0.0013, fee: 2.5 },
      { from: 'NGN', to: 'GBP', rate: 0.001, fee: 2.5 },
      { from: 'NGN', to: 'EUR', rate: 0.0012, fee: 2.5 },
      { from: 'NGN', to: 'CAD', rate: 0.0017, fee: 2.5 },
      { from: 'NGN', to: 'ZAR', rate: 0.024, fee: 1.5 },
    ];

    res.json({
      success: true,
      data: rates,
    });
  } catch (error: any) {
    logger.error('Get exchange rates error', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch exchange rates',
    });
  }
};

/**
 * Calculate remittance
 */
export const calculateRemittance = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { amount, fromCurrency, toCurrency } = req.body;

    const calculation = remittanceService.calculateRemittance({
      amount,
      fromCurrency,
      toCurrency,
    });

    if (!calculation) {
      return res.status(400).json({
        success: false,
        message: `Exchange rate for ${fromCurrency} to ${toCurrency} not available`,
      });
    }

    res.json({
      success: true,
      data: calculation,
    });
  } catch (error: any) {
    logger.error('Calculate remittance error', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message || 'Calculation failed',
    });
  }
};

/**
 * Send remittance
 */
export const sendRemittance = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const userId = (req as any).user.userId;
    const user = (req as any).user;

    const {
      recipientEmail,
      recipientPhone,
      recipientName,
      amount,
      purpose,
      relationship,
      country,
    } = req.body;

    const result = await remittanceService.initiateRemittance({
      senderId: userId,
      recipientEmail,
      recipientPhone,
      recipientName,
      amount,
      purpose,
      senderName: `${user.firstName} ${user.lastName}`,
      senderEmail: user.email,
      relationship,
      country,
    });

    res.json(result);
  } catch (error: any) {
    logger.error('Send remittance error', { error: error.message });
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to send remittance',
    });
  }
};

/**
 * Get sent remittances
 */
export const getSentRemittances = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await remittanceService.getRemittances(userId, 'sent', page, limit);

    res.json({
      success: true,
      data: result.remittances,
      pagination: result.pagination,
    });
  } catch (error: any) {
    logger.error('Get sent remittances error', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to get remittances',
    });
  }
};

/**
 * Get received remittances
 */
export const getReceivedRemittances = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await remittanceService.getRemittances(userId, 'received', page, limit);

    res.json({
      success: true,
      data: result.remittances,
      pagination: result.pagination,
    });
  } catch (error: any) {
    logger.error('Get received remittances error', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to get remittances',
    });
  }
};

/**
 * Validation rules
 */
export const calculateRemittanceValidation = [
  body('amount').isFloat({ min: 5000, max: 5000000 }).withMessage('Amount must be between ₦5,000 and ₦5,000,000'),
  body('fromCurrency').isString().withMessage('From currency is required'),
  body('toCurrency').isString().withMessage('To currency is required'),
];

export const sendRemittanceValidation = [
  body('recipientEmail').isEmail().withMessage('Valid email is required'),
  body('recipientPhone').optional().isMobilePhone('any').withMessage('Invalid phone number'),
  body('recipientName').isString().isLength({ min: 2 }).withMessage('Recipient name is required'),
  body('amount').isFloat({ min: 5000, max: 5000000 }).withMessage('Amount must be between ₦5,000 and ₦5,000,000'),
  body('purpose').isString().withMessage('Purpose is required'),
  body('relationship').isString().withMessage('Relationship is required'),
  body('country').isString().withMessage('Country is required'),
];
