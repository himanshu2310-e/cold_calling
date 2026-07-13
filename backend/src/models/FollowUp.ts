// ============================================
// FollowUp Model
// ============================================
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IFollowUpDocument extends Document {
  _id: mongoose.Types.ObjectId;
  lead: mongoose.Types.ObjectId;
  agent: mongoose.Types.ObjectId;
  scheduledDate: Date;
  notes?: string;
  isCompleted: boolean;
  isRecurring: boolean;
  recurringInterval?: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  completedAt?: Date;
  reminderSent: boolean;
  createdAt: Date;
}

const followUpSchema = new Schema<IFollowUpDocument>(
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
    scheduledDate: {
      type: Date,
      required: [true, 'Scheduled date is required'],
    },
    notes: {
      type: String,
      maxlength: [2000, 'Notes cannot exceed 2000 characters'],
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurringInterval: {
      type: String,
      enum: ['daily', 'weekly', 'biweekly', 'monthly'],
    },
    completedAt: {
      type: Date,
    },
    reminderSent: {
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
followUpSchema.index({ agent: 1, scheduledDate: 1 });
followUpSchema.index({ lead: 1 });
followUpSchema.index({ isCompleted: 1, scheduledDate: 1 });
followUpSchema.index({ scheduledDate: 1, isCompleted: 1 }); // For reminder queries

const FollowUp: Model<IFollowUpDocument> = mongoose.model<IFollowUpDocument>(
  'FollowUp',
  followUpSchema
);

export default FollowUp;
