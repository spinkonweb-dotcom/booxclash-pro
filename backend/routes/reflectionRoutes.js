import express from "express";
import { submitReflection } from "../controllers/reflectionController.js";

const router = express.Router();

router.post("/submit", submitReflection); // This route now handles AI generation as well

export default router;