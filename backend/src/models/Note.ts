// ============================================
// Note Model
// ============================================
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface INoteDocument extends Document {
  _id: mongoose.Types.ObjectId;
  lead: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  content: string;
  mentions: mongoose.Types.ObjectId[];
  isEdited: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const noteSchema = new Schema<INoteDocument>(
  {
    lead: {
      type: Schema.Types.ObjectId,
      ref: 'Lead',
      required: [true, 'Lead reference is required'],
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: [true, 'Note content is required'],
      maxlength: [10000, 'Note cannot exceed 10000 characters'],
    },
    mentions: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    isEdited: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ---- Indexes ----
noteSchema.index({ lead: 1, createdAt: -1 });
noteSchema.index({ createdBy: 1 });

const Note: Model<INoteDocument> = mongoose.model<INoteDocument>('Note', noteSchema);

export default Note;
