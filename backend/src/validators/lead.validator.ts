// ============================================
// Lead Validators (Zod Schemas)
// ============================================
import { z } from 'zod';

export const createLeadSchema = z.object({
  fullName: z
    .string({ required_error: 'Full name is required' })
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name cannot exceed 100 characters')
    .trim(),
  phone: z
    .string({ required_error: 'Phone number is required' })
    .min(5, 'Phone number must be at least 5 characters')
    .trim(),
  email: z.string().email('Invalid email').trim().toLowerCase().optional().or(z.literal('')),
  company: z.string().max(150).trim().optional().or(z.literal('')),
  industry: z.string().trim().optional().or(z.literal('')),
  website: z.string().trim().optional().or(z.literal('')),
  linkedin: z.string().trim().optional().or(z.literal('')),
  city: z.string().trim().optional().or(z.literal('')),
  state: z.string().trim().optional().or(z.literal('')),
  country: z.string().trim().optional().or(z.literal('')),
  leadSource: z.string().trim().optional().or(z.literal('')),
  description: z.string().trim().max(1000).optional().or(z.literal('')),
  assignedTo: z.string({ required_error: 'Assigned user is required' }).min(1, 'Assigned user is required'),
  status: z
    .enum([
      'not_called', 'called', 'interested', 'callback',
      'follow_up', 'converted', 'invalid_number', 'duplicate',
    ])
    .optional()
    .default('not_called'),
  priority: z
    .enum(['hot', 'warm', 'cold', 'vip', 'high', 'medium', 'low'])
    .optional()
    .default('medium'),
  tags: z.array(z.string()).optional().default([]),
  nextFollowUp: z.string().optional().or(z.literal('')),
});

export const updateLeadSchema = createLeadSchema.partial();

export const leadQuerySchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(25),
  search: z.string().optional(),
  status: z.string().optional(), // comma-separated
  priority: z.string().optional(), // comma-separated
  assignedTo: z.string().optional(),
  leadSource: z.string().optional(),
  industry: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  tags: z.string().optional(), // comma-separated
  isFavorite: z.string().optional().transform((v) => v === 'true' ? true : v === 'false' ? false : undefined),
  isPinned: z.string().optional().transform((v) => v === 'true' ? true : v === 'false' ? false : undefined),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  sortBy: z.string().optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const bulkStatusSchema = z.object({
  leadIds: z.array(z.string()).min(1, 'Select at least one lead'),
  status: z.enum([
    'not_called', 'called', 'interested', 'callback',
    'follow_up', 'converted', 'invalid_number', 'duplicate',
  ]),
});

export const bulkPrioritySchema = z.object({
  leadIds: z.array(z.string()).min(1, 'Select at least one lead'),
  priority: z.enum(['hot', 'warm', 'cold', 'vip', 'high', 'medium', 'low']),
});

export const bulkAssignSchema = z.object({
  leadIds: z.array(z.string()).min(1, 'Select at least one lead'),
  assignedTo: z.string().min(1, 'Assigned user is required'),
});

export const bulkDeleteSchema = z.object({
  leadIds: z.array(z.string()).min(1, 'Select at least one lead'),
});

export const csvImportSchema = z.object({
  duplicateAction: z.enum(['warn', 'skip', 'replace', 'merge']).optional().default('warn'),
});

export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;
export type LeadQueryInput = z.infer<typeof leadQuerySchema>;
