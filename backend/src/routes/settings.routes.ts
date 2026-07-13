// ============================================
// Settings Routes
// ============================================
import { Router } from 'express';
import * as settingsController from '../controllers/settings.controller';
import { protect, authorize } from '../middleware/auth';

const router = Router();

// Protect all settings routes
router.use(protect);

router.get('/:key', settingsController.getSettingByKey);

// Restrict updates to admin and manager roles
router.put('/:key', authorize('admin', 'manager'), settingsController.updateSettingByKey);

export default router;
