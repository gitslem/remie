import { Router } from 'express';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/', (_req, res) => {
  res.json({ message: 'Create payment' });
});

router.get('/', (_req, res) => {
  res.json({ message: 'Get all payments' });
});

router.get('/:id', (_req, res) => {
  res.json({ message: 'Get payment by ID' });
});

router.post('/:id/verify', (_req, res) => {
  res.json({ message: 'Verify payment' });
});

export default router;
