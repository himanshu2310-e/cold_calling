// ============================================
// Notification Controller
// ============================================
import { Request as ExpressRequest, Response, NextFunction } from 'express';

interface Request extends ExpressRequest {
  params: Record<string, string>;
}
import * as notificationService from '../services/notification.service';
import { successResponse } from '../utils/apiResponse';

/**
 * GET /api/v1/notifications
 */
export const getMyNotifications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await notificationService.getNotifications(
      req.user!._id.toString(),
      page,
      limit
    );

    res.status(200).json(
      successResponse({
        data: result.notifications,
        pagination: result.pagination,
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/notifications/:id/read
 */
export const markNotificationAsRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const notification = await notificationService.markAsRead(
      req.params.id,
      req.user!._id.toString()
    );

    res.status(200).json(
      successResponse({
        message: 'Notification marked as read',
        data: notification,
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/notifications/read-all
 */
export const markAllNotificationsAsRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await notificationService.markAllAsRead(req.user!._id.toString());

    res.status(200).json(
      successResponse({ message: 'All notifications marked as read' })
    );
  } catch (error) {
    next(error);
  }
};
