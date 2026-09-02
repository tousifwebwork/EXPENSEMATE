const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "expensemate/profiles",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    resource_type: "image",
    upload_preset: "expensemate_profile",
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

module.exports = upload;
