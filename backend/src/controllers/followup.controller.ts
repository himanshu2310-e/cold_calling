// ============================================
// FollowUp Controller
// ============================================
import { Request as ExpressRequest, Response, NextFunction } from 'express';

interface Request extends ExpressRequest {
  params: Record<string, string>;
}
import * as followupService from '../services/followup.service';
import { successResponse } from '../utils/apiResponse';

/**
 * POST /api/v1/followups
 */
export const createFollowUp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const followup = await followupService.createFollowUp({
      ...req.body,
      agentId: req.user!._id.toString(),
    });

    res.status(201).json(
      successResponse({
        message: 'Follow-up call scheduled successfully',
        data: followup,
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/followups
 */
export const getMyFollowUps = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const agentId = req.user!.role === 'agent' ? req.user!._id.toString() : undefined;
    const followups = await followupService.getFollowUps(agentId, req.query as any);

    res.status(200).json(successResponse({ data: followups }));
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/followups/:id/complete
 */
export const completeFollowUp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const followup = await followupService.completeFollowUp(
      req.params.id,
      req.user!._id.toString()
    );

    res.status(200).json(
      successResponse({
        message: 'Follow-up marked as completed',
        data: followup,
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/followups/trigger-reminders (Trigger manually for testing)
 */
export const triggerReminders = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const count = await followupService.checkAndSendReminders();
    res.status(200).json(
      successResponse({ message: `Triggered reminders. ${count} notifications sent.` })
    );
  } catch (error) {
    next(error);
  }
};
