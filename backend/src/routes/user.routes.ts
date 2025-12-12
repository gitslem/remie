import { Router } from 'express';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/profile', (_req, res) => {
  res.json({ message: 'Get user profile' });
});

router.put('/profile', (_req, res) => {
  res.json({ message: 'Update user profile' });
});

router.post('/verify-email', (_req, res) => {
  res.json({ message: 'Verify email' });
});

router.post('/verify-phone', (_req, res) => {
  res.json({ message: 'Verify phone' });
});

export default router;
