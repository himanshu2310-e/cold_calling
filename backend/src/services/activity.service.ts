// ============================================
// Activity Service
// ============================================
import Activity from '../models/Activity';
import mongoose from 'mongoose';

interface LogActivityParams {
  userId: string;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Log a user activity. Fire-and-forget — never throws.
 */
export const logActivity = async (params: LogActivityParams): Promise<void> => {
  try {
    await Activity.create({
      user: new mongoose.Types.ObjectId(params.userId),
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId
        ? new mongoose.Types.ObjectId(params.entityId)
        : undefined,
      metadata: params.metadata,
    });
  } catch (error) {
    // Activity logging should never break the main flow
    console.error('⚠️  Failed to log activity:', error);
  }
};

/**
 * Get recent activities with pagination.
 */
export const getActivities = async (
  query: {
    userId?: string;
    entityType?: string;
    action?: string;
    page?: number;
    limit?: number;
  } = {}
) => {
  const { userId, entityType, action, page = 1, limit = 25 } = query;
  const filter: Record<string, unknown> = {};

  if (userId) filter.user = new mongoose.Types.ObjectId(userId);
  if (entityType) filter.entityType = entityType;
  if (action) filter.action = action;

  const skip = (page - 1) * limit;

  const [activities, total] = await Promise.all([
    Activity.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'firstName lastName email avatar role')
      .lean(),
    Activity.countDocuments(filter),
  ]);

  return {
    activities,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};
