// ============================================
// Cloudinary Configuration
// ============================================
import { v2 as cloudinary } from 'cloudinary';
import env from './env';

const configureCloudinary = (): void => {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });

  if (env.CLOUDINARY_CLOUD_NAME) {
    console.log('✅ Cloudinary configured');
  } else {
    console.warn('⚠️  Cloudinary credentials not set — file uploads will fail');
  }
};

export { cloudinary };
export default configureCloudinary;
