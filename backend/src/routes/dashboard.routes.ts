// ============================================
// Dashboard Routes
// ============================================
import { Router } from 'express';
import * as dashboardController from '../controllers/dashboard.controller';
import { protect, authorize } from '../middleware/auth';

const router = Router();

router.use(protect);

router.get('/admin', authorize('admin', 'manager'), dashboardController.getAdminDashboard);
router.get('/agent', dashboardController.getAgentDashboard);

export default router;
