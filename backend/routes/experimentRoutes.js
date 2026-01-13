import { Router } from 'express';
import { createExperiment, getExperiments, getExperimentById, updateExperiment, deleteExperiment } from '../controllers/experimentController.js';
import uploadExperimentThumbnail from '../middleware/uploadExperimentThumbnail.js';

const router = Router();

router.post('/', uploadExperimentThumbnail.single('thumbnail'), createExperiment);
router.get('/', getExperiments);
router.get('/:id', getExperimentById); // ✅ ADD THIS LINE
router.put('/:id', uploadExperimentThumbnail.single('thumbnail'), updateExperiment);
router.delete('/:id', deleteExperiment);

export default router;
