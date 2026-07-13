// ============================================
// Multer File Upload Middleware
// ============================================
import multer from 'multer';
import path from 'path';
import { ApiError } from '../utils/apiResponse';
// Define constants locally to avoid TS6059 rootDir compilation errors
const ALLOWED_AUDIO_FORMATS = ['audio/mpeg', 'audio/wav', 'audio/x-m4a', 'audio/mp4', 'audio/mp3', 'audio/webm', 'audio/ogg'];
const MAX_RECORDING_SIZE = 50 * 1024 * 1024; // 50MB

import os from 'os';

// Configure disk storage temporarily before uploading to Cloudinary
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, os.tmpdir());
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

// File filter check for audio formats
const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (ALLOWED_AUDIO_FORMATS.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ApiError(400, 'Invalid file format. Supported audio files are MP3, WAV, M4A, WEBM, and OGG.') as any, false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_RECORDING_SIZE, // 50MB
  },
  fileFilter,
});

export default upload;
