const multer = require("multer");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");

const uploadDir = path.join(__dirname, "../uploads/work-items");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Store uploaded file temporarily in memory
const storage = multer.memoryStorage();

const uploadWorkItem = multer({
  storage,

  limits: {
    fileSize: 20 * 1024 * 1024, // Maximum original upload: 20 MB
  },

  fileFilter: (req, file, cb) => {
    // Accept any image type
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed."));
    }
  },
});

// Convert uploaded image to compressed WebP
const processWorkItemImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return next();
    }

    const fileName = `work-item-${Date.now()}-${Math.round(
      Math.random() * 1e9,
    )}.webp`;

    const outputPath = path.join(uploadDir, fileName);

    await sharp(req.file.buffer)
      .rotate()
      .resize({
        width: 2000,
        height: 2000,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({
        quality: 75,
        effort: 6,
      })
      .toFile(outputPath);

    // Replace req.file information with processed file information
    req.file.filename = fileName;
    req.file.path = outputPath;
    req.file.destination = uploadDir;
    req.file.mimetype = "image/webp";
    req.file.originalname = fileName;

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadWorkItem,
  processWorkItemImage,
};
