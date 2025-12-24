import { Request, Response, NextFunction } from 'express';
import p2pService from '../services/p2p.service';
import { AppError } from '../middleware/errorHandler';

export class P2PController {
  async sendMoney(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401);
      }

      const result = await p2pService.sendMoney({
        senderId: req.user.userId,
        ...req.body,
      });

      res.status(201).json({
        status: 'success',
        message: 'Money sent successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserTransfers(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401);
      }

      const type = (req.query.type as 'sent' | 'received' | 'all') || 'all';
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 20;

      const result = await p2pService.getUserTransfers(
        req.user.userId,
        type,
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

  async getTransferDetails(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401);
      }

      const { reference } = req.params;

      const result = await p2pService.getTransferDetails(
        reference,
        req.user.userId
      );

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async searchUsers(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401);
      }

      const query = req.query.q as string;

      if (!query || query.length < 2) {
        throw new AppError('Search query must be at least 2 characters', 400);
      }

      const result = await p2pService.searchUsers(query, req.user.userId);

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new P2PController();
