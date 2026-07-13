// ============================================
// Notes API Services Integration
// ============================================
import api from './api';

const noteService = {
  getNotesByLead: async (leadId: string) => {
    const res = await api.get(`/notes/lead/${leadId}`);
    return res.data;
  },
  createNote: async (payload: { lead: string; content: string }) => {
    const res = await api.post('/notes', payload);
    return res.data;
  },
  updateNote: async (id: string, content: string) => {
    const res = await api.put(`/notes/${id}`, { content });
    return res.data;
  },
  deleteNote: async (id: string) => {
    const res = await api.delete(`/notes/${id}`);
    return res.data;
  },
};

export default noteService;
