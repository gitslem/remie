import { Router } from 'express';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/', (req, res) => {
  res.json({ message: 'Create payment' });
});

router.get('/', (req, res) => {
  res.json({ message: 'Get all payments' });
});

router.get('/:id', (req, res) => {
  res.json({ message: 'Get payment by ID' });
});

router.post('/:id/verify', (req, res) => {
  res.json({ message: 'Verify payment' });
});

export default router;
