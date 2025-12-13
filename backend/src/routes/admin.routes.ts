import { Router } from 'express';
import adminController from '../controllers/admin.controller';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../types/prisma-enums';

const router = Router();

// All admin routes require authentication and ADMIN role
router.use(authenticate);
router.use(authorize(UserRole.ADMIN));

// Dashboard stats
router.get('/stats', adminController.getDashboardStats);
router.get('/activities', adminController.getRecentActivities);

// User management
router.get('/users', adminController.getUsers);
router.get('/users/pending-approval', adminController.getPendingApprovals);
router.get('/users/:userId', adminController.getUserDetails);

// User approval
router.post('/users/:userId/approve', adminController.approveUser);
router.post('/users/:userId/reject', adminController.rejectUser);

// User status management
router.post('/users/:userId/suspend', adminController.suspendUser);
router.post('/users/:userId/activate', adminController.activateUser);
router.post('/users/:userId/deactivate', adminController.deactivateUser);

// Wallet limits management
router.put('/users/:userId/limits', adminController.updateWalletLimits);

// Nickname management
router.put('/users/:userId/nickname', adminController.updateUserNickname);

export default router;
