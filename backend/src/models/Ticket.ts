// ============================================
// Support Ticket Model
// ============================================
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITicketDocument extends Document {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  ticketId: string;
  subject: string;
  description: string;
  category: 'technical' | 'billing' | 'leads' | 'dialer' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  createdAt: Date;
  updatedAt: Date;
}

const ticketSchema = new Schema<ITicketDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
    },
    ticketId: {
      type: String,
      required: true,
      unique: true,
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
      maxlength: [200, 'Subject cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    category: {
      type: String,
      enum: ['technical', 'billing', 'leads', 'dialer', 'other'],
      required: [true, 'Category is required'],
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      required: [true, 'Priority is required'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'resolved', 'closed'],
      required: [true, 'Status is required'],
      default: 'open',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

ticketSchema.index({ ticketId: 1 });
ticketSchema.index({ user: 1, createdAt: -1 });

const Ticket: Model<ITicketDocument> = mongoose.model<ITicketDocument>(
  'Ticket',
  ticketSchema
);

export default Ticket;
