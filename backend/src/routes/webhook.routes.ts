import { Router } from 'express';
import { handlePaystackWebhook } from '../controllers/webhook.controller';

const router = Router();

/**
 * @route   POST /api/v1/webhooks/paystack
 * @desc    Handle Paystack webhook events
 * @access  Public (verified by signature)
 */
router.post('/paystack', handlePaystackWebhook);

export default router;
