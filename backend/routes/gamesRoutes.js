import express from "express";
import multer from "multer";
import {
  getAllGames,
  createGame,
  deleteGame,
  updateGame,
} from "../controllers/gameController.js";

const router = express.Router();

// Configure multer for image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + "-" + file.originalname),
});

const upload = multer({ storage });

// Routes
router.get("/", getAllGames);
router.post("/", upload.single("image"), createGame);
router.delete("/:id", deleteGame);
router.put("/:id", upload.single("image"), updateGame);

export default router;
