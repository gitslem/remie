import { Router } from 'express';
import { body } from 'express-validator';
import p2pController from '../controllers/p2p.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

router.use(authenticate);

const sendMoneyValidation = [
  body('receiverIdentifier').notEmpty().withMessage('Receiver identifier is required'),
  body('amount').isNumeric().withMessage('Amount must be a number'),
  body('amount').custom((value) => value > 0).withMessage('Amount must be greater than 0'),
];

router.post('/send', validate(sendMoneyValidation), p2pController.sendMoney);
router.get('/transfers', p2pController.getUserTransfers);
router.get('/transfers/:reference', p2pController.getTransferDetails);
router.get('/search-users', p2pController.searchUsers);

export default router;
