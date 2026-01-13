import { Router } from 'express';
const router = Router();
import { getRooms } from '../controllers/multiController.js';

router.route('/').get(getRooms);

export default router;