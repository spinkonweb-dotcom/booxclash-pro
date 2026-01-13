import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

import {
  saveLessonContent,
  getLessonContent,
  getAllLessonContent,
  deleteLessonContent,
} from "../controllers/lessonContentController.js";

const router = express.Router();

// ✅ Ensure the 'uploads' directory exists
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// ✅ Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir); // use absolute path
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const safeName = file.originalname.replace(/\s+/g, "_").replace(/[^\w.-]/g, "");
    cb(null, `${file.fieldname}-${uniqueSuffix}-${safeName}`);
  },
});

// ✅ Multer middleware setup
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed!"), false);
    }
    cb(null, true);
  },
});

// ✅ Upload route for images (used in KNOW step visuals)
router.post("/upload-image", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const imageUrl = `/uploads/${req.file.filename}`;
  res.status(200).json({ imageUrl });
});

// Lesson content CRUD
router.post("/save", saveLessonContent);
router.get("/get", getLessonContent);
router.get("/get-all", getAllLessonContent);
router.delete("/delete", deleteLessonContent);

export default router;
