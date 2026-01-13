import mongoose from "mongoose";

// Schema for the "Start" (Spark Curiosity) section
const StartContentSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["text-prompt", "multiple-choice", "image", "video", "riddle", "visual"],
    required: true,
  },
  prompt: { type: String },
  options: [String],
  correctAnswer: { type: String },
  image: { type: String },
  videoLink: { type: String },
  points: { type: Number, default: 0 },
}, { _id: false });

// Schema for a single visual option within a Know question
const KnowVisualOptionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  image: { type: String, required: true },
}, { _id: false });

// Schema for "Know" questions
const KnowQuestionSchema = new mongoose.Schema({
  id: { type: String, required: true },
  type: {
    type: String,
    enum: ["short-answer", "multiple-choice", "visual"],
    required: true,
  },
  prompt: { type: String, required: true },
  explanation: { type: String },
  options: [String], // for multiple-choice (text)
  visualOptions: [KnowVisualOptionSchema], // for visual multiple-choice - THIS IS THE NEW FIELD
  correctAnswer: { type: String },
  suggestedAnswers: [String],
  image: { type: String },
  points: { type: Number, default: 0 },
}, { _id: false });

// Schema for "Do" component
const DoComponentInfoSchema = new mongoose.Schema({
  componentLink: { type: String },
  points: { type: Number, default: 0 },
}, { _id: false });

// Schema for "Watch" content
const WatchContentSchema = new mongoose.Schema({
  videoLink: { type: String, required: true },
  explanation: { type: String, required: true },
  points: { type: Number, default: 0 },
}, { _id: false });

// Schema for quiz questions
const QuizQuestionSchema = new mongoose.Schema({
  id: { type: String, required: true },
  type: {
    type: String,
    enum: ["short-answer", "multiple-choice"],
    required: true,
  },
  question: { type: String, required: true },
  options: [String],
  answer: { type: String, required: true },
  points: { type: Number, default: 0 },
}, { _id: false });

// Schema for the full lesson
const FoundationLessonContentSchema = new mongoose.Schema({
  lessonId: { type: String, required: true, unique: true },
  curriculum: {
    type: String,
    enum: ["Local", "Cambridge"],
    required: true,
  },
  subject: { type: String, required: true },
  topic: { type: String, required: true },
  level: { type: Number, required: true, min: 1, max: 4 },
  thematicArea: { type: String, required: false }, // NEW: Added field for thematic area

  start: StartContentSchema,
  knowQuestions: { type: [KnowQuestionSchema], default: [] },
  doComponent: DoComponentInfoSchema,
  watchContent: { type: WatchContentSchema, required: true },
  reflectPrompt: {
    prompts: { type: [String], default: [] },
    points: { type: Number, default: 0 },
  },
  quiz: { type: [QuizQuestionSchema], default: [] },

  points: {
    quiz: { type: Number, default: 10 },
  },
}, { timestamps: true });

// Ensure uniqueness for curriculum + subject + topic + level
FoundationLessonContentSchema.index(
  { curriculum: 1, subject: 1, topic: 1, level: 1 },
  { unique: true }
);

// Keep model name consistent
const FoundationLessonContent = mongoose.models.FoundationLessonContent || mongoose.model("FoundationLessonContent", FoundationLessonContentSchema);

export default FoundationLessonContent;