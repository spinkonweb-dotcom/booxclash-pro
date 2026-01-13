import express from "express";
import { getAllParents,deleteParent } from "../controllers/parentController.js";
import { protect, authorize } from "../middleware/authMiddleware.js"; // Assuming you have these

const router = express.Router();

// GET /api/parents - Fetches all parents for the dashboard
// Protected: Only a superadmin can access this
router.get("/", protect, authorize('superadmin'), getAllParents);

// PATCH /api/parents/:id/approve-subscription - Marks a parent's subscription as active
// Protected: Only a superadmin can access this
router.delete("/:id", protect, authorize('superadmin'), deleteParent);
export default router;