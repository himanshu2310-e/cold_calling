// ============================================
// Lead Model
// ============================================
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ILeadDocument extends Document {
  _id: mongoose.Types.ObjectId;
  fullName: string;
  phone: string;
  email?: string;
  company?: string;
  industry?: string;
  website?: string;
  linkedin?: string;
  city?: string;
  state?: string;
  country?: string;
  leadSource?: string;
  description?: string;
  assignedTo: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  status: string;
  priority: string;
  callCount: number;
  recordingCount: number;
  notesCount: number;
  nextFollowUp?: Date;
  tags: string[];
  isFavorite: boolean;
  isPinned: boolean;
  aiScore?: number;
  createdAt: Date;
  updatedAt: Date;
}

const leadSchema = new Schema<ILeadDocument>(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    company: {
      type: String,
      trim: true,
      maxlength: [150, 'Company name cannot exceed 150 characters'],
    },
    industry: {
      type: String,
      trim: true,
    },
    website: {
      type: String,
      trim: true,
    },
    linkedin: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },
    state: {
      type: String,
      trim: true,
    },
    country: {
      type: String,
      trim: true,
    },
    leadSource: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Assigned user is required'],
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
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
      default: 'not_called',
    },
    priority: {
      type: String,
      enum: ['hot', 'warm', 'cold', 'vip', 'high', 'medium', 'low'],
      default: 'medium',
    },
    callCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    recordingCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    notesCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    nextFollowUp: {
      type: Date,
    },
    tags: {
      type: [String],
      default: [],
    },
    isFavorite: {
      type: Boolean,
      default: false,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    aiScore: {
      type: Number,
      min: 0,
      max: 100,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ---- Indexes for fast queries ----
leadSchema.index({ phone: 1 });
leadSchema.index({ email: 1 });
leadSchema.index({ company: 1 });
leadSchema.index({ assignedTo: 1 });
leadSchema.index({ status: 1 });
leadSchema.index({ priority: 1 });
leadSchema.index({ createdAt: -1 });
leadSchema.index({ nextFollowUp: 1 });
leadSchema.index({ isFavorite: 1 });
leadSchema.index({ isPinned: 1 });
// Compound indexes for common filter combinations
leadSchema.index({ assignedTo: 1, status: 1 });
leadSchema.index({ assignedTo: 1, priority: 1 });
// Text index for search
leadSchema.index({ fullName: 'text', company: 'text', email: 'text', phone: 'text' });

// ---- Pre-save Hook for AI Lead Score Calculation ----
leadSchema.pre<ILeadDocument>('save', function (next) {
  let score = 10;

  // 1. Priority Points
  if (this.priority === 'hot' || this.priority === 'vip') score += 30;
  else if (this.priority === 'high') score += 20;
  else if (this.priority === 'warm') score += 15;
  else if (this.priority === 'medium') score += 10;
  else score += 5;

  // 2. Status Points
  if (this.status === 'converted') score += 50;
  else if (this.status === 'interested') score += 40;
  else if (this.status === 'callback') score += 30;
  else if (this.status === 'follow_up') score += 25;
  else if (this.status === 'called') score += 15;
  else if (this.status === 'invalid_number') score -= 50;

  // 3. Completeness of Info Points
  if (this.email) score += 5;
  if (this.company) score += 5;
  if (this.industry) score += 5;
  if (this.website) score += 5;
  if (this.linkedin) score += 10;
  if (this.city || this.state || this.country) score += 5;

  // 4. Activity Points
  score += Math.min(15, this.callCount * 5);
  if (this.notesCount > 0) score += 5;

  this.aiScore = Math.max(0, Math.min(100, score));
  next();
});

const Lead: Model<ILeadDocument> = mongoose.model<ILeadDocument>('Lead', leadSchema);

export default Lead;
