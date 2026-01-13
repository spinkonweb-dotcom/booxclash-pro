import express from 'express';
import { saveMaterialsTools, getMaterialsToolsByTopic } from '../controllers/materialsToolsController.js';
import multer from 'multer';

// Setup Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // your uploads folder
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });

const router = express.Router();

// Save materials/tools route
router.post(
  '/',
  upload.fields([
    { name: 'materialsImages', maxCount: 10 },
    { name: 'toolsImages', maxCount: 10 }
  ]),
  saveMaterialsTools
);

// Get materials/tools by topic route
router.get('/', getMaterialsToolsByTopic);

export default router;
