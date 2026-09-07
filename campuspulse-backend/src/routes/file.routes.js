import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { success, failure } from "../utils/response.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.resolve(__dirname, "../../public/uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const cleanExt = path.extname(file.originalname).toLowerCase();
    const baseName = path.basename(file.originalname, cleanExt).replace(/[^a-zA-Z0-9_-]/g, "_");
    cb(null, `${baseName}-${uniqueSuffix}${cleanExt}`);
  }
});

// Allowed MIME types & Extensions
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
]);

const ALLOWED_EXTENSIONS = new Set([".pdf", ".png", ".jpg", ".jpeg", ".doc", ".docx"]);

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_EXTENSIONS.has(ext) || ALLOWED_MIME_TYPES.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${ext}. Only PDF, PNG, JPG, JPEG, DOC, and DOCX are permitted.`), false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter
});

const router = Router();

// Upload Single File
router.post("/upload", (req, res) => {
  upload.single("file")(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return failure(res, "File size exceeds the 10MB limit.", 400);
      }
      return failure(res, `Upload error: ${err.message}`, 400);
    } else if (err) {
      return failure(res, err.message, 400);
    }

    if (!req.file) {
      return failure(res, "No file provided in request.", 400);
    }

    const host = req.get("host") || "localhost:5000";
    const protocol = req.protocol || "http";
    const publicUrl = `${protocol}://${host}/uploads/${req.file.filename}`;

    return success(res, "File uploaded successfully", {
      file: {
        url: publicUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        uploadedAt: new Date().toISOString()
      }
    }, 201);
  });
});

export default router;
