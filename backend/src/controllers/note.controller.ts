// ============================================
// Note Controller
// ============================================
import { Request as ExpressRequest, Response, NextFunction } from 'express';

interface Request extends ExpressRequest {
  params: Record<string, string>;
}
import * as noteService from '../services/note.service';
import { successResponse, ApiError } from '../utils/apiResponse';

/**
 * POST /api/v1/notes
 */
export const createNote = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { leadId, content, mentions } = req.body;
    if (!leadId || !content) {
      throw new ApiError(400, 'Lead ID and note content are required');
    }

    const note = await noteService.createNote({
      leadId,
      content,
      createdBy: req.user!._id.toString(),
      mentions,
    });

    res.status(201).json(
      successResponse({
        message: 'Note added successfully',
        data: note,
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/notes/:id
 */
export const updateNote = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { content } = req.body;
    if (!content) {
      throw new ApiError(400, 'Note content is required');
    }

    const note = await noteService.updateNote(
      req.params.id,
      content,
      req.user!._id.toString()
    );

    res.status(200).json(
      successResponse({
        message: 'Note updated successfully',
        data: note,
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/v1/notes/:id
 */
export const deleteNote = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await noteService.deleteNote(req.params.id, req.user!._id.toString());

    res.status(200).json(
      successResponse({ message: 'Note deleted successfully' })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/notes/lead/:leadId
 */
export const getNotesByLead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const notes = await noteService.getNotesByLead(req.params.leadId);

    res.status(200).json(successResponse({ data: notes }));
  } catch (error) {
    next(error);
  }
};
