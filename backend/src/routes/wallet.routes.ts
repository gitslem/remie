import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getBalance,
  fundWallet,
  verifyFunding,
  withdraw,
  getTransactions,
  getTransaction,
  listBanks,
  resolveAccount,
  fundWalletValidation,
  withdrawValidation,
  resolveAccountValidation,
} from '../controllers/wallet.controller';

const router = Router();

router.use(authenticate);

/**
 * @route   GET /api/v1/wallet
 * @desc    Get wallet balance
 * @access  Private
 */
router.get('/', getBalance);

/**
 * @route   POST /api/v1/wallet/fund
 * @desc    Initiate wallet funding
 * @access  Private
 */
router.post('/fund', fundWalletValidation, fundWallet);

/**
 * @route   GET /api/v1/wallet/verify/:reference
 * @desc    Verify wallet funding payment
 * @access  Private
 */
router.get('/verify/:reference', verifyFunding);

/**
 * @route   POST /api/v1/wallet/withdraw
 * @desc    Withdraw from wallet
 * @access  Private
 */
router.post('/withdraw', withdrawValidation, withdraw);

/**
 * @route   GET /api/v1/wallet/transactions
 * @desc    Get wallet transactions
 * @access  Private
 */
router.get('/transactions', getTransactions);

/**
 * @route   GET /api/v1/wallet/transactions/:reference
 * @desc    Get transaction by reference
 * @access  Private
 */
router.get('/transactions/:reference', getTransaction);

/**
 * @route   GET /api/v1/wallet/banks
 * @desc    List all Nigerian banks
 * @access  Private
 */
router.get('/banks', listBanks);

/**
 * @route   POST /api/v1/wallet/resolve-account
 * @desc    Resolve bank account details
 * @access  Private
 */
router.post('/resolve-account', resolveAccountValidation, resolveAccount);

export default router;
