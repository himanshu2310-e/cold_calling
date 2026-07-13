// ============================================
// Support Ticket Controller
// ============================================
import { Request, Response, NextFunction } from 'express';
import * as ticketService from '../services/ticket.service';
import { successResponse, ApiError } from '../utils/apiResponse';

/**
 * POST /api/v1/tickets
 */
export const createTicket = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new ApiError(401, 'Unauthorized');
    }

    const { subject, description, category, priority } = req.body;

    if (!subject || !description || !category) {
      throw new ApiError(400, 'Subject, description, and category are required');
    }

    const ticket = await ticketService.createTicket({
      userId,
      subject,
      description,
      category,
      priority: priority || 'medium',
    });

    res.status(201).json(successResponse({
      message: 'Support ticket submitted successfully',
      data: ticket,
    }));
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/tickets
 */
export const getTickets = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      throw new ApiError(401, 'Unauthorized');
    }

    const tickets = await ticketService.getTickets(userId, userRole, req.query);

    res.status(200).json(successResponse({
      data: tickets,
    }));
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/tickets/:ticketId/status
 */
export const updateTicketStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ticketId = req.params.ticketId as string;
    const { status } = req.body;
    const userRole = req.user?.role;

    if (!status) {
      throw new ApiError(400, 'Status is required');
    }

    const ticket = await ticketService.updateTicketStatus(ticketId, status, userRole);

    res.status(200).json(successResponse({
      message: 'Ticket status updated successfully',
      data: ticket,
    }));
  } catch (error) {
    next(error);
  }
};
