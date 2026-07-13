// ============================================
// Follow Ups / Scheduler API Services
// ============================================
import api from './api';

const followupService = {
  getFollowUps: async (params: any = {}) => {
    const res = await api.get('/followups', { params });
    return res.data;
  },
  createFollowUp: async (payload: any) => {
    const res = await api.post('/followups', payload);
    return res.data;
  },
  completeFollowUp: async (id: string) => {
    const res = await api.put(`/followups/${id}/complete`);
    return res.data;
  },
};

export default followupService;
