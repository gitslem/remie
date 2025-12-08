import { Router } from 'express';
import { body } from 'express-validator';
import cryptoController from '../controllers/crypto.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

const depositValidation = [
  body('cryptoType').isIn(['USDT', 'USDC']).withMessage('Invalid crypto type'),
  body('amount').isNumeric().withMessage('Amount must be a number'),
  body('txHash').notEmpty().withMessage('Transaction hash is required'),
];

const withdrawValidation = [
  body('cryptoType').isIn(['USDT', 'USDC']).withMessage('Invalid crypto type'),
  body('amount').isNumeric().withMessage('Amount must be a number'),
  body('toAddress').notEmpty().withMessage('Wallet address is required'),
];

// Public routes
router.get('/wallet-address', cryptoController.getPlatformWalletAddress);
router.get('/prices', cryptoController.getCryptoPrices);

// Protected routes
router.use(authenticate);

router.post('/deposit', validate(depositValidation), cryptoController.depositCrypto);
router.post('/withdraw', validate(withdrawValidation), cryptoController.withdrawCrypto);
router.get('/transactions', cryptoController.getUserCryptoTransactions);

export default router;
