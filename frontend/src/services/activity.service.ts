// ============================================
// Activity Logging API Service
// ============================================
import api from './api';

const activityService = {
  getActivityLogs: async () => {
    const res = await api.get('/activities/logs');
    return res.data;
  },
};

export default activityService;
