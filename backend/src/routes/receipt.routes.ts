import { Router } from 'express';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', (req, res) => {
  res.json({ message: 'Get all receipts' });
});

router.get('/:id', (req, res) => {
  res.json({ message: 'Get receipt by ID' });
});

router.get('/:id/download', (req, res) => {
  res.json({ message: 'Download receipt PDF' });
});

export default router;
