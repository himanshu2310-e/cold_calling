// ============================================
// Dashboard Analytics REST Services
// ============================================
import api from './api';

const dashboardService = {
  getAdminDashboard: async () => {
    const res = await api.get('/dashboard/admin');
    return res.data;
  },
  getAgentDashboard: async () => {
    const res = await api.get('/dashboard/agent');
    return res.data;
  },
};

export default dashboardService;
