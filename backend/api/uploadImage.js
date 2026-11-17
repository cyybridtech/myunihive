/**
 * Upload Image API
 * POST /api/uploadImage
 * Uploads an image to Cloudinary and returns the URL.
 */

const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { loadEnv } = require('./loadEnv');
const auth = require('./auth');
loadEnv();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Multer to use Cloudinary with automatic optimization
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'unihive_uploads',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'avif'],
    transformation: [
      { width: 1400, height: 1000, crop: 'limit', quality: 'auto:good', fetch_format: 'auto' }
    ]
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 15 * 1024 * 1024 // 15 MB
  }
}).single('image');

async function uploadImageHandler(req, res) {
  // Enforce authentication to prevent arbitrary unauthenticated media uploads
  const authData = auth.getRequestAuth(req);
  if (!authData || !authData.id) {
    return res.status(401).json({ status: 'error', message: 'Authentication required to upload media' });
  }

  upload(req, res, function (err) {
    if (err) {
      console.error('Upload error:', err);
      return res.status(500).json({ status: 'error', message: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ status: 'error', message: 'No file uploaded' });
    }

    // Cloudinary returns the full URL in req.file.path
    res.json({ status: 'success', url: req.file.path });
  });
}

module.exports = uploadImageHandler;
