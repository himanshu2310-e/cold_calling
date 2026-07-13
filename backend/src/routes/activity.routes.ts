// ============================================
// Activity Routes
// ============================================
import { Router } from 'express';
import * as activityController from '../controllers/activity.controller';
import { protect, authorize } from '../middleware/auth';

const router = Router();

router.use(protect);

router.get('/lead/:leadId', activityController.getActivitiesByLead);
router.get('/logs', authorize('admin', 'manager'), activityController.getActivityLogs);

export default router;
