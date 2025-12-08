import { Request, Response, NextFunction } from 'express';
import loanService from '../services/loan.service';
import { AppError } from '../middleware/errorHandler';

export class LoanController {
  async applyForLoan(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401);
      }

      const result = await loanService.applyForLoan({
        userId: req.user.userId,
        ...req.body,
      });

      res.status(201).json({
        status: 'success',
        message: 'Loan application submitted successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async repayLoan(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401);
      }

      const { loanId } = req.params;
      const { amount, paymentMethod } = req.body;

      const result = await loanService.repayLoan(loanId, amount, paymentMethod);

      res.status(200).json({
        status: 'success',
        message: 'Loan repayment successful',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserLoans(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401);
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await loanService.getUserLoans(req.user.userId, page, limit);

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getLoanDetails(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401);
      }

      const { loanId } = req.params;

      const result = await loanService.getLoanDetails(loanId, req.user.userId);

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new LoanController();
