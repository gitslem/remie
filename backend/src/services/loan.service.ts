import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';
import logger from '../utils/logger';
import { sendEmail } from '../utils/email';
import { PaymentType } from '../types/prisma-enums';

const prisma = new PrismaClient();

interface ApplyLoanData {
  userId: string;
  amount: number;
  purpose: string;
  purposeType: PaymentType;
  tenure: number; // in days
}

export class LoanService {
  private readonly minLoanAmount: number;
  private readonly maxLoanAmount: number;
  private readonly interestRate: number; // Annual percentage
  private readonly maxTenureDays: number;

  constructor() {
    this.minLoanAmount = parseInt(process.env.MIN_LOAN_AMOUNT || '5000');
    this.maxLoanAmount = parseInt(process.env.MAX_LOAN_AMOUNT || '50000');
    this.interestRate = parseFloat(process.env.LOAN_INTEREST_RATE || '5');
    this.maxTenureDays = parseInt(process.env.MAX_LOAN_TENURE_DAYS || '90');
  }

  // Generate unique loan number
  private generateLoanNumber(): string {
    return `LOAN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Calculate total repayable amount
  private calculateRepayableAmount(amount: number, tenure: number): number {
    // Simple interest calculation
    const interestAmount = (amount * this.interestRate * tenure) / (365 * 100);
    return amount + interestAmount;
  }

  // Calculate credit score (simplified)
  private async calculateCreditScore(userId: string): Promise<number> {
    // Get user's loan history
    const loans = await prisma.loan.findMany({
      where: { userId },
    });

    if (loans.length === 0) {
      return 500; // Default score for new users
    }

    const completedLoans = loans.filter((l: any) => l.status === 'COMPLETED').length;
    const defaultedLoans = loans.filter((l: any) => l.status === 'DEFAULTED').length;
    const activeLoans = loans.filter((l: any) => l.status === 'ACTIVE').length;

    // Simple scoring logic
    let score = 500;
    score += completedLoans * 50; // +50 for each completed loan
    score -= defaultedLoans * 100; // -100 for each default
    score -= activeLoans * 25; // -25 for each active loan

    return Math.max(300, Math.min(850, score)); // Score between 300-850
  }

  // Check loan eligibility
  private async checkEligibility(userId: string, _amount: number): Promise<boolean> {
    // Check if user has active loans
    const activeLoan = await prisma.loan.findFirst({
      where: {
        userId,
        status: { in: ['ACTIVE', 'DISBURSED', 'APPROVED'] },
      },
    });

    if (activeLoan) {
      throw new AppError('You already have an active loan', 400);
    }

    // Check credit score
    const creditScore = await this.calculateCreditScore(userId);
    if (creditScore < 400) {
      throw new AppError('Credit score too low for loan approval', 400);
    }

    return true;
  }

  // Apply for loan
  async applyForLoan(data: ApplyLoanData) {
    try {
      // Validate amount
      if (data.amount < this.minLoanAmount) {
        throw new AppError(`Minimum loan amount is ₦${this.minLoanAmount}`, 400);
      }

      if (data.amount > this.maxLoanAmount) {
        throw new AppError(`Maximum loan amount is ₦${this.maxLoanAmount}`, 400);
      }

      // Validate tenure
      if (data.tenure < 7 || data.tenure > this.maxTenureDays) {
        throw new AppError(`Loan tenure must be between 7 and ${this.maxTenureDays} days`, 400);
      }

      // Check eligibility
      await this.checkEligibility(data.userId, data.amount);

      // Calculate repayable amount
      const totalRepayable = this.calculateRepayableAmount(data.amount, data.tenure);
      const creditScore = await this.calculateCreditScore(data.userId);

      // Create loan application
      const loanNumber = this.generateLoanNumber();
      const dueDate = new Date(Date.now() + data.tenure * 86400000);

      const loan = await prisma.loan.create({
        data: {
          userId: data.userId,
          loanNumber,
          amount: data.amount,
          interestRate: this.interestRate,
          tenure: data.tenure,
          purpose: data.purpose,
          purposeType: data.purposeType,
          totalRepayable,
          amountOutstanding: totalRepayable,
          dueDate,
          creditScore,
          status: 'PENDING',
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      logger.info(`Loan application created: ${loanNumber}`);

      // Auto-approve for now (in production, this would go through approval flow)
      await this.approveLoan(loan.id, 'SYSTEM');

      return loan;
    } catch (error) {
      logger.error('Loan application error:', error);
      throw error;
    }
  }

  // Approve loan (admin function)
  async approveLoan(loanId: string, approvedBy: string) {
    try {
      const loan = await prisma.loan.findUnique({
        where: { id: loanId },
        include: { user: true },
      });

      if (!loan) {
        throw new AppError('Loan not found', 404);
      }

      if (loan.status !== 'PENDING') {
        throw new AppError('Loan is not in pending status', 400);
      }

      // Update loan status and disburse funds
      const updatedLoan = await prisma.$transaction(async (tx: any) => {
        // Update loan
        const updated = await tx.loan.update({
          where: { id: loanId },
          data: {
            status: 'DISBURSED',
            approvedBy,
            approvedAt: new Date(),
            disbursedAt: new Date(),
          },
        });

        // Credit user wallet
        await tx.wallet.update({
          where: { userId: loan.userId },
          data: {
            balance: { increment: loan.amount },
            availableBalance: { increment: loan.amount },
          },
        });

        // Create notification
        await tx.notification.create({
          data: {
            userId: loan.userId,
            type: 'LOAN_APPROVED',
            title: 'Loan Approved',
            message: `Your loan of ₦${loan.amount} has been approved and disbursed`,
            data: { loanId: loan.id, loanNumber: loan.loanNumber },
          },
        });

        return updated;
      });

      // Send email
      await sendEmail({
        to: loan.user.email,
        subject: 'Loan Approved',
        template: 'loan-approved',
        data: {
          firstName: loan.user.firstName,
          amount: loan.amount,
          interestRate: loan.interestRate,
          dueDate: loan.dueDate.toLocaleDateString(),
          totalRepayable: loan.totalRepayable,
        },
      });

      logger.info(`Loan approved and disbursed: ${loan.loanNumber}`);

      return updatedLoan;
    } catch (error) {
      logger.error('Loan approval error:', error);
      throw error;
    }
  }

  // Repay loan
  async repayLoan(loanId: string, amount: number, paymentMethod: string = 'WALLET') {
    try {
      const loan = await prisma.loan.findUnique({
        where: { id: loanId },
        include: { user: true },
      });

      if (!loan) {
        throw new AppError('Loan not found', 404);
      }

      if (loan.status !== 'DISBURSED' && loan.status !== 'ACTIVE') {
        throw new AppError('Loan is not active', 400);
      }

      if (amount <= 0) {
        throw new AppError('Repayment amount must be greater than 0', 400);
      }

      if (amount > Number(loan.amountOutstanding)) {
        throw new AppError('Repayment amount exceeds outstanding balance', 400);
      }

      // Check wallet balance
      const wallet = await prisma.wallet.findUnique({
        where: { userId: loan.userId },
      });

      if (!wallet || Number(wallet.availableBalance) < amount) {
        throw new AppError('Insufficient wallet balance', 400);
      }

      const reference = `REPAY-${Date.now()}`;
      const newOutstanding = Number(loan.amountOutstanding) - amount;
      const newPaid = Number(loan.amountPaid) + amount;

      // Process repayment
      await prisma.$transaction(async (tx: any) => {
        // Debit wallet
        await tx.wallet.update({
          where: { userId: loan.userId },
          data: {
            balance: { decrement: amount },
            availableBalance: { decrement: amount },
          },
        });

        // Update loan
        await tx.loan.update({
          where: { id: loanId },
          data: {
            amountPaid: newPaid,
            amountOutstanding: newOutstanding,
            lastPaymentDate: new Date(),
            status: newOutstanding === 0 ? 'COMPLETED' : 'ACTIVE',
          },
        });

        // Create repayment record
        await tx.loanRepayment.create({
          data: {
            loanId,
            amount,
            reference,
            paymentMethod: paymentMethod as any,
            status: 'COMPLETED',
            paidAt: new Date(),
          },
        });

        // Create notification
        await tx.notification.create({
          data: {
            userId: loan.userId,
            type: 'WALLET_DEBITED',
            title: 'Loan Repayment',
            message: `₦${amount} deducted for loan repayment`,
            data: { loanId, reference },
          },
        });
      });

      logger.info(`Loan repayment processed: ${reference}`);

      return {
        reference,
        amount,
        outstandingBalance: newOutstanding,
        status: newOutstanding === 0 ? 'COMPLETED' : 'ACTIVE',
      };
    } catch (error) {
      logger.error('Loan repayment error:', error);
      throw error;
    }
  }

  // Get user loans
  async getUserLoans(userId: string, page: number = 1, limit: number = 20) {
    try {
      const skip = (page - 1) * limit;

      const [loans, total] = await Promise.all([
        prisma.loan.findMany({
          where: { userId },
          include: {
            repayments: true,
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.loan.count({ where: { userId } }),
      ]);

      return {
        loans,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Get user loans error:', error);
      throw error;
    }
  }

  // Get loan details
  async getLoanDetails(loanId: string, userId: string) {
    try {
      const loan = await prisma.loan.findFirst({
        where: {
          id: loanId,
          userId,
        },
        include: {
          repayments: {
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!loan) {
        throw new AppError('Loan not found', 404);
      }

      return loan;
    } catch (error) {
      logger.error('Get loan details error:', error);
      throw error;
    }
  }
}

export default new LoanService();
