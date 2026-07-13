// ============================================
// Notification Service — Business Logic
// ============================================
import mongoose from 'mongoose';
import Notification, { INotificationDocument } from '../models/Notification';
import { getIO } from '../sockets';
import { ApiError } from '../utils/apiResponse';

interface CreateNotificationParams {
  recipientId: string;
  senderId?: string;
  type: 'lead_assigned' | 'recording_uploaded' | 'status_changed' | 'follow_up_reminder' | 'mention' | 'system';
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

/**
 * Create a notification in DB and emit real-time event.
 */
export const createNotification = async (params: CreateNotificationParams): Promise<INotificationDocument> => {
  const { recipientId, senderId, type, title, message, data } = params;

  const notification = await Notification.create({
    recipient: new mongoose.Types.ObjectId(recipientId),
    sender: senderId ? new mongoose.Types.ObjectId(senderId) : undefined,
    type,
    title,
    message,
    data,
  });

  // Emit real-time event via Socket.io
  try {
    const io = getIO();
    io.to(`user:${recipientId}`).emit('notification:new', {
      _id: notification._id.toString(),
      type,
      title,
      message,
      data,
      isRead: false,
      createdAt: notification.createdAt,
    });
  } catch (err) {
    console.warn('Real-time socket emission failed:', err);
  }

  return notification;
};

/**
 * Get user notifications.
 */
export const getNotifications = async (userId: string, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const filter = { recipient: new mongoose.Types.ObjectId(userId) };

  const [notifications, total] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Notification.countDocuments(filter),
  ]);

  return {
    notifications,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Mark a single notification as read.
 */
export const markAsRead = async (id: string, userId: string): Promise<INotificationDocument> => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'Invalid Notification ID');
  }

  const notification = await Notification.findById(id);
  if (!notification) {
    throw new ApiError(404, 'Notification not found');
  }

  if (notification.recipient.toString() !== userId) {
    throw new ApiError(403, 'Unauthorized');
  }

  notification.isRead = true;
  await notification.save();

  return notification;
};

/**
 * Mark all notifications as read.
 */
export const markAllAsRead = async (userId: string): Promise<void> => {
  await Notification.updateMany(
    { recipient: new mongoose.Types.ObjectId(userId), isRead: false },
    { isRead: true }
  );
};
