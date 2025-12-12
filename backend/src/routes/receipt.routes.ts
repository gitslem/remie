import { Router } from 'express';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', (_req, res) => {
  res.json({ message: 'Get all receipts' });
});

router.get('/:id', (_req, res) => {
  res.json({ message: 'Get receipt by ID' });
});

router.get('/:id/download', (_req, res) => {
  res.json({ message: 'Download receipt PDF' });
});

export default router;
