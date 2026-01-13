import multer from 'multer';
import path from 'path';

// Set up storage for uploaded thumbnails
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/experiments/'); // save in uploads/experiments/
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname)); // randomName.extension
  }
});

const uploadExperimentThumbnail = multer({ storage });

export default uploadExperimentThumbnail;
