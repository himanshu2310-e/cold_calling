// ============================================
// Call Routes
// ============================================
import { Router } from 'express';
import * as callController from '../controllers/call.controller';
import { protect, authorize } from '../middleware/auth';
import validate from '../middleware/validate';
import { startCallSchema, endCallSchema } from '../validators/call.validator';

const router = Router();

router.use(protect);

router.post('/start', validate(startCallSchema), callController.startCall);
router.put('/:id/end', validate(endCallSchema), callController.endCall);
router.get('/lead/:leadId', callController.getCallsByLead);
router.get('/history', callController.getMyCallHistory);
router.get('/logs', authorize('admin', 'manager'), callController.getCallLogs);

export default router;
