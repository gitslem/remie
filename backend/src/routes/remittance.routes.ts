import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getExchangeRates,
  calculateRemittance,
  sendRemittance,
  getSentRemittances,
  getReceivedRemittances,
  calculateRemittanceValidation,
  sendRemittanceValidation,
} from '../controllers/remittance.controller';

const router = Router();

router.use(authenticate);

/**
 * @route   GET /api/v1/remittance/rates
 * @desc    Get current exchange rates
 * @access  Private
 */
router.get('/rates', getExchangeRates);

/**
 * @route   POST /api/v1/remittance/calculate
 * @desc    Calculate remittance amount and fees
 * @access  Private
 */
router.post('/calculate', calculateRemittanceValidation, calculateRemittance);

/**
 * @route   POST /api/v1/remittance/send
 * @desc    Send international remittance
 * @access  Private
 */
router.post('/send', sendRemittanceValidation, sendRemittance);

/**
 * @route   GET /api/v1/remittance/sent
 * @desc    Get sent remittances
 * @access  Private
 */
router.get('/sent', getSentRemittances);

/**
 * @route   GET /api/v1/remittance/received
 * @desc    Get received remittances
 * @access  Private
 */
router.get('/received', getReceivedRemittances);

export default router;
