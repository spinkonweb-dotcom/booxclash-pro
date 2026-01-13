import express from "express";
import multer from "multer";
import { uploadQuestions, getQuestions, deleteQuestion } from "../controllers/questionsController.js";

const router = express.Router();

// Set up multer for file storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/') // 'uploads/' is the directory where files will be saved
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  }
});
const upload = multer({ storage: storage });

// Route to upload a single JSON file
router.post("/upload", upload.single("questionsFile"), uploadQuestions);

// Other routes
router.get("/", getQuestions);
router.delete("/:id", deleteQuestion);

export default router;