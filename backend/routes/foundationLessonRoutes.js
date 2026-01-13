import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  createLessonContent,
  getLessonContent,
  getTopicsBySubject,
  getAllLessons,
  updateLesson,
  deleteLesson,
} from '../controllers/foundationLessonController.js';

const router = express.Router();

// Create new lesson
router.post('/', protect, createLessonContent);

// Get all lessons
router.get('/', getAllLessons);

// Get lesson content (filters via query params)
router.get('/content', getLessonContent);

// Get topics by subject (works with both /topics/:subject and /topics?subject=...)
router.get('/topics', getTopicsBySubject);
router.get('/topics/:subject', getTopicsBySubject);

// Update lesson
router.put('/:id', protect, updateLesson);

// Delete lesson
router.delete('/:id', protect, deleteLesson);

export default router;
