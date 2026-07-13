// ============================================
// Settings Controller
// ============================================
import { Request as ExpressRequest, Response, NextFunction } from 'express';
import * as settingsService from '../services/settings.service';
import { successResponse, ApiError } from '../utils/apiResponse';

interface AuthenticatedRequest extends ExpressRequest {
  user?: {
    id: string;
    role: string;
  };
  params: Record<string, string>;
}

/**
 * GET /api/v1/settings/:key
 */
export const getSettingByKey = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { key } = req.params;
    const setting = await settingsService.getSetting(key);

    if (!setting) {
      // Return default values for typical keys to make initial setup robust
      if (key === 'crm_config') {
        const defaultVal = {
          companyName: 'ColdConnect CRM',
          officeHoursStart: '09:00',
          officeHoursEnd: '18:00',
          allowAgentImport: false,
          autoRecordCalls: true,
          dailyCallTarget: 30,
          retentionDays: 90,
        };
        res.status(200).json(successResponse({ data: { key, value: defaultVal } }));
        return;
      }
      throw new ApiError(404, `Setting with key '${key}' not found`);
    }

    res.status(200).json(successResponse({ data: setting }));
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/settings/:key
 */
export const updateSettingByKey = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      throw new ApiError(401, 'Unauthorized');
    }

    if (value === undefined) {
      throw new ApiError(400, 'Settings value is required');
    }

    const setting = await settingsService.updateSetting(key, value, userId);

    res.status(200).json(successResponse({
      message: 'Setting updated successfully',
      data: setting,
    }));
  } catch (error) {
    next(error);
  }
};
