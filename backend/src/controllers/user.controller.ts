// ============================================
// User Controller
// ============================================
import { Request as ExpressRequest, Response, NextFunction } from 'express';

interface Request extends ExpressRequest {
  params: Record<string, string>;
}
import * as userService from '../services/user.service';
import { successResponse } from '../utils/apiResponse';

/**
 * GET /api/v1/users
 */
export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await userService.getUsers(req.query as any);

    res.status(200).json(
      successResponse({
        data: result.users,
        pagination: result.pagination,
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/users/:id
 */
export const getUserById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await userService.getUserById(req.params.id);

    res.status(200).json(
      successResponse({ data: user.toSafeObject() })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/users
 */
export const createUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await userService.createUser(req.body, req.user!._id.toString());

    res.status(201).json(
      successResponse({
        message: 'User created successfully',
        data: user.toSafeObject(),
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/users/:id
 */
export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await userService.updateUser(
      req.params.id,
      req.body,
      req.user!._id.toString()
    );

    res.status(200).json(
      successResponse({
        message: 'User updated successfully',
        data: user.toSafeObject(),
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/v1/users/:id
 */
export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await userService.deleteUser(req.params.id, req.user!._id.toString());

    res.status(200).json(
      successResponse({ message: 'User deleted successfully' })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/users/:id/suspend
 */
export const suspendUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { suspend } = req.body;
    const user = await userService.suspendUser(
      req.params.id,
      suspend !== false, // default to suspend
      req.user!._id.toString()
    );

    res.status(200).json(
      successResponse({
        message: user.isSuspended ? 'User suspended' : 'User unsuspended',
        data: user.toSafeObject(),
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/users/:id/reset-password
 */
export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { password } = req.body;
    await userService.adminResetPassword(
      req.params.id,
      password,
      req.user!._id.toString()
    );

    res.status(200).json(
      successResponse({ message: 'User password reset successfully' })
    );
  } catch (error) {
    next(error);
  }
};
