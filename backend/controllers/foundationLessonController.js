import Lesson from '../models/FoundationContentModel.js';

// @desc Create new lesson
// @route POST /api/foundation-lessons
// @access Private (Admin, Superadmin)
export const createLessonContent = async (req, res) => {
  try {
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'superadmin')) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const lesson = new Lesson(req.body);
    await lesson.save();

    res.status(201).json(lesson);
  } catch (error) {
    res.status(500).json({ message: 'Error creating lesson', error: error.message });
  }
};

// @desc Get all lessons
// @route GET /api/foundation-lessons
// @access Public
export const getAllLessons = async (req, res) => {
  try {
    const lessons = await Lesson.find();
    res.json(lessons);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching lessons', error: error.message });
  }
};

// @desc Get lesson content by filters
// @route GET /api/foundation-lessons/content
// @access Public
// @desc Get lesson content by filters
// @route GET /api/foundation-lessons/content
// @access Public
export const getLessonContent = async (req, res) => {
  try {
    const { subject, topic, level, curriculum } = req.query;

    const filter = {};
    if (subject) filter.subject = subject;
    if (topic) filter.topic = topic;
    if (level) filter.level = Number(level);
    if (curriculum) filter.curriculum = curriculum;

    // CHANGED: Use findOne() instead of find()
    const lesson = await Lesson.findOne(filter);

    // Add a check to handle cases where no lesson is found
    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found with the provided filters.' });
    }

    // CHANGED: Respond with the single lesson object
    res.json(lesson);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching lesson content', error: error.message });
  }
};

// @desc Get topics by subject + filters
// @route GET /api/foundation-lessons/topics OR /api/foundation-lessons/topics/:subject
// @access Public
export const getTopicsBySubject = async (req, res) => {
  try {
    const subject = req.params.subject || req.query.subject;
    const { level, thematicArea } = req.query;

    if (!subject) {
      return res.status(400).json({ message: 'Subject is required' });
    }

    const filter = { subject };
    if (level) filter.level = Number(level);
    if (thematicArea) filter.thematicArea = thematicArea;

    const lessons = await Lesson.find(filter);

    const topics = lessons.map(l => ({
      topicName: l.topic,   // frontend expects `topicName`
      thematicArea: l.thematicArea,
    }));

    res.json({ topics });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching topics', error: error.message });
  }
};

// @desc Update lesson
// @route PUT /api/foundation-lessons/:id
// @access Private (Admin, Superadmin)
export const updateLesson = async (req, res) => {
  try {
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'superadmin')) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const updated = await Lesson.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) {
      return res.status(404).json({ message: 'Lesson not found' });
    }

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Error updating lesson', error: error.message });
  }
};

// @desc Delete lesson
// @route DELETE /api/foundation-lessons/:id
// @access Private (Admin, Superadmin)
export const deleteLesson = async (req, res) => {
  try {
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'superadmin')) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const deleted = await Lesson.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Lesson not found' });
    }

    res.json({ message: 'Lesson deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting lesson', error: error.message });
  }
};
