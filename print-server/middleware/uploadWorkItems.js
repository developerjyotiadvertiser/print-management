const multer = require("multer");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");

const uploadDir = path.join(__dirname, "../uploads/work-items");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Store uploaded files temporarily in memory
const storage = multer.memoryStorage();

const uploadWorkItem = multer({
  storage,

  limits: {
    fileSize: 20 * 1024 * 1024, // Maximum original upload: 20 MB
  },

  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed."));
    }
  },
});

// -----------------------------------------
// Convert multiple uploaded images to WebP
// -----------------------------------------
const processWorkItemImage = async (req, res, next) => {
  try {
    // No files uploaded
    if (!req.files || req.files.length === 0) {
      return next();
    }

    // Process all uploaded files
    for (const file of req.files) {
      const fileName = `work-item-${Date.now()}-${Math.round(
        Math.random() * 1e9,
      )}.webp`;

      const outputPath = path.join(uploadDir, fileName);

      await sharp(file.buffer)
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

      // Replace file information with processed file information
      file.filename = fileName;
      file.path = outputPath;
      file.destination = uploadDir;
      file.mimetype = "image/webp";
      file.originalname = fileName;
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadWorkItem,
  processWorkItemImage,
};
