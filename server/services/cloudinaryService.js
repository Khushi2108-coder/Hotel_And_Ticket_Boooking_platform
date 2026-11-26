import { v2 as cloudinary } from "cloudinary";
import { config } from "../config/config.js";

cloudinary.config({
  cloud_name: config.CLOUDINARY_CLOUD_NAME,
  api_key: config.CLOUDINARY_API_KEY,
  api_secret: config.CLOUDINARY_API_SECRET,
});

/**
 * Upload a buffer/stream to Cloudinary
 * @param {Buffer|string} fileBuffer – file buffer or base64 string
 * @param {string} folder – Cloudinary folder (e.g. "hotels", "avatars")
 * @returns {Promise<{url: string, publicId: string}>}
 */
export async function uploadToCloudinary(fileBuffer, folder = "stayease") {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "auto",
        transformation: [{ quality: "auto", fetch_format: "auto" }],
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    uploadStream.end(fileBuffer);
  });
}

/**
 * Delete a file from Cloudinary by public ID
 */
export async function deleteFromCloudinary(publicId) {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error("Cloudinary delete error:", err.message);
  }
}

export default cloudinary;

