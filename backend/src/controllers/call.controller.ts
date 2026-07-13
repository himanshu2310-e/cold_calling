// ============================================
// Call Controller
// ============================================
import { Request as ExpressRequest, Response, NextFunction } from 'express';

interface Request extends ExpressRequest {
  params: Record<string, string>;
}
import * as callService from '../services/call.service';
import { successResponse } from '../utils/apiResponse';

/**
 * POST /api/v1/calls/start
 */
export const startCall = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const call = await callService.startCall({
      leadId: req.body.leadId,
      agentId: req.user!._id.toString(),
    });

    res.status(201).json(
      successResponse({
        message: 'Call session started successfully',
        data: call,
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/calls/:id/end
 */
export const endCall = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const call = await callService.endCall(
      req.params.id,
      req.body,
      req.user!._id.toString()
    );

    res.status(200).json(
      successResponse({
        message: 'Call outcomes saved successfully',
        data: call,
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/calls/lead/:leadId
 */
export const getCallsByLead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const calls = await callService.getCallsByLead(req.params.leadId);

    res.status(200).json(successResponse({ data: calls }));
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/calls/agent/history
 */
export const getMyCallHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 25;

    const result = await callService.getCallsByAgent(
      req.user!._id.toString(),
      page,
      limit
    );

    res.status(200).json(
      successResponse({
        data: result.calls,
        pagination: result.pagination,
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/calls/logs
 */
export const getCallLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await callService.getCallLogs(req.query as any);

    res.status(200).json(
      successResponse({
        data: result.calls,
        pagination: result.pagination,
      })
    );
  } catch (error) {
    next(error);
  }
};
