// ============================================
// Dashboard Controller
// ============================================
import { Request, Response, NextFunction } from 'express';
import * as dashboardService from '../services/dashboard.service';
import { successResponse } from '../utils/apiResponse';

/**
 * GET /api/v1/dashboard/admin
 */
export const getAdminDashboard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await dashboardService.getAdminStats();
    res.status(200).json(successResponse({ data: stats }));
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/dashboard/agent
 */
export const getAgentDashboard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await dashboardService.getAgentStats(req.user!._id.toString());
    res.status(200).json(successResponse({ data: stats }));
  } catch (error) {
    next(error);
  }
};
