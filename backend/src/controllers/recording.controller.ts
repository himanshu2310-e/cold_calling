// ============================================
// Recording Controller
// ============================================
import { Request as ExpressRequest, Response, NextFunction } from 'express';

interface Request extends ExpressRequest {
  params: Record<string, string>;
}
import * as recordingService from '../services/recording.service';
import { successResponse, ApiError } from '../utils/apiResponse';

/**
 * POST /api/v1/recordings/upload
 */
export const uploadRecording = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      throw new ApiError(400, 'Audio file is required');
    }

    const { leadId, callId } = req.body;
    if (!leadId) {
      throw new ApiError(400, 'Lead ID is required');
    }

    const recording = await recordingService.saveRecording({
      leadId,
      callId,
      agentId: req.user!._id.toString(),
      filePath: req.file.path,
      originalName: req.file.originalname,
      fileSize: req.file.size,
    });

    res.status(201).json(
      successResponse({
        message: 'Recording uploaded and attached successfully',
        data: recording,
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/recordings/lead/:leadId
 */
export const getRecordingsByLead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const recordings = await recordingService.getRecordingsByLead(req.params.leadId);

    res.status(200).json(successResponse({ data: recordings }));
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/v1/recordings/:id
 */
export const deleteRecording = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await recordingService.deleteRecording(req.params.id, req.user!._id.toString());

    res.status(200).json(
      successResponse({ message: 'Recording deleted successfully' })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/recordings/logs
 */
export const getRecordingLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 25;

    const result = await recordingService.getRecordingLogs(page, limit);

    res.status(200).json(
      successResponse({
        data: result.recordings,
        pagination: result.pagination,
      })
    );
  } catch (error) {
    next(error);
  }
};
