import { v2 as cloudinary } from "cloudinary";

const isConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (isConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

// Uploads a file buffer (from Multer's memoryStorage) to Cloudinary and
// returns the hosted URL. If Cloudinary credentials are missing in .env,
// returns a high-performance inline base64 image data URI fallback!
export function uploadBufferToCloudinary(buffer, folder = "campuscanteen", mimetype = "image/jpeg") {
  return new Promise((resolve, reject) => {
    if (!isConfigured) {
      console.log("[Cloudinary DEV LOG] Credentials not set — generating inline base64 image data URI fallback");
      const base64 = buffer.toString("base64");
      const dataUri = `data:${mimetype};base64,${base64}`;
      return resolve({ secure_url: dataUri });
    }

    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        transformation: [{ width: 800, height: 600, crop: "limit", quality: "auto", fetch_format: "auto" }],
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(buffer);
  });
}

export default cloudinary;
