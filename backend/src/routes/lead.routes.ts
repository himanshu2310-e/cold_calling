// ============================================
// Lead Routes
// ============================================
import { Router } from 'express';
import * as leadController from '../controllers/lead.controller';
import { protect, authorize } from '../middleware/auth';
import validate from '../middleware/validate';
import {
  createLeadSchema,
  updateLeadSchema,
  leadQuerySchema,
  bulkStatusSchema,
  bulkPrioritySchema,
  bulkAssignSchema,
  bulkDeleteSchema,
} from '../validators/lead.validator';

const router = Router();

// All routes require authentication
router.use(protect);

// ---- CRUD ----
router.get('/', validate(leadQuerySchema, 'query'), leadController.getLeads);
router.get('/stats', leadController.getLeadStats);
router.get('/export', leadController.exportLeads);
router.post('/', validate(createLeadSchema), leadController.createLead);
router.get('/:id', leadController.getLeadById);
router.put('/:id', validate(updateLeadSchema), leadController.updateLead);
router.delete('/:id', authorize('admin', 'manager'), leadController.deleteLead);

// ---- Toggles ----
router.put('/:id/favorite', leadController.toggleFavorite);
router.put('/:id/pin', leadController.togglePinned);

// ---- Duplicate Check ----
router.post('/check-duplicates', leadController.checkDuplicates);

// ---- Bulk Operations (admin/manager only) ----
router.post('/bulk/status', authorize('admin', 'manager'), validate(bulkStatusSchema), leadController.bulkUpdateStatus);
router.post('/bulk/priority', authorize('admin', 'manager'), validate(bulkPrioritySchema), leadController.bulkUpdatePriority);
router.post('/bulk/assign', authorize('admin', 'manager'), validate(bulkAssignSchema), leadController.bulkAssign);
router.post('/bulk/delete', authorize('admin'), validate(bulkDeleteSchema), leadController.bulkDeleteLeads);

// ---- Import ----
router.post('/import', authorize('admin', 'manager'), leadController.importLeads);

export default router;
