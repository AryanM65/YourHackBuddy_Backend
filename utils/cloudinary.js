const {v2: cloudinary} = require('cloudinary')
const fs = require("fs");

exports.uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "raw",
    });
    console.log("response ", response);
    // Remove local file after upload
    fs.unlinkSync(localFilePath);

    console.log("✅ Uploaded to Cloudinary:", response.secure_url);
    return response;
  } catch (error) {
    console.error("❌ Cloudinary upload failed:", error);
    fs.unlinkSync(localFilePath); // delete the local file
    return null;
  }
};