import { PrismaClient, UserStatus } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';
import logger from '../utils/logger';

const prisma = new PrismaClient();

interface UpdateLimitsParams {
  walletId: string;
  dailyLimit?: number;
  monthlyLimit?: number;
}

interface ApproveUserParams {
  userId: string;
  approvedByAdminId: string;
}

interface UpdateUserStatusParams {
  userId: string;
  status: UserStatus;
  adminId: string;
}

class AdminService {
  /**
   * Get all users with pagination and filters
   */
  async getUsers(params: {
    page?: number;
    limit?: number;
    status?: UserStatus;
    search?: string;
  }) {
    try {
      const page = params.page || 1;
      const limit = params.limit || 20;
      const skip = (page - 1) * limit;

      const where: any = {};

      if (params.status) {
        where.status = params.status;
      }

      if (params.search) {
        where.OR = [
          { email: { contains: params.search, mode: 'insensitive' } },
          { firstName: { contains: params.search, mode: 'insensitive' } },
          { lastName: { contains: params.search, mode: 'insensitive' } },
          { phoneNumber: { contains: params.search } },
        ];
      }

      const [users, total] = await prisma.$transaction([
        prisma.user.findMany({
          where,
          include: {
            wallet: {
              select: {
                balance: true,
                availableBalance: true,
                dailyLimit: true,
                monthlyLimit: true,
                dailyFundingSpent: true,
                monthlyFundingSpent: true,
                isFrozen: true,
              },
            },
            _count: {
              select: {
                payments: true,
                loans: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
            role: true,
            status: true,
            emailVerified: true,
            phoneVerified: true,
            kycVerified: true,
            institution: true,
            studentId: true,
            approvedBy: true,
            approvedAt: true,
            createdAt: true,
            lastLoginAt: true,
            wallet: true,
            _count: true,
          },
        }),
        prisma.user.count({ where }),
      ]);

      return {
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error: any) {
      logger.error('Failed to get users', { error: error.message });
      throw error;
    }
  }

  /**
   * Get users pending approval
   */
  async getPendingApprovals() {
    try {
      const users = await prisma.user.findMany({
        where: {
          status: UserStatus.PENDING_APPROVAL,
        },
        include: {
          wallet: {
            select: {
              balance: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phoneNumber: true,
          institution: true,
          studentId: true,
          emailVerified: true,
          phoneVerified: true,
          kycVerified: true,
          createdAt: true,
          wallet: true,
        },
      });

      return users;
    } catch (error: any) {
      logger.error('Failed to get pending approvals', { error: error.message });
      throw error;
    }
  }

  /**
   * Approve a user account
   */
  async approveUser(params: ApproveUserParams) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: params.userId },
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      if (user.status !== UserStatus.PENDING_APPROVAL) {
        throw new AppError('User is not pending approval', 400);
      }

      const updatedUser = await prisma.user.update({
        where: { id: params.userId },
        data: {
          status: UserStatus.ACTIVE,
          approvedBy: params.approvedByAdminId,
          approvedAt: new Date(),
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          status: true,
          approvedAt: true,
        },
      });

      logger.info(`User approved by admin`, {
        userId: params.userId,
        adminId: params.approvedByAdminId,
      });

      return updatedUser;
    } catch (error: any) {
      logger.error('Failed to approve user', {
        userId: params.userId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Reject/Remove a user account
   */
  async rejectUser(userId: string, adminId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          status: UserStatus.INACTIVE,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          status: true,
        },
      });

      logger.info(`User rejected/removed by admin`, {
        userId,
        adminId,
      });

      return updatedUser;
    } catch (error: any) {
      logger.error('Failed to reject user', {
        userId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Update user status (suspend, activate, etc.)
   */
  async updateUserStatus(params: UpdateUserStatusParams) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: params.userId },
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      const updatedUser = await prisma.user.update({
        where: { id: params.userId },
        data: {
          status: params.status,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          status: true,
        },
      });

      logger.info(`User status updated by admin`, {
        userId: params.userId,
        adminId: params.adminId,
        newStatus: params.status,
      });

      return updatedUser;
    } catch (error: any) {
      logger.error('Failed to update user status', {
        userId: params.userId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Update wallet spending limits
   */
  async updateWalletLimits(params: UpdateLimitsParams) {
    try {
      const wallet = await prisma.wallet.findUnique({
        where: { id: params.walletId },
      });

      if (!wallet) {
        throw new AppError('Wallet not found', 404);
      }

      const updateData: any = {};

      if (params.dailyLimit !== undefined) {
        if (params.dailyLimit < 0) {
          throw new AppError('Daily limit cannot be negative', 400);
        }
        updateData.dailyLimit = params.dailyLimit;
      }

      if (params.monthlyLimit !== undefined) {
        if (params.monthlyLimit < 0) {
          throw new AppError('Monthly limit cannot be negative', 400);
        }
        updateData.monthlyLimit = params.monthlyLimit;
      }

      const updatedWallet = await prisma.wallet.update({
        where: { id: params.walletId },
        data: updateData,
        select: {
          id: true,
          userId: true,
          dailyLimit: true,
          monthlyLimit: true,
          dailyFundingSpent: true,
          monthlyFundingSpent: true,
        },
      });

      logger.info(`Wallet limits updated`, {
        walletId: params.walletId,
        dailyLimit: params.dailyLimit,
        monthlyLimit: params.monthlyLimit,
      });

      return updatedWallet;
    } catch (error: any) {
      logger.error('Failed to update wallet limits', {
        walletId: params.walletId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get admin dashboard stats
   */
  async getDashboardStats() {
    try {
      const [
        totalUsers,
        activeUsers,
        pendingApprovalUsers,
        suspendedUsers,
        totalWalletBalance,
        totalTransactions,
        completedTransactions,
        pendingLoans,
        activeLoans,
      ] = await prisma.$transaction([
        prisma.user.count(),
        prisma.user.count({ where: { status: UserStatus.ACTIVE } }),
        prisma.user.count({ where: { status: UserStatus.PENDING_APPROVAL } }),
        prisma.user.count({ where: { status: UserStatus.SUSPENDED } }),
        prisma.wallet.aggregate({
          _sum: { balance: true },
        }),
        prisma.payment.count(),
        prisma.payment.count({ where: { status: 'COMPLETED' } }),
        prisma.loan.count({ where: { status: 'PENDING' } }),
        prisma.loan.count({ where: { status: 'ACTIVE' } }),
      ]);

      const totalVolume = await prisma.payment.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amount: true },
      });

      return {
        totalUsers,
        activeUsers,
        pendingApprovalUsers,
        suspendedUsers,
        totalWalletBalance: totalWalletBalance._sum.balance || 0,
        totalTransactions,
        completedTransactions,
        totalVolume: totalVolume._sum.amount || 0,
        pendingLoans,
        activeLoans,
      };
    } catch (error: any) {
      logger.error('Failed to get dashboard stats', { error: error.message });
      throw error;
    }
  }

  /**
   * Get recent system activities
   */
  async getRecentActivities(limit: number = 50) {
    try {
      const payments = await prisma.payment.findMany({
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      return payments.map((payment: any) => ({
        id: payment.id,
        userId: payment.userId,
        userName: `${payment.user.firstName} ${payment.user.lastName}`,
        userEmail: payment.user.email,
        type: payment.type,
        description: payment.description,
        amount: payment.amount,
        status: payment.status,
        createdAt: payment.createdAt,
      }));
    } catch (error: any) {
      logger.error('Failed to get recent activities', { error: error.message });
      throw error;
    }
  }

  /**
   * Get user details with full information
   */
  async getUserDetails(userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          wallet: true,
          payments: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
          loans: {
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
          _count: {
            select: {
              payments: true,
              loans: true,
              p2pSent: true,
              p2pReceived: true,
            },
          },
        },
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      return user;
    } catch (error: any) {
      logger.error('Failed to get user details', {
        userId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Update user nickname (admin only)
   */
  async updateUserNickname(userId: string, nickname: string, adminId: string) {
    try {
      // Check if nickname is already taken
      if (nickname) {
        const existingNickname = await prisma.user.findUnique({
          where: { nickname },
        });

        if (existingNickname && existingNickname.id !== userId) {
          throw new AppError('Nickname is already taken', 400);
        }
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          nickname: nickname || null,
          nicknameSetAt: nickname ? new Date() : null,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          nickname: true,
          nicknameSetAt: true,
        },
      });

      logger.info(`User nickname updated by admin`, {
        userId,
        adminId,
        newNickname: nickname,
      });

      return updatedUser;
    } catch (error: any) {
      logger.error('Failed to update user nickname', {
        userId,
        error: error.message,
      });
      throw error;
    }
  }
}

export default new AdminService();
