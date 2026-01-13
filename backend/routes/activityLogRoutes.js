import express from "express";
import { 
  createActivityLog, 
  getActivityLogsByChild, 
  updateActivityLog,
  getLatestActivityLog
} from "../controllers/activityLogController.js";

const router = express.Router();

router.post("/", createActivityLog);
router.get("/latest/:childId", getLatestActivityLog); // <-- added
router.get("/:childId", getActivityLogsByChild);
router.put("/:id", updateActivityLog);

export default router;
