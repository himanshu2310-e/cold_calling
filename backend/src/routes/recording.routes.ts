// ============================================
// Recording Routes
// ============================================
import { Router } from 'express';
import * as recordingController from '../controllers/recording.controller';
import { protect, authorize } from '../middleware/auth';
import upload from '../middleware/upload';
import { uploadLimiter } from '../middleware/rateLimiter';

const router = Router();

router.use(protect);

router.post(
  '/upload',
  uploadLimiter,
  upload.single('file'),
  recordingController.uploadRecording
);
router.get('/lead/:leadId', recordingController.getRecordingsByLead);
router.delete('/:id', authorize('admin', 'manager'), recordingController.deleteRecording);
router.get('/logs', authorize('admin', 'manager'), recordingController.getRecordingLogs);

export default router;
