// routes/ttsRoutes.js
import { Router } from 'express';
import { synthesizeSpeech } from '../controllers/ttsController.js';

const router = Router();

// POST route to synthesize speech
router.post('/tts', synthesizeSpeech);

export default router;