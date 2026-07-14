// ============================================
// Auth Services Integration
// ============================================
import api from './api';

const authService = {
  login: async (payload: any) => {
    const res = await api.post('/auth/login', payload);
    return res;
  },
  logout: async () => {
    const res = await api.post('/auth/logout');
    return res.data;
  },
  getProfile: async () => {
    const res = await api.get('/auth/profile');
    return res.data;
  },
  forgotPassword: async (payload: any) => {
    const res = await api.post('/auth/forgot-password', payload);
    return res.data;
  },
  resetPassword: async (payload: any) => {
    const res = await api.post('/auth/reset-password', payload);
    return res.data;
  },
};

export default authService;
