import { Router } from 'express';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', (req, res) => {
  res.json({ message: 'Get wallet balance' });
});

router.post('/fund', (req, res) => {
  res.json({ message: 'Fund wallet' });
});

router.post('/withdraw', (req, res) => {
  res.json({ message: 'Withdraw from wallet' });
});

router.get('/transactions', (req, res) => {
  res.json({ message: 'Get wallet transactions' });
});

export default router;
