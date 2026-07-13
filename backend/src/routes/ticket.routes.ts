// ============================================
// Support Ticket Routes
// ============================================
import { Router } from 'express';
import * as ticketController from '../controllers/ticket.controller';
import { protect, authorize } from '../middleware/auth';

const router = Router();

// Protect all support routes
router.use(protect);

router.post('/', ticketController.createTicket);
router.get('/', ticketController.getTickets);
router.put('/:ticketId/status', authorize('admin', 'manager'), ticketController.updateTicketStatus);

export default router;
