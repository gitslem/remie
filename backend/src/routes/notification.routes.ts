import { Router } from 'express';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', (req, res) => {
  res.json({ message: 'Get all notifications' });
});

router.put('/:id/read', (req, res) => {
  res.json({ message: 'Mark notification as read' });
});

router.put('/read-all', (req, res) => {
  res.json({ message: 'Mark all as read' });
});

export default router;
