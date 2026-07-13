// ============================================
// User Service — Business logic
// ============================================
import User, { IUserDocument } from '../models/User';
import { ApiError } from '../utils/apiResponse';
import { logActivity } from './activity.service';
import mongoose from 'mongoose';

interface UserQuery {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Get all users with pagination, search, and filters.
 */
export const getUsers = async (query: UserQuery = {}) => {
  const {
    page = 1,
    limit = 25,
    search,
    role,
    isActive,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = query;

  const filter: Record<string, unknown> = {};

  if (role) filter.role = role;
  if (typeof isActive === 'boolean') filter.isActive = isActive;

  if (search) {
    filter.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (page - 1) * limit;
  const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

  const [users, total] = await Promise.all([
    User.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    User.countDocuments(filter),
  ]);

  return {
    users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get a single user by ID.
 */
export const getUserById = async (id: string): Promise<IUserDocument> => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'Invalid user ID.');
  }

  const user = await User.findById(id);
  if (!user) {
    throw new ApiError(404, 'User not found.');
  }

  return user;
};

/**
 * Create a new user (admin operation).
 */
export const createUser = async (
  data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role?: string;
    phone?: string;
  },
  createdByUserId: string
): Promise<IUserDocument> => {
  const existingUser = await User.findOne({ email: data.email });
  if (existingUser) {
    throw new ApiError(409, 'A user with this email already exists.');
  }

  const user = await User.create(data);

  await logActivity({
    userId: createdByUserId,
    action: 'user_created',
    entityType: 'user',
    entityId: user._id.toString(),
    metadata: { email: data.email, role: data.role || 'agent' },
  });

  return user;
};

/**
 * Update a user by ID.
 */
export const updateUser = async (
  id: string,
  data: Partial<{
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    phone: string;
    isActive: boolean;
  }>,
  updatedByUserId: string
): Promise<IUserDocument> => {
  const user = await User.findById(id);
  if (!user) {
    throw new ApiError(404, 'User not found.');
  }

  // Check for email uniqueness if email is being changed
  if (data.email && data.email !== user.email) {
    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
      throw new ApiError(409, 'A user with this email already exists.');
    }
  }

  Object.assign(user, data);
  await user.save();

  await logActivity({
    userId: updatedByUserId,
    action: 'user_updated',
    entityType: 'user',
    entityId: id,
    metadata: { updatedFields: Object.keys(data) },
  });

  return user;
};

/**
 * Delete a user by ID.
 */
export const deleteUser = async (id: string, deletedByUserId: string): Promise<void> => {
  const user = await User.findById(id);
  if (!user) {
    throw new ApiError(404, 'User not found.');
  }

  // Prevent self-deletion
  if (id === deletedByUserId) {
    throw new ApiError(400, 'You cannot delete your own account.');
  }

  await User.findByIdAndDelete(id);

  await logActivity({
    userId: deletedByUserId,
    action: 'user_updated',
    entityType: 'user',
    entityId: id,
    metadata: { action: 'deleted', email: user.email },
  });
};

/**
 * Suspend or unsuspend a user.
 */
export const suspendUser = async (
  id: string,
  suspend: boolean,
  adminUserId: string
): Promise<IUserDocument> => {
  const user = await User.findById(id);
  if (!user) {
    throw new ApiError(404, 'User not found.');
  }

  if (id === adminUserId) {
    throw new ApiError(400, 'You cannot suspend your own account.');
  }

  user.isSuspended = suspend;
  if (suspend) {
    user.isOnline = false;
    user.refreshToken = undefined;
  }
  await user.save();

  await logActivity({
    userId: adminUserId,
    action: 'user_suspended',
    entityType: 'user',
    entityId: id,
    metadata: { suspended: suspend },
  });

  return user;
};

/**
 * Admin resets another user's password.
 */
export const adminResetPassword = async (
  id: string,
  newPassword: string,
  adminUserId: string
): Promise<void> => {
  const user = await User.findById(id);
  if (!user) {
    throw new ApiError(404, 'User not found.');
  }

  user.password = newPassword;
  user.refreshToken = undefined; // Force re-login
  await user.save();

  await logActivity({
    userId: adminUserId,
    action: 'password_changed',
    entityType: 'user',
    entityId: id,
    metadata: { method: 'admin_reset' },
  });
};
