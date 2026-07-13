// ============================================
// Auth Middleware — JWT verification & RBAC
// ============================================
import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/token';
import { ApiError } from '../utils/apiResponse';
import User, { IUserDocument } from '../models/User';

// Extend Express Request to carry the authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: IUserDocument;
    }
  }
}

/**
 * Protect routes — requires a valid access token in the Authorization header.
 */
export const protect = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    if (!token) {
      throw new ApiError(401, 'Access denied. No token provided.');
    }

    // Verify token
    const decoded = verifyAccessToken(token);

    // Find the user and attach to request
    const user = await User.findById(decoded.userId);

    if (!user) {
      throw new ApiError(401, 'User belonging to this token no longer exists.');
    }

    if (!user.isActive) {
      throw new ApiError(401, 'Your account has been deactivated.');
    }

    if (user.isSuspended) {
      throw new ApiError(403, 'Your account has been suspended. Contact your administrator.');
    }

    req.user = user;
    next();
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      return next(error);
    }
    // JWT errors
    if (error && typeof error === 'object' && 'name' in error) {
      const jwtError = error as { name: string };
      if (jwtError.name === 'JsonWebTokenError') {
        return next(new ApiError(401, 'Invalid token.'));
      }
      if (jwtError.name === 'TokenExpiredError') {
        return next(new ApiError(401, 'Token has expired.'));
      }
    }
    next(new ApiError(401, 'Authentication failed.'));
  }
};

/**
 * Restrict access to specific roles.
 * Usage: authorize('admin', 'manager')
 */
export const authorize = (...roles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required.'));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError(403, `Role '${req.user.role}' is not authorized to access this resource.`)
      );
    }

    next();
  };
};
