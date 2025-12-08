import { Router } from 'express';
import { body } from 'express-validator';
import rrrController from '../controllers/rrr.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

router.use(authenticate);

const generateRRRValidation = [
  body('amount').isNumeric().withMessage('Amount must be a number'),
  body('institutionCode').notEmpty(),
  body('institutionName').notEmpty(),
  body('serviceTypeId').notEmpty(),
  body('payerName').notEmpty(),
  body('payerEmail').isEmail(),
  body('payerPhone').notEmpty(),
  body('description').notEmpty(),
];

router.post('/generate', validate(generateRRRValidation), rrrController.generateRRR);
router.get('/verify/:rrr', rrrController.verifyRRR);
router.get('/:rrr', rrrController.getRRRDetails);
router.get('/', rrrController.getUserRRRPayments);

export default router;
