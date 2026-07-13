// ============================================
// ColdConnect CRM — Shared Constants
// ============================================

// ---- User Roles ----
export const USER_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  AGENT: 'agent',
} as const;

export const USER_ROLE_LIST = Object.values(USER_ROLES);

// ---- Lead Statuses ----
export const LEAD_STATUSES = {
  NOT_CALLED: 'not_called',
  CALLED: 'called',
  INTERESTED: 'interested',
  CALLBACK: 'callback',
  FOLLOW_UP: 'follow_up',
  CONVERTED: 'converted',
  INVALID_NUMBER: 'invalid_number',
  DUPLICATE: 'duplicate',
} as const;

export const LEAD_STATUS_LIST = Object.values(LEAD_STATUSES);

export const LEAD_STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; borderColor: string }> = {
  [LEAD_STATUSES.NOT_CALLED]: {
    label: 'Not Called',
    color: '#EF4444',
    bgColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  [LEAD_STATUSES.CALLED]: {
    label: 'Called',
    color: '#22C55E',
    bgColor: 'rgba(34, 197, 94, 0.12)',
    borderColor: 'rgba(34, 197, 94, 0.25)',
  },
  [LEAD_STATUSES.INTERESTED]: {
    label: 'Interested',
    color: '#8B5CF6',
    bgColor: 'rgba(139, 92, 246, 0.12)',
    borderColor: 'rgba(139, 92, 246, 0.25)',
  },
  [LEAD_STATUSES.CALLBACK]: {
    label: 'Callback',
    color: '#3B82F6',
    bgColor: 'rgba(59, 130, 246, 0.12)',
    borderColor: 'rgba(59, 130, 246, 0.25)',
  },
  [LEAD_STATUSES.FOLLOW_UP]: {
    label: 'Follow Up',
    color: '#F97316',
    bgColor: 'rgba(249, 115, 22, 0.12)',
    borderColor: 'rgba(249, 115, 22, 0.25)',
  },
  [LEAD_STATUSES.CONVERTED]: {
    label: 'Converted',
    color: '#16A34A',
    bgColor: 'rgba(22, 163, 74, 0.12)',
    borderColor: 'rgba(22, 163, 74, 0.25)',
  },
  [LEAD_STATUSES.INVALID_NUMBER]: {
    label: 'Invalid Number',
    color: '#71717A',
    bgColor: 'rgba(113, 113, 122, 0.12)',
    borderColor: 'rgba(113, 113, 122, 0.25)',
  },
  [LEAD_STATUSES.DUPLICATE]: {
    label: 'Duplicate',
    color: '#18181B',
    bgColor: 'rgba(24, 24, 27, 0.40)',
    borderColor: 'rgba(24, 24, 27, 0.50)',
  },
};

// ---- Lead Priorities ----
export const LEAD_PRIORITIES = {
  HOT: 'hot',
  WARM: 'warm',
  COLD: 'cold',
  VIP: 'vip',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
} as const;

export const LEAD_PRIORITY_LIST = Object.values(LEAD_PRIORITIES);

/** Sort weight — lower number = higher priority (appears on top). */
export const LEAD_PRIORITY_WEIGHT: Record<string, number> = {
  [LEAD_PRIORITIES.HOT]: 0,
  [LEAD_PRIORITIES.VIP]: 1,
  [LEAD_PRIORITIES.HIGH]: 2,
  [LEAD_PRIORITIES.WARM]: 3,
  [LEAD_PRIORITIES.MEDIUM]: 4,
  [LEAD_PRIORITIES.COLD]: 5,
  [LEAD_PRIORITIES.LOW]: 6,
};

export const LEAD_PRIORITY_CONFIG: Record<string, { label: string; color: string; bgColor: string; borderColor: string }> = {
  [LEAD_PRIORITIES.HOT]: {
    label: 'Hot',
    color: '#EF4444',
    bgColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  [LEAD_PRIORITIES.WARM]: {
    label: 'Warm',
    color: '#F97316',
    bgColor: 'rgba(249, 115, 22, 0.12)',
    borderColor: 'rgba(249, 115, 22, 0.25)',
  },
  [LEAD_PRIORITIES.COLD]: {
    label: 'Cold',
    color: '#3B82F6',
    bgColor: 'rgba(59, 130, 246, 0.12)',
    borderColor: 'rgba(59, 130, 246, 0.25)',
  },
  [LEAD_PRIORITIES.VIP]: {
    label: 'VIP',
    color: '#A855F7',
    bgColor: 'rgba(168, 85, 247, 0.12)',
    borderColor: 'rgba(168, 85, 247, 0.25)',
  },
  [LEAD_PRIORITIES.HIGH]: {
    label: 'High',
    color: '#F59E0B',
    bgColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.25)',
  },
  [LEAD_PRIORITIES.MEDIUM]: {
    label: 'Medium',
    color: '#6366F1',
    bgColor: 'rgba(99, 102, 241, 0.12)',
    borderColor: 'rgba(99, 102, 241, 0.25)',
  },
  [LEAD_PRIORITIES.LOW]: {
    label: 'Low',
    color: '#71717A',
    bgColor: 'rgba(113, 113, 122, 0.12)',
    borderColor: 'rgba(113, 113, 122, 0.25)',
  },
};

// ---- Call Outcomes ----
export const CALL_OUTCOMES = {
  CONNECTED: 'connected',
  NO_ANSWER: 'no_answer',
  BUSY: 'busy',
  VOICEMAIL: 'voicemail',
  WRONG_NUMBER: 'wrong_number',
  CALLBACK: 'callback',
  INTERESTED: 'interested',
  NOT_INTERESTED: 'not_interested',
  CONVERTED: 'converted',
} as const;

export const CALL_OUTCOME_LIST = Object.values(CALL_OUTCOMES);

// ---- Notification Types ----
export const NOTIFICATION_TYPES = {
  LEAD_ASSIGNED: 'lead_assigned',
  RECORDING_UPLOADED: 'recording_uploaded',
  STATUS_CHANGED: 'status_changed',
  FOLLOW_UP_REMINDER: 'follow_up_reminder',
  MENTION: 'mention',
  SYSTEM: 'system',
} as const;

// ---- Activity Actions ----
export const ACTIVITY_ACTIONS = {
  LEAD_CREATED: 'lead_created',
  LEAD_UPDATED: 'lead_updated',
  LEAD_DELETED: 'lead_deleted',
  CALL_STARTED: 'call_started',
  CALL_FINISHED: 'call_finished',
  RECORDING_UPLOADED: 'recording_uploaded',
  NOTE_CREATED: 'note_created',
  NOTE_UPDATED: 'note_updated',
  USER_LOGIN: 'user_login',
  USER_LOGOUT: 'user_logout',
  USER_CREATED: 'user_created',
  USER_UPDATED: 'user_updated',
  USER_SUSPENDED: 'user_suspended',
  PASSWORD_CHANGED: 'password_changed',
  STATUS_UPDATED: 'status_updated',
  PRIORITY_UPDATED: 'priority_updated',
  CSV_IMPORTED: 'csv_imported',
  CSV_EXPORTED: 'csv_exported',
  FOLLOW_UP_CREATED: 'follow_up_created',
  FOLLOW_UP_COMPLETED: 'follow_up_completed',
} as const;

// ---- Lead Sources ----
export const LEAD_SOURCES = [
  'Website',
  'LinkedIn',
  'Referral',
  'Cold Call',
  'Email Campaign',
  'Social Media',
  'Trade Show',
  'Advertisement',
  'Partner',
  'Database',
  'Other',
] as const;

// ---- Industries ----
export const INDUSTRIES = [
  'Technology',
  'Healthcare',
  'Finance',
  'Education',
  'Real Estate',
  'Manufacturing',
  'Retail',
  'Consulting',
  'Media',
  'Telecommunications',
  'Energy',
  'Transportation',
  'Hospitality',
  'Legal',
  'Government',
  'Non-Profit',
  'Other',
] as const;

// ---- Allowed Recording Formats ----
export const ALLOWED_AUDIO_FORMATS = ['audio/mpeg', 'audio/wav', 'audio/x-m4a', 'audio/mp4', 'audio/mp3'];
export const ALLOWED_AUDIO_EXTENSIONS = ['.mp3', '.wav', '.m4a'];
export const MAX_RECORDING_SIZE = 50 * 1024 * 1024; // 50MB

// ---- Pagination ----
export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 25;
export const MAX_LIMIT = 100;

// ---- Socket Events ----
export const SOCKET_EVENTS = {
  // Connection
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',

  // User presence
  USER_ONLINE: 'user:online',
  USER_OFFLINE: 'user:offline',

  // Notifications
  NOTIFICATION_NEW: 'notification:new',
  NOTIFICATION_READ: 'notification:read',

  // Leads
  LEAD_CREATED: 'lead:created',
  LEAD_UPDATED: 'lead:updated',
  LEAD_STATUS_CHANGED: 'lead:status_changed',

  // Calls
  CALL_STARTED: 'call:started',
  CALL_ENDED: 'call:ended',

  // Recordings
  RECORDING_UPLOADED: 'recording:uploaded',

  // Dashboard
  DASHBOARD_UPDATE: 'dashboard:update',

  // Activity
  ACTIVITY_NEW: 'activity:new',

  // Follow-ups
  FOLLOW_UP_REMINDER: 'follow_up:reminder',
} as const;
