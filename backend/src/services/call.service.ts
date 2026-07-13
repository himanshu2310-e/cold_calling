// ============================================
// Call Service — Business Logic
// ============================================
import mongoose from 'mongoose';
import Call, { ICallDocument } from '../models/Call';
import Lead from '../models/Lead';
import User from '../models/User';
import { ApiError } from '../utils/apiResponse';
import { logActivity } from './activity.service';
import { createFollowUp } from './followup.service';

interface StartCallParams {
  leadId: string;
  agentId: string;
}

interface EndCallParams {
  outcome: 'connected' | 'no_answer' | 'busy' | 'voicemail' | 'wrong_number' | 'callback' | 'interested' | 'not_interested' | 'converted';
  duration: number; // in seconds
  notes?: string;
  statusAfterCall?: string;
  priorityAfterCall?: string;
  nextFollowUp?: string;
}

/**
 * Start a new call.
 */
export const startCall = async (params: StartCallParams): Promise<ICallDocument> => {
  const { leadId, agentId } = params;

  if (!mongoose.Types.ObjectId.isValid(leadId)) {
    throw new ApiError(400, 'Invalid Lead ID');
  }

  const lead = await Lead.findById(leadId);
  if (!lead) {
    throw new ApiError(404, 'Lead not found');
  }

  const call = await Call.create({
    lead: new mongoose.Types.ObjectId(leadId),
    agent: new mongoose.Types.ObjectId(agentId),
    startTime: new Date(),
    outcome: 'no_answer', // default until ended
  });

  await logActivity({
    userId: agentId,
    action: 'call_started',
    entityType: 'call',
    entityId: call._id.toString(),
    metadata: { leadId, fullName: lead.fullName },
  });

  return call;
};

/**
 * End a call and update lead states.
 */
export const endCall = async (
  callId: string,
  data: EndCallParams,
  agentId: string
): Promise<ICallDocument> => {
  if (!mongoose.Types.ObjectId.isValid(callId)) {
    throw new ApiError(400, 'Invalid Call ID');
  }

  const call = await Call.findById(callId);
  if (!call) {
    throw new ApiError(404, 'Call session not found');
  }

  if (call.agent.toString() !== agentId) {
    throw new ApiError(403, 'You are not authorized to update this call session');
  }

  // Update Call object
  call.endTime = new Date();
  call.duration = data.duration;
  call.outcome = data.outcome;
  call.notes = data.notes;
  call.statusAfterCall = data.statusAfterCall;
  call.priorityAfterCall = data.priorityAfterCall;
  call.nextFollowUp = data.nextFollowUp ? new Date(data.nextFollowUp) : undefined;
  await call.save();

  // Update corresponding Lead state
  const lead = await Lead.findById(call.lead);
  if (lead) {
    lead.callCount += 1;

    if (data.statusAfterCall) {
      lead.status = data.statusAfterCall;
    } else {
      // Automatic state progression: if calling is successful, mark as called
      lead.status = 'called';
    }

    if (data.priorityAfterCall) {
      lead.priority = data.priorityAfterCall;
    }

    if (data.nextFollowUp) {
      lead.nextFollowUp = new Date(data.nextFollowUp);
      await createFollowUp({
        leadId: lead._id.toString(),
        agentId,
        scheduledDate: data.nextFollowUp,
        notes: data.notes ? `Call outcomes: ${data.notes}` : 'Scheduled from call outcomes',
      });
    }

    await lead.save();
  }

  await logActivity({
    userId: agentId,
    action: 'call_finished',
    entityType: 'call',
    entityId: callId,
    metadata: {
      leadId: call.lead.toString(),
      duration: data.duration,
      outcome: data.outcome,
      statusAfterCall: data.statusAfterCall,
    },
  });

  return call;
};

/**
 * Get call logs for a specific Lead.
 */
export const getCallsByLead = async (leadId: string): Promise<ICallDocument[]> => {
  if (!mongoose.Types.ObjectId.isValid(leadId)) {
    throw new ApiError(400, 'Invalid Lead ID');
  }

  const calls = await Call.find({ lead: new mongoose.Types.ObjectId(leadId) })
    .populate('agent', 'firstName lastName email avatar')
    .sort({ startTime: -1 });

  return calls;
};

/**
 * Get paginated call history for an agent.
 */
export const getCallsByAgent = async (
  agentId: string,
  page = 1,
  limit = 25
) => {
  const skip = (page - 1) * limit;
  const filter = { agent: new mongoose.Types.ObjectId(agentId) };

  const [calls, total] = await Promise.all([
    Call.find(filter)
      .populate('lead', 'fullName company phone email')
      .sort({ startTime: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Call.countDocuments(filter),
  ]);

  return {
    calls,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get all calls for admin reports.
 */
export const getCallLogs = async (query: { page?: number; limit?: number; search?: string; outcome?: string } = {}) => {
  const page = query.page || 1;
  const limit = query.limit || 25;
  const skip = (page - 1) * limit;

  const filter: Record<string, any> = {};

  if (query.outcome) {
    filter.outcome = query.outcome;
  }

  if (query.search) {
    const searchRegex = { $regex: query.search, $options: 'i' };

    // Find matching leads
    const matchingLeads = await Lead.find({
      $or: [
        { fullName: searchRegex },
        { company: searchRegex },
        { phone: searchRegex },
      ],
    }).select('_id');

    // Find matching agents (Users)
    const matchingAgents = await User.find({
      $or: [
        { firstName: searchRegex },
        { lastName: searchRegex },
      ],
    }).select('_id');

    const leadIds = matchingLeads.map((l) => l._id);
    const agentIds = matchingAgents.map((a) => a._id);

    filter.$or = [
      { lead: { $in: leadIds } },
      { agent: { $in: agentIds } },
    ];
  }

  const [calls, total] = await Promise.all([
    Call.find(filter)
      .populate('lead', 'fullName company phone')
      .populate('agent', 'firstName lastName role')
      .sort({ startTime: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Call.countDocuments(filter),
  ]);

  return {
    calls,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};
