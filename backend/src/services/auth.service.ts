// ============================================
// Auth Service — Business logic
// ============================================
import crypto from 'crypto';
import User, { IUserDocument } from '../models/User';
import { ApiError } from '../utils/apiResponse';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  generateResetToken,
} from '../utils/token';
import { logActivity } from './activity.service';

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface LoginResult {
  user: Record<string, unknown>;
  tokens: AuthTokens;
}

/**
 * Register a new user (admin-only operation in production).
 */
export const registerUser = async (data: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role?: string;
  phone?: string;
}): Promise<LoginResult> => {
  // Check if user already exists
  const existingUser = await User.findOne({ email: data.email });
  if (existingUser) {
    throw new ApiError(409, 'A user with this email already exists.');
  }

  // Create user
  const user = await User.create({
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    password: data.password,
    role: data.role || 'agent',
    phone: data.phone,
  });

  // Generate tokens
  const tokens = generateTokenPair(user);

  // Save refresh token
  user.refreshToken = tokens.refreshToken;
  await user.save();

  // Log activity
  await logActivity({
    userId: user._id.toString(),
    action: 'user_created',
    entityType: 'user',
    entityId: user._id.toString(),
  });

  return {
    user: user.toSafeObject(),
    tokens,
  };
};

/**
 * Authenticate a user with email and password.
 */
export const loginUser = async (
  email: string,
  password: string,
  rememberMe: boolean = false
): Promise<LoginResult> => {
  // Find user with password field included
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    throw new ApiError(401, 'Invalid email or password.');
  }

  if (!user.isActive) {
    throw new ApiError(401, 'Your account has been deactivated.');
  }

  if (user.isSuspended) {
    throw new ApiError(403, 'Your account has been suspended. Contact your administrator.');
  }

  // Check password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new ApiError(401, 'Invalid email or password.');
  }

  // Generate tokens
  const tokens = generateTokenPair(user);

  // Update user
  user.refreshToken = tokens.refreshToken;
  user.lastLogin = new Date();
  user.isOnline = true;
  await user.save();

  // Log activity
  await logActivity({
    userId: user._id.toString(),
    action: 'user_login',
    entityType: 'user',
    entityId: user._id.toString(),
  });

  return {
    user: user.toSafeObject(),
    tokens,
  };
};

/**
 * Refresh the access token using a valid refresh token.
 */
export const refreshTokens = async (refreshToken: string): Promise<AuthTokens> => {
  try {
    const decoded = verifyRefreshToken(refreshToken);

    const user = await User.findById(decoded.userId).select('+refreshToken');
    if (!user || user.refreshToken !== refreshToken) {
      throw new ApiError(401, 'Invalid refresh token.');
    }

    if (!user.isActive || user.isSuspended) {
      throw new ApiError(403, 'Account is inactive or suspended.');
    }

    // Generate new token pair
    const tokens = generateTokenPair(user);

    // Rotate refresh token
    user.refreshToken = tokens.refreshToken;
    await user.save();

    return tokens;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(401, 'Invalid or expired refresh token.');
  }
};

/**
 * Logout — clear the refresh token and set offline.
 */
export const logoutUser = async (userId: string): Promise<void> => {
  await User.findByIdAndUpdate(userId, {
    refreshToken: undefined,
    isOnline: false,
  });

  await logActivity({
    userId,
    action: 'user_logout',
    entityType: 'user',
    entityId: userId,
  });
};

/**
 * Generate a password reset token and "send" it.
 * In development, the token is logged to the console.
 */
export const forgotPassword = async (email: string): Promise<void> => {
  const user = await User.findOne({ email });
  if (!user) {
    // Don't reveal whether the email exists
    return;
  }

  const resetToken = generateResetToken();
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

  user.passwordResetToken = hashedToken;
  user.passwordResetExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
  await user.save({ validateBeforeSave: false });

  // In production, send email. For now, log the token.
  console.log(`🔑 Password reset token for ${email}: ${resetToken}`);

  // TODO: Integrate with email service (Resend, SendGrid, Nodemailer)
};

/**
 * Reset password using a valid reset token.
 */
export const resetPassword = async (token: string, newPassword: string): Promise<void> => {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: new Date() },
  }).select('+passwordResetToken +passwordResetExpires');

  if (!user) {
    throw new ApiError(400, 'Invalid or expired password reset token.');
  }

  user.password = newPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.refreshToken = undefined; // Force re-login
  await user.save();

  await logActivity({
    userId: user._id.toString(),
    action: 'password_changed',
    entityType: 'user',
    entityId: user._id.toString(),
    metadata: { method: 'reset' },
  });
};

/**
 * Change password for the currently authenticated user.
 */
export const changePassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<void> => {
  const user = await User.findById(userId).select('+password');
  if (!user) {
    throw new ApiError(404, 'User not found.');
  }

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw new ApiError(401, 'Current password is incorrect.');
  }

  user.password = newPassword;
  user.refreshToken = undefined; // Force re-login on other devices
  await user.save();

  await logActivity({
    userId,
    action: 'password_changed',
    entityType: 'user',
    entityId: userId,
    metadata: { method: 'change' },
  });
};

// ---- Helpers ----

function generateTokenPair(user: IUserDocument): AuthTokens {
  const payload = { userId: user._id.toString(), role: user.role };
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
}
