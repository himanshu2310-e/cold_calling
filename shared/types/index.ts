// ============================================
// ColdConnect CRM — Shared TypeScript Interfaces
// ============================================

// ---- User ----
export type UserRole = 'admin' | 'manager' | 'agent';

export interface IUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  isActive: boolean;
  isSuspended: boolean;
  isOnline: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

// ---- Lead ----
export type LeadStatus =
  | 'not_called'
  | 'called'
  | 'interested'
  | 'callback'
  | 'follow_up'
  | 'converted'
  | 'invalid_number'
  | 'duplicate';

export type LeadPriority = 'hot' | 'warm' | 'cold' | 'vip' | 'high' | 'medium' | 'low';

export interface ILead {
  _id: string;
  fullName: string;
  phone: string;
  email?: string;
  company?: string;
  industry?: string;
  website?: string;
  linkedin?: string;
  city?: string;
  state?: string;
  country?: string;
  leadSource?: string;
  assignedTo: string | IUser;
  createdBy: string | IUser;
  status: LeadStatus;
  priority: LeadPriority;
  callCount: number;
  recordingCount: number;
  notesCount: number;
  nextFollowUp?: string;
  tags: string[];
  isFavorite: boolean;
  isPinned: boolean;
  aiScore?: number;
  createdAt: string;
  updatedAt: string;
}

// ---- Call ----
export type CallOutcome =
  | 'connected'
  | 'no_answer'
  | 'busy'
  | 'voicemail'
  | 'wrong_number'
  | 'callback'
  | 'interested'
  | 'not_interested'
  | 'converted';

export interface ICall {
  _id: string;
  lead: string | ILead;
  agent: string | IUser;
  startTime: string;
  endTime?: string;
  duration: number;
  outcome: CallOutcome;
  notes?: string;
  statusAfterCall?: LeadStatus;
  priorityAfterCall?: LeadPriority;
  nextFollowUp?: string;
  createdAt: string;
}

// ---- Recording ----
export interface IRecording {
  _id: string;
  lead: string | ILead;
  call?: string | ICall;
  agent: string | IUser;
  url: string;
  publicId: string;
  format: string;
  duration: number;
  fileSize: number;
  createdAt: string;
}

// ---- Note ----
export interface INote {
  _id: string;
  lead: string | ILead;
  createdBy: string | IUser;
  content: string;
  mentions: string[] | IUser[];
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
}

// ---- Notification ----
export type NotificationType =
  | 'lead_assigned'
  | 'recording_uploaded'
  | 'status_changed'
  | 'follow_up_reminder'
  | 'mention'
  | 'system';

export interface INotification {
  _id: string;
  recipient: string | IUser;
  sender?: string | IUser;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

// ---- Activity ----
export interface IActivity {
  _id: string;
  user: string | IUser;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

// ---- FollowUp ----
export interface IFollowUp {
  _id: string;
  lead: string | ILead;
  agent: string | IUser;
  scheduledDate: string;
  notes?: string;
  isCompleted: boolean;
  isRecurring: boolean;
  recurringInterval?: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  completedAt?: string;
  createdAt: string;
}

// ---- Settings ----
export interface ISetting {
  _id: string;
  key: string;
  value: unknown;
  updatedBy: string | IUser;
  updatedAt: string;
}

// ---- API Response ----
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
  pagination?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// ---- Auth ----
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse {
  user: IUser;
  tokens: AuthTokens;
}

// ---- Dashboard Widgets ----
export interface AdminDashboardStats {
  totalLeads: number;
  todaysCalls: number;
  pendingCalls: number;
  interestedLeads: number;
  convertedLeads: number;
  callbacks: number;
  missedCalls: number;
  invalidLeads: number;
  activeUsers: number;
  onlineUsers: number;
  monthlyGrowth: number;
}

export interface AgentDashboardStats {
  todaysCalls: number;
  assignedLeads: number;
  pendingLeads: number;
  completedCalls: number;
  interestedLeads: number;
  performanceScore: number;
}

// ---- Filters ----
export interface LeadFilters {
  status?: LeadStatus | LeadStatus[];
  priority?: LeadPriority | LeadPriority[];
  assignedTo?: string;
  leadSource?: string;
  industry?: string;
  city?: string;
  state?: string;
  country?: string;
  tags?: string[];
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  isFavorite?: boolean;
  isPinned?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
