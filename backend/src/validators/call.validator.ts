// ============================================
// Call Validators (Zod Schemas)
// ============================================
import { z } from 'zod';

export const startCallSchema = z.object({
  leadId: z.string({ required_error: 'Lead ID is required' }).min(1, 'Lead ID is required'),
});

export const endCallSchema = z.object({
  outcome: z.enum([
    'connected', 'no_answer', 'busy', 'voicemail',
    'wrong_number', 'callback', 'interested', 'not_interested', 'converted'
  ], { required_error: 'Outcome outcome is required' }),
  duration: z.number({ required_error: 'Duration duration is required' }).min(0),
  notes: z.string().max(5000).optional(),
  statusAfterCall: z.enum([
    'not_called', 'called', 'interested', 'callback',
    'follow_up', 'converted', 'invalid_number', 'duplicate'
  ]).optional(),
  priorityAfterCall: z.enum(['hot', 'warm', 'cold', 'vip', 'high', 'medium', 'low']).optional(),
  nextFollowUp: z.string().optional().or(z.literal('')),
});

export type StartCallInput = z.infer<typeof startCallSchema>;
export type EndCallInput = z.infer<typeof endCallSchema>;
