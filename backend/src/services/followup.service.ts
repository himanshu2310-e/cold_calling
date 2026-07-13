// ============================================
// FollowUp & Calendar Service — Business Logic
// ============================================
import mongoose from 'mongoose';
import FollowUp, { IFollowUpDocument } from '../models/FollowUp';
import Lead from '../models/Lead';
import { ApiError } from '../utils/apiResponse';
import { logActivity } from './activity.service';
import { createNotification } from './notification.service';

interface CreateFollowUpParams {
  leadId: string;
  agentId: string;
  scheduledDate: string;
  notes?: string;
  isRecurring?: boolean;
  recurringInterval?: 'daily' | 'weekly' | 'biweekly' | 'monthly';
}

/**
 * Schedule a new follow-up.
 */
export const createFollowUp = async (params: CreateFollowUpParams): Promise<IFollowUpDocument> => {
  const { leadId, agentId, scheduledDate, notes, isRecurring = false, recurringInterval } = params;

  if (!mongoose.Types.ObjectId.isValid(leadId)) {
    throw new ApiError(400, 'Invalid Lead ID');
  }

  const lead = await Lead.findById(leadId);
  if (!lead) {
    throw new ApiError(404, 'Lead not found');
  }

  const followUp = await FollowUp.create({
    lead: new mongoose.Types.ObjectId(leadId),
    agent: new mongoose.Types.ObjectId(agentId),
    scheduledDate: new Date(scheduledDate),
    notes,
    isRecurring,
    recurringInterval,
  });

  // Update lead's nextFollowUp date
  lead.nextFollowUp = new Date(scheduledDate);
  await lead.save();

  await logActivity({
    userId: agentId,
    action: 'follow_up_created',
    entityType: 'follow_up',
    entityId: followUp._id.toString(),
    metadata: { leadId, scheduledDate },
  });

  return FollowUp.findById(followUp._id)
    .populate('lead', 'fullName company phone email')
    .populate('agent', 'firstName lastName email') as Promise<IFollowUpDocument>;
};

/**
 * Get follow-up items for an agent (optionally filtered by dates/completion).
 */
export const getFollowUps = async (
  agentId?: string,
  query: { start?: string; end?: string; isCompleted?: boolean } = {}
) => {
  const filter: Record<string, unknown> = {};

  if (agentId) {
    filter.agent = new mongoose.Types.ObjectId(agentId);
  }

  if (query.isCompleted !== undefined) {
    filter.isCompleted = query.isCompleted;
  }

  if (query.start || query.end) {
    filter.scheduledDate = {};
    if (query.start) (filter.scheduledDate as Record<string, unknown>).$gte = new Date(query.start);
    if (query.end) (filter.scheduledDate as Record<string, unknown>).$lte = new Date(query.end);
  }

  const followUps = await FollowUp.find(filter)
    .populate('lead', 'fullName company phone email status priority')
    .populate('agent', 'firstName lastName email avatar')
    .sort({ scheduledDate: 1 })
    .lean();

  return followUps;
};

/**
 * Mark a follow-up as completed.
 */
export const completeFollowUp = async (followUpId: string, agentId: string): Promise<IFollowUpDocument> => {
  if (!mongoose.Types.ObjectId.isValid(followUpId)) {
    throw new ApiError(400, 'Invalid FollowUp ID');
  }

  const followUp = await FollowUp.findById(followUpId);
  if (!followUp) {
    throw new ApiError(404, 'Follow-up not found');
  }

  if (followUp.agent.toString() !== agentId) {
    const user = await mongoose.model('User').findById(agentId);
    const isAdmin = user && ['admin', 'manager'].includes(user.role);
    if (!isAdmin) {
      throw new ApiError(403, 'Unauthorized');
    }
  }

  followUp.isCompleted = true;
  followUp.completedAt = new Date();
  await followUp.save();

  // Clean nextFollowUp on Lead if it was this followup
  const lead = await Lead.findById(followUp.lead);
  if (lead && lead.nextFollowUp && lead.nextFollowUp.getTime() === followUp.scheduledDate.getTime()) {
    // Find next uncompleted followup scheduled for the future
    const nextItem = await FollowUp.findOne({
      lead: lead._id,
      isCompleted: false,
      scheduledDate: { $gt: new Date() },
    }).sort({ scheduledDate: 1 });

    lead.nextFollowUp = nextItem ? nextItem.scheduledDate : undefined;
    await lead.save();
  }

  await logActivity({
    userId: agentId,
    action: 'follow_up_completed',
    entityType: 'follow_up',
    entityId: followUpId,
    metadata: { leadId: followUp.lead.toString() },
  });

  return followUp;
};

/**
 * Check for follow-ups due in the next 15 minutes and send real-time reminders.
 * This can be run in a cron job or scheduled intervals.
 */
export const checkAndSendReminders = async (): Promise<number> => {
  const now = new Date();
  const rangeEnd = new Date(now.getTime() + 15 * 60 * 1000); // 15 minutes from now

  const dueItems = await FollowUp.find({
    isCompleted: false,
    scheduledDate: { $gte: now, $lte: rangeEnd },
    reminderSent: { $ne: true },
  }).populate('lead', 'fullName');

  let sentCount = 0;
  for (const item of dueItems) {
    // Send Notification
    await createNotification({
      recipientId: item.agent.toString(),
      type: 'follow_up_reminder',
      title: 'Follow-up Call Reminder',
      message: `You have a scheduled follow-up with "${(item.lead as any).fullName}" in 15 minutes.`,
      data: { leadId: item.lead._id.toString(), followUpId: item._id.toString() },
    });

    item.reminderSent = true;
    await item.save();
    sentCount++;
  }

  return sentCount;
};
