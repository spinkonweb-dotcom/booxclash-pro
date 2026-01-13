import { Router } from "express";
import fs from "fs";
import path from "path";
import multer from "multer";

import {
  signup,
  login,
  logout,
  getProfile,
  uploadProfilePic,
  changePassword,
  reauthPassword, // <-- Added the new function here
  getAllStudents,
  deleteStudent,
  addStudent,
  approveAdmin,
  getPendingAdmins
} from "../controllers/authController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = Router();

// ✅ Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// ✅ Multer config for image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

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

// ✅ Public routes
router.post("/signup", signup);
router.post("/login", login);

// 🔐 Protected routes
router.get("/logout", protect, logout);
router.get("/profile", protect, getProfile);
router.post("/change-password", protect, changePassword);
router.post("/reauth-password", protect, reauthPassword); // <-- Added new route here

// 📚 Student management
router.get("/students", protect, getAllStudents);
router.delete("/students/:id", protect, deleteStudent);
router.post("/students", protect, addStudent);

router.post("/admin/approve", protect, approveAdmin);
router.get("/admin/pending", protect, getPendingAdmins);

// 🖼️ Profile picture upload
router.post("/upload-profile-pic", protect, upload.single("profilePic"), uploadProfilePic);

export default router;