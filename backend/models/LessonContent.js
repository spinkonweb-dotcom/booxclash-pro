import mongoose from "mongoose";

// Schema for "Start" (Spark Curiosity) section
const StartSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["text-prompt", "multiple-choice", "image", "video", "riddle"],
    required: true,
  },
  prompt: { type: String },
  options: [String],
  correctAnswer: { type: String },
  image: { type: String },
  videoLink: { type: String },
  points: { type: Number },
});

// Schema for individual quiz questions
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
  points: { type: Number },
});

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
  options: [String],
  correctAnswer: { type: String },
  suggestedAnswers: [String],
  image: { type: String },
  points: { type: Number },
});

// Schema for "Watch" content
const WatchContentSchema = new mongoose.Schema({
  videoLink: { type: String, required: true },
  explanation: { type: String, required: true },
  points: { type: Number },
});

const LessonContentSchema = new mongoose.Schema(
  {
    curriculum: {
      type: String,
      enum: ["Local", "Cambridge"],
      required: true,
    },
    subject: { type: String, required: true },
    topic: { type: String, required: true },
    level: { type: Number, required: true },
    start: StartSchema,
    knowQuestions: [KnowQuestionSchema],
    doComponent: {
      componentLink: { type: String },
      points: { type: Number },
    },
    watchContent: WatchContentSchema,
    reflectPrompt: {
      prompts: { type: [String], default: [] },
      points: { type: Number },
    },
    quiz: [QuizQuestionSchema],
  },
  { timestamps: true }
);

// ✅ Updated uniqueness index to include curriculum
LessonContentSchema.index(
  { curriculum: 1, subject: 1, topic: 1, level: 1 },
  { unique: true }
);

const LessonContent =
  mongoose.models.LessonContent || mongoose.model("LessonContent", LessonContentSchema);

export default LessonContent;
