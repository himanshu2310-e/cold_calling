// ============================================
// Lead Service — Business Logic
// ============================================
import mongoose from 'mongoose';
import Lead, { ILeadDocument } from '../models/Lead';
import { ApiError } from '../utils/apiResponse';
import { logActivity } from './activity.service';
import { createNotification } from './notification.service';

interface LeadQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  priority?: string;
  assignedTo?: string;
  leadSource?: string;
  industry?: string;
  city?: string;
  state?: string;
  country?: string;
  tags?: string;
  isFavorite?: boolean;
  isPinned?: boolean;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Get leads with pagination, search, and filters.
 */
export const getLeads = async (query: LeadQuery = {}, userRole?: string, userId?: string) => {
  const {
    page = 1,
    limit = 25,
    search,
    status,
    priority,
    assignedTo,
    leadSource,
    industry,
    city,
    state,
    country,
    tags,
    isFavorite,
    isPinned,
    dateFrom,
    dateTo,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = query;

  const filter: Record<string, unknown> = {};

  // Role-based filtering: agents only see their own leads
  if (userRole === 'agent' && userId) {
    filter.assignedTo = new mongoose.Types.ObjectId(userId);
  } else if (assignedTo) {
    filter.assignedTo = new mongoose.Types.ObjectId(assignedTo);
  }

  // Status filter (comma-separated)
  if (status) {
    const statuses = status.split(',').map((s) => s.trim());
    filter.status = statuses.length === 1 ? statuses[0] : { $in: statuses };
  }

  // Priority filter (comma-separated)
  if (priority) {
    const priorities = priority.split(',').map((p) => p.trim());
    filter.priority = priorities.length === 1 ? priorities[0] : { $in: priorities };
  }

  // Other filters
  if (leadSource) filter.leadSource = leadSource;
  if (industry) filter.industry = industry;
  if (city) filter.city = { $regex: city, $options: 'i' };
  if (state) filter.state = { $regex: state, $options: 'i' };
  if (country) filter.country = { $regex: country, $options: 'i' };
  if (typeof isFavorite === 'boolean') filter.isFavorite = isFavorite;
  if (typeof isPinned === 'boolean') filter.isPinned = isPinned;

  // Tags filter (comma-separated)
  if (tags) {
    const tagList = tags.split(',').map((t) => t.trim());
    filter.tags = { $all: tagList };
  }

  // Date range
  if (dateFrom || dateTo) {
    filter.createdAt = {};
    if (dateFrom) (filter.createdAt as Record<string, unknown>).$gte = new Date(dateFrom);
    if (dateTo) (filter.createdAt as Record<string, unknown>).$lte = new Date(dateTo);
  }

  // Search (full-text or regex)
  if (search) {
    filter.$or = [
      { fullName: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { company: { $regex: search, $options: 'i' } },
      { city: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (page - 1) * limit;

  // Priority sort weight for "hot first" ordering
  const priorityWeight: Record<string, number> = {
    hot: 0, vip: 1, high: 2, warm: 3, medium: 4, cold: 5, low: 6,
  };

  let sort: Record<string, 1 | -1> = {};

  // Pinned leads always on top
  sort = { isPinned: -1 };

  if (sortBy === 'priority') {
    // Custom priority sort is handled post-query, or we use a default
    sort.priority = sortOrder === 'asc' ? 1 : -1;
  } else {
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
  }

  const [leads, total] = await Promise.all([
    Lead.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('assignedTo', 'firstName lastName email avatar role isOnline')
      .populate('createdBy', 'firstName lastName email')
      .lean(),
    Lead.countDocuments(filter),
  ]);

  return {
    leads,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get a single lead by ID with full details.
 */
export const getLeadById = async (id: string): Promise<ILeadDocument> => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'Invalid lead ID.');
  }

  const lead = await Lead.findById(id)
    .populate('assignedTo', 'firstName lastName email avatar role isOnline')
    .populate('createdBy', 'firstName lastName email');

  if (!lead) {
    throw new ApiError(404, 'Lead not found.');
  }

  return lead;
};

/**
 * Create a new lead.
 */
export const createLead = async (
  data: Record<string, unknown>,
  userId: string
): Promise<ILeadDocument> => {
  // Clean empty strings to undefined
  const cleaned = cleanLeadData(data);

  const lead = await Lead.create({
    ...cleaned,
    createdBy: new mongoose.Types.ObjectId(userId),
  });

  await logActivity({
    userId,
    action: 'lead_created',
    entityType: 'lead',
    entityId: lead._id.toString(),
    metadata: { fullName: lead.fullName, phone: lead.phone },
  });

  if (lead.assignedTo) {
    await createNotification({
      recipientId: lead.assignedTo.toString(),
      senderId: userId,
      type: 'lead_assigned',
      title: 'New Lead Assigned',
      message: `Lead "${lead.fullName}" has been assigned to you.`,
      data: { leadId: lead._id.toString() },
    });
  }

  // Populate and return
  return Lead.findById(lead._id)
    .populate('assignedTo', 'firstName lastName email avatar role isOnline')
    .populate('createdBy', 'firstName lastName email') as Promise<ILeadDocument>;
};

/**
 * Update a lead by ID.
 */
export const updateLead = async (
  id: string,
  data: Record<string, unknown>,
  userId: string
): Promise<ILeadDocument> => {
  const lead = await Lead.findById(id);
  if (!lead) {
    throw new ApiError(404, 'Lead not found.');
  }

  const cleaned = cleanLeadData(data);
  const previousStatus = lead.status;
  const previousPriority = lead.priority;

  const previousAssigned = lead.assignedTo?.toString();
  Object.assign(lead, cleaned);
  await lead.save();

  const newAssigned = lead.assignedTo?.toString();
  if (newAssigned && newAssigned !== previousAssigned) {
    await createNotification({
      recipientId: newAssigned,
      senderId: userId,
      type: 'lead_assigned',
      title: 'New Lead Assigned',
      message: `Lead "${lead.fullName}" has been assigned to you.`,
      data: { leadId: lead._id.toString() },
    });
  }

  // Log status change specifically
  if (cleaned.status && cleaned.status !== previousStatus) {
    await logActivity({
      userId,
      action: 'status_updated',
      entityType: 'lead',
      entityId: id,
      metadata: { from: previousStatus, to: cleaned.status },
    });
  }

  // Log priority change specifically
  if (cleaned.priority && cleaned.priority !== previousPriority) {
    await logActivity({
      userId,
      action: 'priority_updated',
      entityType: 'lead',
      entityId: id,
      metadata: { from: previousPriority, to: cleaned.priority },
    });
  }

  await logActivity({
    userId,
    action: 'lead_updated',
    entityType: 'lead',
    entityId: id,
    metadata: { updatedFields: Object.keys(cleaned) },
  });

  return Lead.findById(id)
    .populate('assignedTo', 'firstName lastName email avatar role isOnline')
    .populate('createdBy', 'firstName lastName email') as Promise<ILeadDocument>;
};

/**
 * Delete a lead by ID.
 */
export const deleteLead = async (id: string, userId: string): Promise<void> => {
  const lead = await Lead.findById(id);
  if (!lead) {
    throw new ApiError(404, 'Lead not found.');
  }

  await Lead.findByIdAndDelete(id);

  await logActivity({
    userId,
    action: 'lead_deleted',
    entityType: 'lead',
    entityId: id,
    metadata: { fullName: lead.fullName, phone: lead.phone },
  });
};

/**
 * Toggle favorite status.
 */
export const toggleFavorite = async (id: string): Promise<ILeadDocument> => {
  const lead = await Lead.findById(id);
  if (!lead) throw new ApiError(404, 'Lead not found.');

  lead.isFavorite = !lead.isFavorite;
  await lead.save();
  return lead;
};

/**
 * Toggle pinned status.
 */
export const togglePinned = async (id: string): Promise<ILeadDocument> => {
  const lead = await Lead.findById(id);
  if (!lead) throw new ApiError(404, 'Lead not found.');

  lead.isPinned = !lead.isPinned;
  await lead.save();
  return lead;
};

// ---- Bulk Operations ----

/**
 * Bulk update status.
 */
export const bulkUpdateStatus = async (
  leadIds: string[],
  status: string,
  userId: string
): Promise<number> => {
  const result = await Lead.updateMany(
    { _id: { $in: leadIds.map((id) => new mongoose.Types.ObjectId(id)) } },
    { status }
  );

  await logActivity({
    userId,
    action: 'status_updated',
    entityType: 'lead',
    metadata: { count: result.modifiedCount, status, action: 'bulk' },
  });

  return result.modifiedCount;
};

/**
 * Bulk update priority.
 */
export const bulkUpdatePriority = async (
  leadIds: string[],
  priority: string,
  userId: string
): Promise<number> => {
  const result = await Lead.updateMany(
    { _id: { $in: leadIds.map((id) => new mongoose.Types.ObjectId(id)) } },
    { priority }
  );

  await logActivity({
    userId,
    action: 'priority_updated',
    entityType: 'lead',
    metadata: { count: result.modifiedCount, priority, action: 'bulk' },
  });

  return result.modifiedCount;
};

/**
 * Bulk assign to user.
 */
export const bulkAssign = async (
  leadIds: string[],
  assignedTo: string,
  userId: string
): Promise<number> => {
  const result = await Lead.updateMany(
    { _id: { $in: leadIds.map((id) => new mongoose.Types.ObjectId(id)) } },
    { assignedTo: new mongoose.Types.ObjectId(assignedTo) }
  );

  await logActivity({
    userId,
    action: 'lead_updated',
    entityType: 'lead',
    metadata: { count: result.modifiedCount, assignedTo, action: 'bulk_assign' },
  });

  if (result.modifiedCount > 0) {
    await createNotification({
      recipientId: assignedTo,
      senderId: userId,
      type: 'lead_assigned',
      title: 'Bulk Leads Assigned',
      message: `${result.modifiedCount} leads have been assigned to you.`,
      data: { count: result.modifiedCount },
    });
  }

  return result.modifiedCount;
};

/**
 * Bulk delete leads.
 */
export const bulkDelete = async (
  leadIds: string[],
  userId: string
): Promise<number> => {
  const result = await Lead.deleteMany({
    _id: { $in: leadIds.map((id) => new mongoose.Types.ObjectId(id)) },
  });

  await logActivity({
    userId,
    action: 'lead_deleted',
    entityType: 'lead',
    metadata: { count: result.deletedCount, action: 'bulk' },
  });

  return result.deletedCount;
};

// ---- Duplicate Detection ----

/**
 * Check for duplicate leads by phone, email, or company.
 */
export const checkDuplicates = async (
  data: { phone?: string; email?: string; company?: string },
  excludeId?: string
): Promise<{ duplicates: ILeadDocument[]; fields: string[] }> => {
  const conditions: Record<string, unknown>[] = [];
  const fields: string[] = [];

  if (data.phone) {
    conditions.push({ phone: data.phone });
    fields.push('phone');
  }
  if (data.email) {
    conditions.push({ email: data.email.toLowerCase() });
    fields.push('email');
  }
  if (data.company) {
    conditions.push({ company: { $regex: `^${data.company}$`, $options: 'i' } });
    fields.push('company');
  }

  if (conditions.length === 0) return { duplicates: [], fields: [] };

  const filter: Record<string, unknown> = { $or: conditions };
  if (excludeId) {
    filter._id = { $ne: new mongoose.Types.ObjectId(excludeId) };
  }

  const duplicates = await Lead.find(filter)
    .populate('assignedTo', 'firstName lastName email')
    .limit(10)
    .lean() as unknown as ILeadDocument[];

  return { duplicates, fields };
};

// ---- CSV Import ----

/**
 * Import leads from parsed CSV data.
 */
export const importLeads = async (
  leads: Record<string, unknown>[],
  userId: string,
  defaultAssignedTo: string,
  duplicateAction: string = 'skip'
): Promise<{
  totalRecords: number;
  createdCount: number;
  updatedCount: number;
  skippedCount: number;
  errors: string[];
}> => {
  let createdCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;
  const errors: string[] = [];

  for (let i = 0; i < leads.length; i++) {
    const row = leads[i];
    const rowNum = i + 2; // +2 for header row + 0-index

    try {
      const phone = String(row.phone || row.Phone || row.PHONE || '').trim();
      const fullName = String(row.fullName || row.full_name || row.name || row.Name || row.FULL_NAME || '').trim();

      if (!phone || !fullName) {
        errors.push(`Row ${rowNum}: Missing required field (name or phone)`);
        skippedCount++;
        continue;
      }

      // Check for duplicates
      const { duplicates } = await checkDuplicates({ phone });

      if (duplicates.length > 0) {
        if (duplicateAction === 'skip') {
          skippedCount++;
          continue;
        }
        if (duplicateAction === 'replace' || duplicateAction === 'overwrite') {
          await Lead.findByIdAndUpdate(duplicates[0]._id, {
            fullName,
            email: row.email || row.Email || undefined,
            company: row.company || row.Company || undefined,
            industry: row.industry || row.Industry || undefined,
            city: row.city || row.City || undefined,
            state: row.state || row.State || undefined,
            country: row.country || row.Country || undefined,
            leadSource: row.leadSource || row.lead_source || row.source || row.Source || undefined,
            priority: (row.priority as string) || undefined,
          });
          updatedCount++;
          continue;
        }
        // 'warn' and 'merge' — just import with duplicate status
      }

      await Lead.create({
        fullName,
        phone,
        email: row.email || row.Email || undefined,
        company: row.company || row.Company || undefined,
        industry: row.industry || row.Industry || undefined,
        website: row.website || row.Website || undefined,
        linkedin: row.linkedin || row.LinkedIn || undefined,
        city: row.city || row.City || undefined,
        state: row.state || row.State || undefined,
        country: row.country || row.Country || undefined,
        leadSource: row.leadSource || row.lead_source || row.source || row.Source || undefined,
        assignedTo: new mongoose.Types.ObjectId(row.assignedTo as string || defaultAssignedTo),
        createdBy: new mongoose.Types.ObjectId(userId),
        status: duplicates.length > 0 && duplicateAction === 'warn' ? 'duplicate' : 'not_called',
        priority: (row.priority as string) || 'medium',
      });

      createdCount++;
    } catch (err: any) {
      errors.push(`Row ${rowNum}: ${err.message || 'Unknown error'}`);
      skippedCount++;
    }
  }

  await logActivity({
    userId,
    action: 'csv_imported',
    entityType: 'lead',
    metadata: { imported: createdCount + updatedCount, skipped: skippedCount, duplicates: skippedCount + updatedCount },
  });

  return {
    totalRecords: leads.length,
    createdCount,
    updatedCount,
    skippedCount,
    errors,
  };
};

// ---- CSV Export ----

/**
 * Get leads formatted for CSV export.
 */
export const getLeadsForExport = async (
  query: LeadQuery = {},
  userRole?: string,
  userId?: string
) => {
  // Reuse getLeads but with no pagination limit
  const filter: Record<string, unknown> = {};

  if (userRole === 'agent' && userId) {
    filter.assignedTo = new mongoose.Types.ObjectId(userId);
  }
  if (query.status) {
    const statuses = query.status.split(',');
    filter.status = statuses.length === 1 ? statuses[0] : { $in: statuses };
  }
  if (query.priority) {
    const priorities = query.priority.split(',');
    filter.priority = priorities.length === 1 ? priorities[0] : { $in: priorities };
  }

  const leads = await Lead.find(filter)
    .populate('assignedTo', 'firstName lastName email')
    .populate('createdBy', 'firstName lastName email')
    .sort({ createdAt: -1 })
    .lean();

  return leads;
};

// ---- Stats ----

/**
 * Get lead statistics for dashboard.
 */
export const getLeadStats = async (userId?: string) => {
  const match: Record<string, unknown> = {};
  if (userId) match.assignedTo = new mongoose.Types.ObjectId(userId);

  const stats = await Lead.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        notCalled: { $sum: { $cond: [{ $eq: ['$status', 'not_called'] }, 1, 0] } },
        called: { $sum: { $cond: [{ $eq: ['$status', 'called'] }, 1, 0] } },
        interested: { $sum: { $cond: [{ $eq: ['$status', 'interested'] }, 1, 0] } },
        callback: { $sum: { $cond: [{ $eq: ['$status', 'callback'] }, 1, 0] } },
        followUp: { $sum: { $cond: [{ $eq: ['$status', 'follow_up'] }, 1, 0] } },
        converted: { $sum: { $cond: [{ $eq: ['$status', 'converted'] }, 1, 0] } },
        invalid: { $sum: { $cond: [{ $eq: ['$status', 'invalid_number'] }, 1, 0] } },
        duplicate: { $sum: { $cond: [{ $eq: ['$status', 'duplicate'] }, 1, 0] } },
      },
    },
  ]);

  return stats[0] || {
    total: 0, notCalled: 0, called: 0, interested: 0,
    callback: 0, followUp: 0, converted: 0, invalid: 0, duplicate: 0,
  };
};

// ---- Helpers ----

function cleanLeadData(data: Record<string, unknown>): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value === '' || value === null) continue;
    if (key === 'assignedTo' && typeof value === 'string') {
      cleaned[key] = new mongoose.Types.ObjectId(value);
    } else {
      cleaned[key] = value;
    }
  }
  return cleaned;
}
