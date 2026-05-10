const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadPdfToCloudinary = (buffer, originalname) =>
  new Promise((resolve, reject) => {
    const folder = process.env.CLOUDINARY_FOLDER || "study-agent";
    const publicId = originalname.replace(/\.[^/.]+$/, "");

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "raw",
        folder,
        public_id: publicId
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(result);
      }
    );

    streamifier.createReadStream(buffer).pipe(uploadStream);
  });

module.exports = { uploadPdfToCloudinary };
