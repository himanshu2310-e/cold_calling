// ============================================
// ColdConnect CRM Shared Types
// ============================================

export type UserRole = 'admin' | 'manager' | 'agent';

export interface IUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
}

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
  assignedTo?: IUser | string;
  status: LeadStatus;
  priority: LeadPriority;
  score?: number;
  isFavorite?: boolean;
  isPinned?: boolean;
  tags?: string[];
  createdAt: string;
}

export interface ICall {
  _id: string;
  lead: string | ILead;
  agent: string | IUser;
  outcome: string;
  duration: number; // in seconds
  notes?: string;
  recordingUrl?: string;
  createdAt: string;
}

export interface IFollowUp {
  _id: string;
  lead: string | ILead;
  agent: string | IUser;
  scheduledDate: string;
  notes?: string;
  isCompleted: boolean;
  createdAt: string;
}

export interface INotification {
  _id: string;
  recipientId: string;
  senderId?: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

export interface IActivity {
  _id: string;
  user?: IUser;
  action: string;
  details?: string;
  createdAt: string;
}
