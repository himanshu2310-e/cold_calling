// ============================================
// Support Ticket API Services Integration
// ============================================
import api from './api';

const ticketService = {
  createTicket: async (payload: {
    subject: string;
    description: string;
    category: string;
    priority: string;
  }) => {
    const res = await api.post('/tickets', payload);
    return res.data;
  },
  getTickets: async (params: any = {}) => {
    const res = await api.get('/tickets', { params });
    return res.data;
  },
  updateTicketStatus: async (ticketId: string, status: string) => {
    const res = await api.put(`/tickets/${ticketId}/status`, { status });
    return res.data;
  },
};

export default ticketService;
