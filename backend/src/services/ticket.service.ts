// ============================================
// Support Ticket Service — Business Logic
// ============================================
import Ticket, { ITicketDocument } from '../models/Ticket';
import mongoose from 'mongoose';
import { ApiError } from '../utils/apiResponse';

interface CreateTicketParams {
  userId: string;
  subject: string;
  description: string;
  category: 'technical' | 'billing' | 'leads' | 'dialer' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

/**
 * Create a new support ticket.
 */
export const createTicket = async (params: CreateTicketParams): Promise<ITicketDocument> => {
  const { userId, subject, description, category, priority } = params;

  // Generate unique Ticket ID: TK-XXXXX (where XXXXX is a number)
  const count = await Ticket.countDocuments();
  const ticketId = `TK-${1000 + count + Math.floor(Math.random() * 900)}`;

  const ticket = await Ticket.create({
    user: new mongoose.Types.ObjectId(userId),
    ticketId,
    subject,
    description,
    category,
    priority,
    status: 'open',
  });

  return ticket.populate('user', 'firstName lastName email role');
};

/**
 * Get all support tickets.
 */
export const getTickets = async (
  userId?: string,
  userRole?: string,
  query: { category?: string; priority?: string; status?: string } = {}
): Promise<ITicketDocument[]> => {
  const filter: Record<string, unknown> = {};

  // Non-admin/manager users can only see their own tickets
  const isPrivileged = userRole && ['admin', 'manager'].includes(userRole);
  if (!isPrivileged && userId) {
    filter.user = new mongoose.Types.ObjectId(userId);
  } else if (userId && query.category === 'my-tickets') {
    // Admins wanting to see only their submitted tickets
    filter.user = new mongoose.Types.ObjectId(userId);
  }

  if (query.category && query.category !== 'my-tickets') {
    filter.category = query.category;
  }

  if (query.priority) {
    filter.priority = query.priority;
  }

  if (query.status) {
    filter.status = query.status;
  }

  return Ticket.find(filter)
    .populate('user', 'firstName lastName email role')
    .sort({ createdAt: -1 });
};

/**
 * Update support ticket status.
 */
export const updateTicketStatus = async (
  ticketId: string,
  status: 'open' | 'in_progress' | 'resolved' | 'closed',
  userRole?: string
): Promise<ITicketDocument> => {
  const isPrivileged = userRole && ['admin', 'manager'].includes(userRole);
  if (!isPrivileged) {
    throw new ApiError(403, 'Unauthorized to update ticket status');
  }

  const ticket = await Ticket.findOne({ ticketId });
  if (!ticket) {
    throw new ApiError(404, 'Ticket not found');
  }

  ticket.status = status;
  await ticket.save();

  return ticket.populate('user', 'firstName lastName email role');
};
