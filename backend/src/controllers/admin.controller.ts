import { Request, Response, NextFunction } from 'express';
import adminService from '../services/admin.service';
import { AppError } from '../middleware/errorHandler';
import { UserStatus } from '@prisma/client';

export class AdminController {
  /**
   * Get all users with pagination and filters
   */
  async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, status, search } = req.query;

      const result = await adminService.getUsers({
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        status: status as UserStatus,
        search: search as string,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get users pending approval
   */
  async getPendingApprovals(req: Request, res: Response, next: NextFunction) {
    try {
      const users = await adminService.getPendingApprovals();

      res.json({
        success: true,
        data: users,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Approve a user
   */
  async approveUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const adminId = req.user?.userId;

      if (!adminId) {
        throw new AppError('Unauthorized', 401);
      }

      const user = await adminService.approveUser({
        userId,
        approvedByAdminId: adminId,
      });

      res.json({
        success: true,
        message: 'User approved successfully',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reject a user
   */
  async rejectUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const adminId = req.user?.userId;

      if (!adminId) {
        throw new AppError('Unauthorized', 401);
      }

      const user = await adminService.rejectUser(userId, adminId);

      res.json({
        success: true,
        message: 'User rejected successfully',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Suspend a user
   */
  async suspendUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const adminId = req.user?.userId;

      if (!adminId) {
        throw new AppError('Unauthorized', 401);
      }

      const user = await adminService.updateUserStatus({
        userId,
        status: UserStatus.SUSPENDED,
        adminId,
      });

      res.json({
        success: true,
        message: 'User suspended successfully',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Activate a user
   */
  async activateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const adminId = req.user?.userId;

      if (!adminId) {
        throw new AppError('Unauthorized', 401);
      }

      const user = await adminService.updateUserStatus({
        userId,
        status: UserStatus.ACTIVE,
        adminId,
      });

      res.json({
        success: true,
        message: 'User activated successfully',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Set user to inactive (remove)
   */
  async deactivateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const adminId = req.user?.userId;

      if (!adminId) {
        throw new AppError('Unauthorized', 401);
      }

      const user = await adminService.updateUserStatus({
        userId,
        status: UserStatus.INACTIVE,
        adminId,
      });

      res.json({
        success: true,
        message: 'User deactivated successfully',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update wallet spending limits
   */
  async updateWalletLimits(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const { dailyLimit, monthlyLimit } = req.body;

      // Get user's wallet
      const userDetails = await adminService.getUserDetails(userId);
      if (!userDetails.wallet) {
        throw new AppError('User wallet not found', 404);
      }

      const wallet = await adminService.updateWalletLimits({
        walletId: userDetails.wallet.id,
        dailyLimit: dailyLimit !== undefined ? parseFloat(dailyLimit) : undefined,
        monthlyLimit: monthlyLimit !== undefined ? parseFloat(monthlyLimit) : undefined,
      });

      res.json({
        success: true,
        message: 'Wallet limits updated successfully',
        data: wallet,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get dashboard statistics
   */
  async getDashboardStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await adminService.getDashboardStats();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get recent activities
   */
  async getRecentActivities(req: Request, res: Response, next: NextFunction) {
    try {
      const { limit } = req.query;
      const activities = await adminService.getRecentActivities(
        limit ? parseInt(limit as string) : 50
      );

      res.json({
        success: true,
        data: activities,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user details
   */
  async getUserDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const user = await adminService.getUserDetails(userId);

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AdminController();
