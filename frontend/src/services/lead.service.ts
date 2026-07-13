// ============================================
// Leads API Services Integration
// ============================================
import api from './api';

const leadService = {
  getLeads: async (params: any = {}) => {
    const res = await api.get('/leads', { params });
    return res.data;
  },
  getLeadById: async (id: string) => {
    const res = await api.get(`/leads/${id}`);
    return res.data;
  },
  createLead: async (payload: any) => {
    const res = await api.post('/leads', payload);
    return res.data;
  },
  updateLead: async (id: string, payload: any) => {
    const res = await api.put(`/leads/${id}`, payload);
    return res.data;
  },
  deleteLead: async (id: string) => {
    const res = await api.delete(`/leads/${id}`);
    return res.data;
  },
  bulkUpdateStatus: async (ids: string[], status: string) => {
    const res = await api.post('/leads/bulk/status', { leadIds: ids, status });
    return res.data;
  },
  bulkUpdatePriority: async (ids: string[], priority: string) => {
    const res = await api.post('/leads/bulk/priority', { leadIds: ids, priority });
    return res.data;
  },
  bulkAssign: async (ids: string[], userId: string) => {
    const res = await api.post('/leads/bulk/assign', { leadIds: ids, assignedTo: userId });
    return res.data;
  },
  bulkDelete: async (ids: string[]) => {
    const res = await api.post('/leads/bulk/delete', { leadIds: ids });
    return res.data;
  },
  importLeadsJSON: async (leads: any[], duplicateAction: string) => {
    const res = await api.post('/leads/import', { leads, duplicateAction });
    return res.data;
  },
  exportLeadsCSV: async (params: any = {}) => {
    const res = await api.get('/leads/export', { params });
    const leads = res.data?.data || [];
    
    // Client-side JSON to CSV conversion
    const headers = ['fullName', 'phone', 'email', 'company', 'industry', 'website', 'city', 'state', 'country', 'leadSource', 'status', 'priority'];
    const csvContent = [
      headers.join(','),
      ...leads.map((row: any) =>
        headers.map((fieldName) => JSON.stringify(row[fieldName] || '')).join(',')
      )
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    return blob;
  },
  toggleFavorite: async (id: string) => {
    const res = await api.put(`/leads/${id}/favorite`);
    return res.data;
  },
  togglePinned: async (id: string) => {
    const res = await api.put(`/leads/${id}/pin`);
    return res.data;
  },
  checkDuplicate: async (fullName: string, phone: string) => {
    const res = await api.post('/leads/check-duplicates', { phone });
    const duplicates = res.data?.data?.duplicates || [];
    return {
      data: {
        isDuplicate: duplicates.length > 0,
        message: duplicates.length > 0 ? 'A duplicate lead was found' : '',
        lead: duplicates[0] || null
      }
    };
  },
};

export default leadService;
