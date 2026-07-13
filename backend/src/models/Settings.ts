// ============================================
// Settings Model
// ============================================
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISettingsDocument extends Document {
  _id: mongoose.Types.ObjectId;
  key: string;
  value: unknown;
  updatedBy: mongoose.Types.ObjectId;
  updatedAt: Date;
}

const settingsSchema = new Schema<ISettingsDocument>(
  {
    key: {
      type: String,
      required: [true, 'Settings key is required'],
      unique: true,
      trim: true,
    },
    value: {
      type: Schema.Types.Mixed,
      required: [true, 'Settings value is required'],
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);


const Settings: Model<ISettingsDocument> = mongoose.model<ISettingsDocument>(
  'Settings',
  settingsSchema
);

export default Settings;
