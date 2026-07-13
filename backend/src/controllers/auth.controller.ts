// ============================================
// Auth Controller
// ============================================
import { Request as ExpressRequest, Response, NextFunction } from 'express';

interface Request extends ExpressRequest {
  params: Record<string, string>;
}
import * as authService from '../services/auth.service';
import { successResponse } from '../utils/apiResponse';
import env from '../config/env';

/**
 * POST /api/v1/auth/register
 */
export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await authService.registerUser(req.body);

    // Set refresh token as HTTP-only cookie
    setRefreshTokenCookie(res, result.tokens.refreshToken);

    res.status(201).json(
      successResponse({
        message: 'User registered successfully',
        data: {
          user: result.user,
          accessToken: result.tokens.accessToken,
        },
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/auth/login
 */
export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, rememberMe } = req.body;
    const result = await authService.loginUser(email, password, rememberMe);

    // Set refresh token as HTTP-only cookie
    setRefreshTokenCookie(res, result.tokens.refreshToken, rememberMe);

    res.status(200).json(
      successResponse({
        message: 'Login successful',
        data: {
          user: result.user,
          accessToken: result.tokens.accessToken,
        },
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/auth/refresh
 */
export const refresh = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
      res.status(401).json({ success: false, message: 'Refresh token is required.' });
      return;
    }

    const tokens = await authService.refreshTokens(refreshToken);

    // Rotate the cookie
    setRefreshTokenCookie(res, tokens.refreshToken);

    res.status(200).json(
      successResponse({
        message: 'Token refreshed',
        data: { accessToken: tokens.accessToken },
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/auth/logout
 */
export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.user) {
      await authService.logoutUser(req.user._id.toString());
    }

    // Clear the refresh token cookie
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: env.isProd,
      sameSite: 'lax',
      path: '/',
    });

    res.status(200).json(successResponse({ message: 'Logged out successfully' }));
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/auth/forgot-password
 */
export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await authService.forgotPassword(req.body.email);

    // Always return success to not reveal whether email exists
    res.status(200).json(
      successResponse({
        message: 'If an account with that email exists, a password reset link has been sent.',
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/auth/reset-password/:token
 */
export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    await authService.resetPassword(token, password);

    res.status(200).json(
      successResponse({ message: 'Password reset successful. You can now login.' })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/auth/me
 */
export const getMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.status(200).json(
      successResponse({
        data: req.user!.toSafeObject(),
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/auth/profile
 */
export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { firstName, lastName, phone } = req.body;

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone !== undefined) user.phone = phone;

    await user.save();

    res.status(200).json(
      successResponse({
        message: 'Profile updated successfully',
        data: user.toSafeObject(),
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/auth/change-password
 */
export const changePassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { currentPassword, newPassword } = req.body;
    await authService.changePassword(req.user!._id.toString(), currentPassword, newPassword);

    // Clear refresh cookie to force re-login
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: env.isProd,
      sameSite: 'lax',
      path: '/',
    });

    res.status(200).json(
      successResponse({ message: 'Password changed successfully. Please login again.' })
    );
  } catch (error) {
    next(error);
  }
};

// ---- Helper ----

function setRefreshTokenCookie(
  res: Response,
  token: string,
  rememberMe: boolean = false
): void {
  const maxAge = rememberMe
    ? 30 * 24 * 60 * 60 * 1000 // 30 days
    : 7 * 24 * 60 * 60 * 1000; // 7 days

  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: env.isProd,
    sameSite: 'lax',
    maxAge,
    path: '/',
  });
}
