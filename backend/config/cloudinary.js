require("dotenv").config();
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ADD THIS HERE
cloudinary.api.ping()
  .then(result => console.log("CLOUDINARY PING:", result))
  .catch(error => console.log("CLOUDINARY PING ERROR:", error));

module.exports = cloudinary;