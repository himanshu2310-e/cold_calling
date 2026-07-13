// ============================================
// Note Service — Business Logic
// ============================================
import mongoose from 'mongoose';
import Note, { INoteDocument } from '../models/Note';
import Lead from '../models/Lead';
import { ApiError } from '../utils/apiResponse';
import { logActivity } from './activity.service';

interface CreateNoteParams {
  leadId: string;
  content: string;
  createdBy: string;
  mentions?: string[];
}

/**
 * Create a new note on a Lead.
 */
export const createNote = async (params: CreateNoteParams): Promise<INoteDocument> => {
  const { leadId, content, createdBy, mentions = [] } = params;

  if (!mongoose.Types.ObjectId.isValid(leadId)) {
    throw new ApiError(400, 'Invalid Lead ID');
  }

  const lead = await Lead.findById(leadId);
  if (!lead) {
    throw new ApiError(404, 'Lead not found');
  }

  const note = await Note.create({
    lead: new mongoose.Types.ObjectId(leadId),
    createdBy: new mongoose.Types.ObjectId(createdBy),
    content,
    mentions: mentions.map((m) => new mongoose.Types.ObjectId(m)),
  });

  // Increment Lead notesCount
  lead.notesCount += 1;
  await lead.save();

  await logActivity({
    userId: createdBy,
    action: 'note_created',
    entityType: 'note',
    entityId: note._id.toString(),
    metadata: { leadId },
  });

  return Note.findById(note._id)
    .populate('createdBy', 'firstName lastName email avatar')
    .populate('mentions', 'firstName lastName email') as Promise<INoteDocument>;
};

/**
 * Update an existing note.
 */
export const updateNote = async (
  noteId: string,
  content: string,
  userId: string
): Promise<INoteDocument> => {
  if (!mongoose.Types.ObjectId.isValid(noteId)) {
    throw new ApiError(400, 'Invalid Note ID');
  }

  const note = await Note.findById(noteId);
  if (!note) {
    throw new ApiError(404, 'Note not found');
  }

  if (note.createdBy.toString() !== userId) {
    throw new ApiError(403, 'You are not authorized to edit this note');
  }

  note.content = content;
  note.isEdited = true;
  await note.save();

  await logActivity({
    userId,
    action: 'note_updated',
    entityType: 'note',
    entityId: noteId,
    metadata: { leadId: note.lead.toString() },
  });

  return Note.findById(noteId)
    .populate('createdBy', 'firstName lastName email avatar')
    .populate('mentions', 'firstName lastName email') as Promise<INoteDocument>;
};

/**
 * Delete a note.
 */
export const deleteNote = async (noteId: string, userId: string): Promise<void> => {
  if (!mongoose.Types.ObjectId.isValid(noteId)) {
    throw new ApiError(400, 'Invalid Note ID');
  }

  const note = await Note.findById(noteId);
  if (!note) {
    throw new ApiError(404, 'Note not found');
  }

  // Allow creator or Admins to delete notes
  const user = await mongoose.model('User').findById(userId);
  const isAdmin = user && ['admin', 'manager'].includes(user.role);

  if (note.createdBy.toString() !== userId && !isAdmin) {
    throw new ApiError(403, 'You are not authorized to delete this note');
  }

  // Decrement Lead notesCount
  const lead = await Lead.findById(note.lead);
  if (lead && lead.notesCount > 0) {
    lead.notesCount -= 1;
    await lead.save();
  }

  await Note.findByIdAndDelete(noteId);
};

/**
 * Get all notes for a specific Lead.
 */
export const getNotesByLead = async (leadId: string): Promise<INoteDocument[]> => {
  if (!mongoose.Types.ObjectId.isValid(leadId)) {
    throw new ApiError(400, 'Invalid Lead ID');
  }

  const notes = await Note.find({ lead: new mongoose.Types.ObjectId(leadId) })
    .populate('createdBy', 'firstName lastName email avatar role')
    .populate('mentions', 'firstName lastName email')
    .sort({ createdAt: -1 });

  return notes;
};
