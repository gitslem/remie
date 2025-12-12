import { Router } from 'express';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', (_req, res) => {
  res.json({ message: 'Get all notifications' });
});

router.put('/:id/read', (_req, res) => {
  res.json({ message: 'Mark notification as read' });
});

router.put('/read-all', (_req, res) => {
  res.json({ message: 'Mark all as read' });
});

export default router;
