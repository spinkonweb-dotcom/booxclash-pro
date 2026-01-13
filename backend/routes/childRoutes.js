import express from "express";
import { 
  createChild, 
  updateChildDetails,
  updateChildProgress,
  getChildrenForParent,
  getChildById,
  upgradeChildToPremium,
  uploadAvatar,
  requestUpgradeNotification // <-- IMPORT NEW FUNCTION
} from "../controllers/childController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// --- Routes ---

// POST /api/children - For creating a new child
router.post("/", createChild);

// GET /api/children/my-children - Get all children for the logged-in parent
router.get("/my-children", protect, getChildrenForParent);

// GET /api/children/:id - Get a single child's data by ID
router.get("/:id", protect, getChildById);

// PATCH /api/children/:id - For updating setup details (curriculum, subject)
router.patch('/:id', protect, updateChildDetails);

// PATCH /api/children/:id/progress - For saving game progress
router.patch('/:id/progress', protect, updateChildProgress);

// PATCH /api/children/:id/upgrade - For upgrading a single child to premium by admin
router.patch("/:id/upgrade", protect, authorize('superadmin'), upgradeChildToPremium);

// --- NEW ROUTE for handling the "Notify Parent" button click ---
router.patch("/:id/request-upgrade", protect, requestUpgradeNotification);

// POST /api/children/upload-avatar - For handling avatar image uploads
router.post("/upload-avatar", uploadAvatar);

export default router;

