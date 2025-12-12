import { Request, Response, NextFunction } from 'express';
import cryptoService from '../services/crypto.service';
import { AppError } from '../middleware/errorHandler';

export class CryptoController {
  async depositCrypto(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401);
      }

      const result = await cryptoService.depositCrypto({
        userId: req.user.userId,
        ...req.body,
      });

      res.status(201).json({
        status: 'success',
        message: 'Crypto deposit processed successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async withdrawCrypto(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401);
      }

      const result = await cryptoService.withdrawCrypto({
        userId: req.user.userId,
        ...req.body,
      });

      res.status(200).json({
        status: 'success',
        message: 'Crypto withdrawal successful',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserCryptoTransactions(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401);
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await cryptoService.getUserCryptoTransactions(
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

  async getPlatformWalletAddress(_req: Request, res: Response, next: NextFunction) {
    try {
      const result = await cryptoService.getPlatformWalletAddress();

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getCryptoPrices(_req: Request, res: Response, next: NextFunction) {
    try {
      const result = await cryptoService.getCryptoPrices();

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new CryptoController();
