// ============================================
// Settings API Services Integration
// ============================================
import api from './api';

const settingsService = {
  getSetting: async (key: string) => {
    const res = await api.get(`/settings/${key}`);
    return res.data;
  },
  updateSetting: async (key: string, value: unknown) => {
    const res = await api.put(`/settings/${key}`, { value });
    return res.data;
  },
};

export default settingsService;
