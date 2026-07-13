// ============================================
// Users API Service Integration
// ============================================
import api from './api';

const userService = {
  getUsers: async () => {
    const res = await api.get('/users');
    return res.data;
  },
};

export default userService;
