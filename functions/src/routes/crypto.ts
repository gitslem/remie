import { Router, Request, Response } from 'express';
import { authenticate } from './auth';

const router = Router();

// Placeholder routes for crypto
router.get('/wallet-address', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    data: {
      address: '0xYourPlatformWalletAddress',
      supportedTokens: ['USDT', 'USDC'],
      network: 'Polygon',
    },
  });
});

router.get('/prices', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    data: {
      USDT: { price: 1550, currency: 'NGN' },
      USDC: { price: 1550, currency: 'NGN' },
    },
  });
});

router.post('/deposit', authenticate, (req: Request, res: Response) => {
  res.status(501).json({
    status: 'error',
    message: 'Crypto deposit feature coming soon',
  });
});

router.post('/withdraw', authenticate, (req: Request, res: Response) => {
  res.status(501).json({
    status: 'error',
    message: 'Crypto withdrawal feature coming soon',
  });
});

export default router;
