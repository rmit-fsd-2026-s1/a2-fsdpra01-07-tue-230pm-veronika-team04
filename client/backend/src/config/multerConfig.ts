import multer from "multer";
import fs from "fs";
import path from "path";

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

const venueUploadDir = path.join(process.cwd(), "uploads", "venues");

if (!fs.existsSync(venueUploadDir)) {
  fs.mkdirSync(venueUploadDir, { recursive: true });
}

const venueImageStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, venueUploadDir);
  },
  filename: (_req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const uniqueName = `venue-${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;

    cb(null, uniqueName);
  },
});

export const uploadVenueImage = multer({
  storage: venueImageStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      cb(new Error("Only image files are allowed"));
      return;
    }

    cb(null, true);
  },
});
