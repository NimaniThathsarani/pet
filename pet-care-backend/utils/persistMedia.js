const cloudinary = require('cloudinary').v2;

function isCloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_URL?.trim() ||
    (process.env.CLOUDINARY_CLOUD_NAME?.trim() &&
      process.env.CLOUDINARY_API_KEY?.trim() &&
      process.env.CLOUDINARY_API_SECRET?.trim())
  );
}

function configureCloudinary() {
  if (process.env.CLOUDINARY_URL?.trim()) {
    cloudinary.config();
  } else {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }
}

/**
 * Store an uploaded file. Uses Cloudinary when CLOUDINARY_* / CLOUDINARY_URL is set;
 * otherwise keeps the previous behaviour (data URL in MongoDB).
 *
 * @param {{ buffer: Buffer, mimetype: string } | undefined} file - multer file object
 * @param {string} folder - logical folder under `pet-care/` in Cloudinary
 * @returns {Promise<string|undefined>}
 */
async function persistMedia(file, folder) {
  if (!file?.buffer) return undefined;

  if (!isCloudinaryConfigured()) {
    return `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
  }

  configureCloudinary();
  const folderPath = `pet-care/${folder}`.replace(/\/+/g, '/').replace(/\/$/, '');

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: folderPath,
        resource_type: 'auto',
        use_filename: true,
        unique_filename: true,
      },
      (err, result) => {
        if (err) return reject(err);
        resolve(result.secure_url);
      }
    );
    stream.end(file.buffer);
  });
}

module.exports = { persistMedia, isCloudinaryConfigured };
