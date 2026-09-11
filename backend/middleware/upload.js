const multer = require("multer");
const { CloudinaryStorage  } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");
 

const storage = new CloudinaryStorage({
  cloudinary,
  params:{
    folder: "profileImages_Karmavenom_Internship",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 500, height: 500, crop: "limit" }],

  }
})

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"), false);
  }
};



module.exports = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024, }, // 10MB file size limit
});