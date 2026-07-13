// ============================================
// Activity Controller
// ============================================
import { Request as ExpressRequest, Response, NextFunction } from 'express';

interface Request extends ExpressRequest {
  params: Record<string, string>;
}
import Activity from '../models/Activity';
import { successResponse } from '../utils/apiResponse';
import mongoose from 'mongoose';

/**
 * GET /api/v1/activities/lead/:leadId
 */
export const getActivitiesByLead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { leadId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(leadId)) {
      res.status(400).json({ success: false, message: 'Invalid Lead ID' });
      return;
    }

    const activities = await Activity.find({
      entityType: 'lead',
      entityId: new mongoose.Types.ObjectId(leadId),
    })
      .populate('user', 'firstName lastName email avatar role')
      .sort({ createdAt: -1 });

    res.status(200).json(successResponse({ data: activities }));
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/activities/logs
 */
export const getActivityLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 25;
    const skip = (page - 1) * limit;

    const [activities, total] = await Promise.all([
      Activity.find()
        .populate('user', 'firstName lastName email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Activity.countDocuments(),
    ]);

    res.status(200).json(
      successResponse({
        data: activities,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      })
    );
  } catch (error) {
    next(error);
  }
};
