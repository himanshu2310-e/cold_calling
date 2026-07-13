// ============================================
// ColdConnect CRM Global Constants
// ============================================

import { LeadStatus, LeadPriority } from '@/types';

export const LEAD_STATUS_CONFIG: Record<
  LeadStatus,
  { label: string; color: string; bg: string }
> = {
  not_called: { label: 'Not Called', color: '#A1A1AA', bg: 'rgba(161, 161, 170, 0.12)' },
  called: { label: 'Called', color: '#22C55E', bg: 'rgba(34, 197, 94, 0.12)' },
  interested: { label: 'Interested', color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.12)' },
  callback: { label: 'Callback', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.12)' },
  follow_up: { label: 'Follow Up', color: '#F97316', bg: 'rgba(249, 115, 22, 0.12)' },
  converted: { label: 'Converted', color: '#10B981', bg: 'rgba(16, 185, 129, 0.12)' },
  invalid_number: { label: 'Invalid', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)' },
  duplicate: { label: 'Duplicate', color: '#71717A', bg: 'rgba(113, 113, 122, 0.12)' },
};

export const LEAD_PRIORITY_CONFIG: Record<
  LeadPriority,
  { label: string; color: string; bg: string }
> = {
  hot: { label: 'Hot', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)' },
  warm: { label: 'Warm', color: '#F97316', bg: 'rgba(249, 115, 22, 0.12)' },
  cold: { label: 'Cold', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.12)' },
  vip: { label: 'VIP', color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.12)' },
  high: { label: 'High', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)' },
  medium: { label: 'Medium', color: '#F97316', bg: 'rgba(249, 115, 22, 0.12)' },
  low: { label: 'Low', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.12)' },
};

export const LEAD_SOURCES = [
  'Website',
  'Referral',
  'Social Media',
  'Cold List',
  'Google Search',
  'Direct Traffic',
  'Other',
];

export const INDUSTRIES = [
  'Technology',
  'Real Estate',
  'Finance',
  'Healthcare',
  'Education',
  'Manufacturing',
  'Retail',
  'Services',
  'Other',
];
