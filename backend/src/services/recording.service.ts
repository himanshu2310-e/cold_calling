// ============================================
// Recording Service — Business Logic
// ============================================
import mongoose from 'mongoose';
import Recording, { IRecordingDocument } from '../models/Recording';
import Lead from '../models/Lead';
import { cloudinary } from '../config/cloudinary';
import { ApiError } from '../utils/apiResponse';
import { logActivity } from './activity.service';
import { createNotification } from './notification.service';
import User from '../models/User';
import fs from 'fs';

interface SaveRecordingParams {
  leadId: string;
  callId?: string;
  agentId: string;
  filePath: string;
  originalName: string;
  fileSize: number;
}

/**
 * Upload audio file to Cloudinary and register in database.
 */
export const saveRecording = async (params: SaveRecordingParams): Promise<IRecordingDocument> => {
  const { leadId, callId, agentId, filePath, originalName, fileSize } = params;

  if (!mongoose.Types.ObjectId.isValid(leadId)) {
    // Delete temp file
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    throw new ApiError(400, 'Invalid Lead ID');
  }

  const lead = await Lead.findById(leadId);
  if (!lead) {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    throw new ApiError(404, 'Lead not found');
  }

  try {
    // 1. Upload to Cloudinary (resource_type: video is required for audio)
    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: 'video',
      folder: 'coldconnect/recordings',
      public_id: `rec-${Date.now()}`,
    });

    // 2. Determine file format from name extension
    const format = originalName.split('.').pop()?.toLowerCase() || 'mp3';

    // 3. Create Recording document
    const recording = await Recording.create({
      lead: new mongoose.Types.ObjectId(leadId),
      call: callId ? new mongoose.Types.ObjectId(callId) : undefined,
      agent: new mongoose.Types.ObjectId(agentId),
      url: result.secure_url,
      publicId: result.public_id,
      format: ['mp3', 'wav', 'm4a', 'webm', 'ogg'].includes(format) ? format : 'mp3',
      duration: Math.round(result.duration || 0),
      fileSize,
    });

    // 4. Update Lead recording count
    lead.recordingCount += 1;
    await lead.save();

    await logActivity({
      userId: agentId,
      action: 'recording_uploaded',
      entityType: 'recording',
      entityId: recording._id.toString(),
      metadata: { leadId, duration: recording.duration, originalName },
    });

    // Notify Admins and Managers
    try {
      const admins = await User.find({ role: { $in: ['admin', 'manager'] } }, '_id');
      const agent = await User.findById(agentId);
      const agentName = agent ? `${agent.firstName} ${agent.lastName}` : 'An agent';

      for (const admin of admins) {
        await createNotification({
          recipientId: admin._id.toString(),
          senderId: agentId,
          type: 'recording_uploaded',
          title: 'Recording Uploaded',
          message: `${agentName} uploaded a call recording for "${lead.fullName}".`,
          data: { leadId: lead._id.toString(), recordingId: recording._id.toString() },
        });
      }
    } catch (err) {
      console.warn('Failed to notify admins of uploaded recording:', err);
    }

    return recording;
  } catch (error: any) {
    console.error('Cloudinary upload failure:', error);
    throw new ApiError(500, `Failed to upload recording: ${error.message || 'Unknown error'}`);
  } finally {
    // Always clean up temp file from OS temp directory
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
};

/**
 * Get recordings for a specific Lead.
 */
export const getRecordingsByLead = async (leadId: string): Promise<IRecordingDocument[]> => {
  if (!mongoose.Types.ObjectId.isValid(leadId)) {
    throw new ApiError(400, 'Invalid Lead ID');
  }

  const recordings = await Recording.find({ lead: new mongoose.Types.ObjectId(leadId) })
    .populate('agent', 'firstName lastName email avatar')
    .sort({ createdAt: -1 });

  return recordings;
};

/**
 * Delete a recording (Admin/Manager only).
 */
export const deleteRecording = async (recordingId: string, userId: string): Promise<void> => {
  if (!mongoose.Types.ObjectId.isValid(recordingId)) {
    throw new ApiError(400, 'Invalid Recording ID');
  }

  const recording = await Recording.findById(recordingId);
  if (!recording) {
    throw new ApiError(404, 'Recording not found');
  }

  // 1. Delete from Cloudinary
  try {
    await cloudinary.uploader.destroy(recording.publicId, { resource_type: 'video' });
  } catch (err) {
    console.warn('Failed to delete asset from Cloudinary:', err);
  }

  // 2. Update Lead recordingCount
  const lead = await Lead.findById(recording.lead);
  if (lead && lead.recordingCount > 0) {
    lead.recordingCount -= 1;
    await lead.save();
  }

  // 3. Delete from DB
  await Recording.findByIdAndDelete(recordingId);

  await logActivity({
    userId,
    action: 'lead_updated', // matches general updates
    entityType: 'recording',
    entityId: recordingId,
    metadata: { leadId: recording.lead.toString(), action: 'deleted_recording' },
  });
};

/**
 * Get all recordings list for Admin.
 */
export const getRecordingLogs = async (page = 1, limit = 25) => {
  const skip = (page - 1) * limit;

  const [recordings, total] = await Promise.all([
    Recording.find()
      .populate('lead', 'fullName company phone')
      .populate('agent', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Recording.countDocuments(),
  ]);

  return {
    recordings,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};
