const multer = require("multer");
const path = require("path");
const fs = require("fs");
const uploadPath = path.join(__dirname, "../uploads");
fs.mkdirSync(uploadPath, { recursive: true });
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadPath),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname).toLowerCase()}`)
});
const fileFilter = (req, file, cb) => {
    if (["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) return cb(null, true);
    cb(new Error("Only JPG, PNG and WEBP images are allowed"));
};
module.exports = multer({ storage, fileFilter, limits: { fileSize: Number(process.env.MAX_FILE_SIZE) || 10485760, files: 5 } });
