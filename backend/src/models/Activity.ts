// ============================================
// Activity Model
// ============================================
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IActivityDocument extends Document {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  action: string;
  entityType: string;
  entityId?: mongoose.Types.ObjectId;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const activitySchema = new Schema<IActivityDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
    },
    action: {
      type: String,
      required: [true, 'Action is required'],
      enum: [
        'lead_created',
        'lead_updated',
        'lead_deleted',
        'call_started',
        'call_finished',
        'recording_uploaded',
        'note_created',
        'note_updated',
        'user_login',
        'user_logout',
        'user_created',
        'user_updated',
        'user_suspended',
        'password_changed',
        'status_updated',
        'priority_updated',
        'csv_imported',
        'csv_exported',
        'follow_up_created',
        'follow_up_completed',
      ],
    },
    entityType: {
      type: String,
      required: [true, 'Entity type is required'],
      enum: ['lead', 'call', 'recording', 'note', 'user', 'follow_up', 'system'],
    },
    entityId: {
      type: Schema.Types.ObjectId,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ---- Indexes ----
activitySchema.index({ user: 1, createdAt: -1 });
activitySchema.index({ entityType: 1, entityId: 1 });
activitySchema.index({ action: 1, createdAt: -1 });
activitySchema.index({ createdAt: -1 });
// Auto-expire activities after 90 days
activitySchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

const Activity: Model<IActivityDocument> = mongoose.model<IActivityDocument>(
  'Activity',
  activitySchema
);

export default Activity;
