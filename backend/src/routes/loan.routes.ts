import { Router } from 'express';
import { body } from 'express-validator';
import loanController from '../controllers/loan.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

router.use(authenticate);

const applyLoanValidation = [
  body('amount').isNumeric().withMessage('Amount must be a number'),
  body('purpose').notEmpty().withMessage('Purpose is required'),
  body('purposeType').notEmpty().withMessage('Purpose type is required'),
  body('tenure').isNumeric().withMessage('Tenure must be a number'),
];

const repayLoanValidation = [
  body('amount').isNumeric().withMessage('Amount must be a number'),
];

router.post('/apply', validate(applyLoanValidation), loanController.applyForLoan);
router.post('/:loanId/repay', validate(repayLoanValidation), loanController.repayLoan);
router.get('/', loanController.getUserLoans);
router.get('/:loanId', loanController.getLoanDetails);

export default router;
