import { PrismaClient } from '@prisma/client';
import { CryptoType } from '../types/prisma';
import { ethers } from 'ethers';
import { AppError } from '../middleware/errorHandler';
import logger from '../utils/logger';

const prisma = new PrismaClient();

// ERC20 ABI for USDT/USDC
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function transfer(address to, uint amount) returns (bool)',
  'function decimals() view returns (uint8)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
];

interface DepositCryptoData {
  userId: string;
  cryptoType: CryptoType;
  amount: number;
  txHash: string;
}

interface WithdrawCryptoData {
  userId: string;
  cryptoType: CryptoType;
  amount: number;
  toAddress: string;
}

export class CryptoService {
  private provider: ethers.JsonRpcProvider;
  private platformWallet: ethers.Wallet;
  private usdtContract: ethers.Contract;
  private usdcContract: ethers.Contract;

  constructor() {
    // Initialize provider (Polygon network for lower fees)
    this.provider = new ethers.JsonRpcProvider(
      process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com'
    );

    // Initialize platform wallet
    const privateKey = process.env.CRYPTO_PRIVATE_KEY || '';
    this.platformWallet = new ethers.Wallet(privateKey, this.provider);

    // Initialize token contracts
    const usdtAddress = process.env.USDT_CONTRACT_ADDRESS || '';
    const usdcAddress = process.env.USDC_CONTRACT_ADDRESS || '';

    this.usdtContract = new ethers.Contract(usdtAddress, ERC20_ABI, this.platformWallet);
    this.usdcContract = new ethers.Contract(usdcAddress, ERC20_ABI, this.platformWallet);
  }

  // Get contract for crypto type
  private getContract(cryptoType: CryptoType): ethers.Contract {
    switch (cryptoType) {
      case 'USDT':
        return this.usdtContract;
      case 'USDC':
        return this.usdcContract;
      default:
        throw new AppError('Unsupported crypto type', 400);
    }
  }

  // Get current exchange rate (USDT/USDC to NGN)
  private async getExchangeRate(): Promise<number> {
    // In production, fetch from a price oracle or API
    // For now, using a fixed rate
    return 1550; // 1 USDT = 1550 NGN (example)
  }

  // Verify transaction on blockchain
  private async verifyTransaction(txHash: string, expectedAmount: number, cryptoType: CryptoType) {
    try {
      const receipt = await this.provider.getTransactionReceipt(txHash);

      if (!receipt) {
        throw new AppError('Transaction not found', 404);
      }

      if (receipt.status !== 1) {
        throw new AppError('Transaction failed', 400);
      }

      // Verify transaction is to platform wallet
      const platformAddress = this.platformWallet.address;
      const contract = this.getContract(cryptoType);

      // Parse transfer event
      const transferEvent = receipt.logs.find((log) => {
        try {
          const parsed = contract.interface.parseLog(log);
          return parsed?.name === 'Transfer' &&
                 parsed.args.to.toLowerCase() === platformAddress.toLowerCase();
        } catch {
          return false;
        }
      });

      if (!transferEvent) {
        throw new AppError('Invalid transaction', 400);
      }

      const parsedLog = contract.interface.parseLog(transferEvent);
      const amount = Number(ethers.formatUnits(parsedLog?.args.value, 6)); // USDT/USDC have 6 decimals

      if (amount < expectedAmount) {
        throw new AppError('Insufficient amount', 400);
      }

      return {
        verified: true,
        amount,
        from: parsedLog?.args.from,
        blockNumber: receipt.blockNumber,
        confirmations: await this.provider.getBlockNumber() - receipt.blockNumber,
      };
    } catch (error) {
      logger.error('Transaction verification error:', error);
      throw error;
    }
  }

  // Deposit crypto to wallet
  async depositCrypto(data: DepositCryptoData) {
    try {
      // Check if transaction already processed
      const existing = await prisma.cryptoTransaction.findUnique({
        where: { txHash: data.txHash },
      });

      if (existing) {
        throw new AppError('Transaction already processed', 400);
      }

      // Verify transaction
      const verification = await this.verifyTransaction(
        data.txHash,
        data.amount,
        data.cryptoType
      );

      // Get exchange rate
      const exchangeRate = await this.getExchangeRate();
      const amountInNGN = verification.amount * exchangeRate;

      // Create crypto transaction record
      const cryptoTx = await prisma.$transaction(async (tx: any) => {
        // Create transaction record
        const transaction = await tx.cryptoTransaction.create({
          data: {
            userId: data.userId,
            txHash: data.txHash,
            cryptoType: data.cryptoType,
            type: 'DEPOSIT',
            amount: verification.amount,
            amountInNGN,
            exchangeRate,
            fromAddress: verification.from,
            toAddress: this.platformWallet.address,
            blockNumber: BigInt(verification.blockNumber),
            confirmations: verification.confirmations,
            status: verification.confirmations >= 12 ? 'CONFIRMED' : 'CONFIRMING',
          },
        });

        // Update wallet balances
        const updateData: any = {
          balance: { increment: amountInNGN },
          availableBalance: { increment: amountInNGN },
        };

        if (data.cryptoType === 'USDT') {
          updateData.usdtBalance = { increment: verification.amount };
        } else if (data.cryptoType === 'USDC') {
          updateData.usdcBalance = { increment: verification.amount };
        }

        await tx.wallet.update({
          where: { userId: data.userId },
          data: updateData,
        });

        // Create notification
        await tx.notification.create({
          data: {
            userId: data.userId,
            type: 'WALLET_CREDITED',
            title: 'Crypto Deposit Successful',
            message: `₦${amountInNGN.toFixed(2)} credited from ${data.cryptoType} deposit`,
            data: { txHash: data.txHash, amount: verification.amount },
          },
        });

        return transaction;
      });

      logger.info(`Crypto deposit processed: ${data.txHash}`);

      return cryptoTx;
    } catch (error) {
      logger.error('Crypto deposit error:', error);
      throw error;
    }
  }

  // Withdraw crypto from wallet
  async withdrawCrypto(data: WithdrawCryptoData) {
    try {
      // Validate address
      if (!ethers.isAddress(data.toAddress)) {
        throw new AppError('Invalid wallet address', 400);
      }

      // Get user wallet
      const wallet = await prisma.wallet.findUnique({
        where: { userId: data.userId },
      });

      if (!wallet) {
        throw new AppError('Wallet not found', 404);
      }

      // Check balance
      const cryptoBalance = data.cryptoType === 'USDT'
        ? Number(wallet.usdtBalance)
        : Number(wallet.usdcBalance);

      if (cryptoBalance < data.amount) {
        throw new AppError('Insufficient crypto balance', 400);
      }

      // Get contract
      const contract = this.getContract(data.cryptoType);

      // Send transaction
      const amount = ethers.parseUnits(data.amount.toString(), 6); // 6 decimals for USDT/USDC
      const tx = await contract.transfer(data.toAddress, amount);

      // Wait for transaction
      const receipt = await tx.wait();

      // Get exchange rate
      const exchangeRate = await this.getExchangeRate();
      const amountInNGN = data.amount * exchangeRate;

      // Update database
      const cryptoTx = await prisma.$transaction(async (txDb: any) => {
        // Create transaction record
        const transaction = await txDb.cryptoTransaction.create({
          data: {
            userId: data.userId,
            txHash: receipt.hash,
            cryptoType: data.cryptoType,
            type: 'WITHDRAWAL',
            amount: data.amount,
            amountInNGN,
            exchangeRate,
            fromAddress: this.platformWallet.address,
            toAddress: data.toAddress,
            blockNumber: BigInt(receipt.blockNumber),
            confirmations: 1,
            status: 'CONFIRMED',
          },
        });

        // Update wallet balances
        const updateData: any = {
          balance: { decrement: amountInNGN },
          availableBalance: { decrement: amountInNGN },
        };

        if (data.cryptoType === 'USDT') {
          updateData.usdtBalance = { decrement: data.amount };
        } else if (data.cryptoType === 'USDC') {
          updateData.usdcBalance = { decrement: data.amount };
        }

        await txDb.wallet.update({
          where: { userId: data.userId },
          data: updateData,
        });

        // Create notification
        await txDb.notification.create({
          data: {
            userId: data.userId,
            type: 'WALLET_DEBITED',
            title: 'Crypto Withdrawal Successful',
            message: `${data.amount} ${data.cryptoType} withdrawn`,
            data: { txHash: receipt.hash, amount: data.amount },
          },
        });

        return transaction;
      });

      logger.info(`Crypto withdrawal processed: ${receipt.hash}`);

      return cryptoTx;
    } catch (error) {
      logger.error('Crypto withdrawal error:', error);
      throw error;
    }
  }

  // Get user crypto transactions
  async getUserCryptoTransactions(
    userId: string,
    page: number = 1,
    limit: number = 20
  ) {
    try {
      const skip = (page - 1) * limit;

      const [transactions, total] = await Promise.all([
        prisma.cryptoTransaction.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.cryptoTransaction.count({ where: { userId } }),
      ]);

      return {
        transactions,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Get crypto transactions error:', error);
      throw error;
    }
  }

  // Get platform wallet address for deposits
  async getPlatformWalletAddress() {
    return {
      address: this.platformWallet.address,
      supportedTokens: ['USDT', 'USDC'],
      network: 'Polygon',
    };
  }

  // Get current crypto prices
  async getCryptoPrices() {
    const exchangeRate = await this.getExchangeRate();

    return {
      USDT: {
        price: exchangeRate,
        currency: 'NGN',
      },
      USDC: {
        price: exchangeRate,
        currency: 'NGN',
      },
    };
  }
}

export default new CryptoService();
