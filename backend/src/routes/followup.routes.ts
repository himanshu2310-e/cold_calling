// ============================================
// FollowUp Routes
// ============================================
import { Router } from 'express';
import * as followupController from '../controllers/followup.controller';
import { protect, authorize } from '../middleware/auth';

const router = Router();

router.use(protect);

router.post('/', followupController.createFollowUp);
router.get('/', followupController.getMyFollowUps);
router.put('/:id/complete', followupController.completeFollowUp);
router.post('/trigger-reminders', authorize('admin', 'manager'), followupController.triggerReminders);

export default router;
