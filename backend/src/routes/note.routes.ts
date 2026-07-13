// ============================================
// Note Routes
// ============================================
import { Router } from 'express';
import * as noteController from '../controllers/note.controller';
import { protect } from '../middleware/auth';

const router = Router();

router.use(protect);

router.post('/', noteController.createNote);
router.put('/:id', noteController.updateNote);
router.delete('/:id', noteController.deleteNote);
router.get('/lead/:leadId', noteController.getNotesByLead);

export default router;
// ============================================
