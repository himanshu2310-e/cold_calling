// ============================================
// Lead Controller
// ============================================
import { Request as ExpressRequest, Response, NextFunction } from 'express';

interface Request extends ExpressRequest {
  params: Record<string, string>;
}
import * as leadService from '../services/lead.service';
import { successResponse } from '../utils/apiResponse';

/**
 * GET /api/v1/leads
 */
export const getLeads = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await leadService.getLeads(
      req.query as any,
      req.user!.role,
      req.user!._id.toString()
    );

    res.status(200).json(
      successResponse({
        data: result.leads,
        pagination: result.pagination,
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/leads/stats
 */
export const getLeadStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.role === 'agent' ? req.user!._id.toString() : undefined;
    const stats = await leadService.getLeadStats(userId);

    res.status(200).json(successResponse({ data: stats }));
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/leads/export
 */
export const exportLeads = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const leads = await leadService.getLeadsForExport(
      req.query as any,
      req.user!.role,
      req.user!._id.toString()
    );

    // Return JSON — frontend handles CSV/Excel conversion
    res.status(200).json(successResponse({ data: leads }));
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/leads/:id
 */
export const getLeadById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const lead = await leadService.getLeadById(req.params.id);
    res.status(200).json(successResponse({ data: lead }));
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/leads
 */
export const createLead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const lead = await leadService.createLead(req.body, req.user!._id.toString());
    res.status(201).json(
      successResponse({ message: 'Lead created successfully', data: lead })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/leads/:id
 */
export const updateLead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const lead = await leadService.updateLead(
      req.params.id,
      req.body,
      req.user!._id.toString()
    );
    res.status(200).json(
      successResponse({ message: 'Lead updated successfully', data: lead })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/v1/leads/:id
 */
export const deleteLead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await leadService.deleteLead(req.params.id, req.user!._id.toString());
    res.status(200).json(successResponse({ message: 'Lead deleted successfully' }));
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/leads/:id/favorite
 */
export const toggleFavorite = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const lead = await leadService.toggleFavorite(req.params.id);
    res.status(200).json(
      successResponse({
        message: lead.isFavorite ? 'Added to favorites' : 'Removed from favorites',
        data: lead,
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/leads/:id/pin
 */
export const togglePinned = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const lead = await leadService.togglePinned(req.params.id);
    res.status(200).json(
      successResponse({
        message: lead.isPinned ? 'Lead pinned' : 'Lead unpinned',
        data: lead,
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/leads/check-duplicates
 */
export const checkDuplicates = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await leadService.checkDuplicates(req.body, req.body.excludeId);
    res.status(200).json(successResponse({ data: result }));
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/leads/bulk/status
 */
export const bulkUpdateStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const count = await leadService.bulkUpdateStatus(
      req.body.leadIds,
      req.body.status,
      req.user!._id.toString()
    );
    res.status(200).json(
      successResponse({ message: `${count} leads updated`, data: { modifiedCount: count } })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/leads/bulk/priority
 */
export const bulkUpdatePriority = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const count = await leadService.bulkUpdatePriority(
      req.body.leadIds,
      req.body.priority,
      req.user!._id.toString()
    );
    res.status(200).json(
      successResponse({ message: `${count} leads updated`, data: { modifiedCount: count } })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/leads/bulk/assign
 */
export const bulkAssign = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const count = await leadService.bulkAssign(
      req.body.leadIds,
      req.body.assignedTo,
      req.user!._id.toString()
    );
    res.status(200).json(
      successResponse({ message: `${count} leads reassigned`, data: { modifiedCount: count } })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/leads/bulk/delete
 */
export const bulkDeleteLeads = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const count = await leadService.bulkDelete(
      req.body.leadIds,
      req.user!._id.toString()
    );
    res.status(200).json(
      successResponse({ message: `${count} leads deleted`, data: { deletedCount: count } })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/leads/import
 */
export const importLeads = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { leads, duplicateAction } = req.body;
    const result = await leadService.importLeads(
      leads,
      req.user!._id.toString(),
      req.user!._id.toString(), // default assignedTo
      duplicateAction
    );
    res.status(200).json(
      successResponse({ message: 'Import complete', data: result })
    );
  } catch (error) {
    next(error);
  }
};
