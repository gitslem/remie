import { Request, Response, NextFunction } from 'express';
import rrrService from '../services/rrr.service';
import { AppError } from '../middleware/errorHandler';

export class RRRController {
  async generateRRR(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401);
      }

      const result = await rrrService.generateRRR({
        userId: req.user.userId,
        ...req.body,
      });

      res.status(201).json({
        status: 'success',
        message: 'RRR generated successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async verifyRRR(req: Request, res: Response, next: NextFunction) {
    try {
      const { rrr } = req.params;

      if (!rrr) {
        throw new AppError('RRR is required', 400);
      }

      const result = await rrrService.verifyRRR(rrr);

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getRRRDetails(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401);
      }

      const { rrr } = req.params;

      const result = await rrrService.getRRRDetails(rrr, req.user.userId);

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserRRRPayments(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401);
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await rrrService.getUserRRRPayments(
        req.user.userId,
        page,
        limit
      );

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new RRRController();
