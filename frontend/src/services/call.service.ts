// ============================================
// Call & Recording REST Services Integration
// ============================================
import api from './api';

const callService = {
  startCall: async (leadId: string) => {
    const res = await api.post('/calls/start', { leadId });
    return res.data;
  },
  endCall: async (callId: string, payload: any) => {
    const res = await api.put(`/calls/${callId}/end`, payload);
    return res.data;
  },
  uploadRecording: async (leadId: string, callId: string, file: File, onUploadProgress?: (progress: number) => void) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('leadId', leadId);
    if (callId) formData.append('callId', callId);

    const res = await api.post('/recordings/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onUploadProgress) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onUploadProgress(percentCompleted);
        }
      },
    });
    return res.data;
  },
  getTimeline: async (leadId: string) => {
    const res = await api.get(`/calls/lead/${leadId}`);
    return res.data;
  },
  getCallLogs: async (params: any = {}) => {
    const res = await api.get('/calls/logs', { params });
    return res.data;
  },
  deleteRecording: async (recordingId: string) => {
    const res = await api.delete(`/recordings/${recordingId}`);
    return res.data;
  },
  getRecordingsByLead: async (leadId: string) => {
    const res = await api.get(`/recordings/lead/${leadId}`);
    return res.data;
  },
  getRecordingLogs: async (params: any = {}) => {
    const res = await api.get('/recordings/logs', { params });
    return res.data;
  },
};

export default callService;
