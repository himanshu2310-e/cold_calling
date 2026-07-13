// ============================================
// Settings Service — Business Logic
// ============================================
import Settings, { ISettingsDocument } from '../models/Settings';
import mongoose from 'mongoose';

/**
 * Get a setting by its unique key.
 */
export const getSetting = async (key: string): Promise<ISettingsDocument | null> => {
  return Settings.findOne({ key }).populate('updatedBy', 'firstName lastName email');
};

/**
 * Update or insert a setting value.
 */
export const updateSetting = async (
  key: string,
  value: unknown,
  userId: string
): Promise<ISettingsDocument> => {
  let setting = await Settings.findOne({ key });

  if (setting) {
    setting.value = value;
    setting.updatedBy = new mongoose.Types.ObjectId(userId);
    await setting.save();
  } else {
    setting = await Settings.create({
      key,
      value,
      updatedBy: new mongoose.Types.ObjectId(userId),
    });
  }

  return setting.populate('updatedBy', 'firstName lastName email');
};
