import express from "express";
import { getAllStudents, createStudent, deleteStudent } from "../controllers/studentController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getAllStudents);
router.post("/", protect, createStudent);
router.delete("/:id", protect, deleteStudent);

export default router;
