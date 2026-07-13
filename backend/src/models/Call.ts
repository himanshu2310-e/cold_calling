// ============================================
// Call Model
// ============================================
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICallDocument extends Document {
  _id: mongoose.Types.ObjectId;
  lead: mongoose.Types.ObjectId;
  agent: mongoose.Types.ObjectId;
  startTime: Date;
  endTime?: Date;
  duration: number;
  outcome: string;
  notes?: string;
  statusAfterCall?: string;
  priorityAfterCall?: string;
  nextFollowUp?: Date;
  createdAt: Date;
}

const callSchema = new Schema<ICallDocument>(
  {
    lead: {
      type: Schema.Types.ObjectId,
      ref: 'Lead',
      required: [true, 'Lead reference is required'],
    },
    agent: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Agent reference is required'],
    },
    startTime: {
      type: Date,
      required: [true, 'Call start time is required'],
      default: Date.now,
    },
    endTime: {
      type: Date,
    },
    duration: {
      type: Number,
      default: 0,
      min: 0,
    },
    outcome: {
      type: String,
      enum: [
        'connected',
        'no_answer',
        'busy',
        'voicemail',
        'wrong_number',
        'callback',
        'interested',
        'not_interested',
        'converted',
      ],
      required: [true, 'Call outcome is required'],
    },
    notes: {
      type: String,
      maxlength: [5000, 'Notes cannot exceed 5000 characters'],
    },
    statusAfterCall: {
      type: String,
      enum: [
        'not_called',
        'called',
        'interested',
        'callback',
        'follow_up',
        'converted',
        'invalid_number',
        'duplicate',
      ],
    },
    priorityAfterCall: {
      type: String,
      enum: ['hot', 'warm', 'cold', 'vip', 'high', 'medium', 'low'],
    },
    nextFollowUp: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ---- Indexes ----
callSchema.index({ lead: 1, createdAt: -1 });
callSchema.index({ agent: 1, createdAt: -1 });
callSchema.index({ outcome: 1 });
callSchema.index({ createdAt: -1 });
callSchema.index({ agent: 1, startTime: 1 });

const Call: Model<ICallDocument> = mongoose.model<ICallDocument>('Call', callSchema);

export default Call;
