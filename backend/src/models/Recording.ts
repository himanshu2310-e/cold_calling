// ============================================
// Recording Model
// ============================================
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IRecordingDocument extends Document {
  _id: mongoose.Types.ObjectId;
  lead: mongoose.Types.ObjectId;
  call?: mongoose.Types.ObjectId;
  agent: mongoose.Types.ObjectId;
  url: string;
  publicId: string;
  format: string;
  duration: number;
  fileSize: number;
  createdAt: Date;
}

const recordingSchema = new Schema<IRecordingDocument>(
  {
    lead: {
      type: Schema.Types.ObjectId,
      ref: 'Lead',
      required: [true, 'Lead reference is required'],
    },
    call: {
      type: Schema.Types.ObjectId,
      ref: 'Call',
    },
    agent: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Agent reference is required'],
    },
    url: {
      type: String,
      required: [true, 'Recording URL is required'],
    },
    publicId: {
      type: String,
      required: [true, 'Cloudinary public ID is required'],
    },
    format: {
      type: String,
      required: true,
      enum: ['mp3', 'wav', 'm4a', 'webm', 'ogg'],
    },
    duration: {
      type: Number,
      default: 0,
      min: 0,
    },
    fileSize: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ---- Indexes ----
recordingSchema.index({ lead: 1, createdAt: -1 });
recordingSchema.index({ agent: 1, createdAt: -1 });
recordingSchema.index({ call: 1 });

const Recording: Model<IRecordingDocument> = mongoose.model<IRecordingDocument>(
  'Recording',
  recordingSchema
);

export default Recording;
