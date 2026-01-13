import express from "express";
import { lobby } from "../controllers/roomController.js";

const router = express.Router();

// Single lobby route
router.post("/lobby", lobby);

export default router;
