import mongoose from "mongoose";

// ✅ Sub-schema for answers in quizzes/reflections
const AnswerSchema = new mongoose.Schema(
  {
    questionId: { type: String, required: true },
    prompt: { type: String }, // actual question text
    selectedAnswer: { type: String }, // child's chosen answer
    correctAnswer: { type: String },
    isCorrect: { type: Boolean, required: true },
    pointsEarned: { type: Number, default: 0 },
    timeSpentSeconds: { type: Number, default: 0 }, // per question time
  },
  { _id: false }
);

// ✅ Sub-schema for step activity
const StepActivitySchema = new mongoose.Schema(
  {
    stepName: {
      type: String,
      enum: ["start", "watch", "know", "quiz", "do", "reflect", "summary"],
      required: true,
    },
    timeSpentMinutes: { type: Number, default: 0 }, // time in this step
    answers: {
      type: [AnswerSchema],
      default: [], // ✅ ensures steps always have an array, not undefined
    },
  },
  { _id: false }
);

// ✅ Main activity log schema
const ActivityLogSchema = new mongoose.Schema(
  {
    childId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    childName: { type: String, trim: true },

    // Quest metadata
    subject: { type: String, required: true, trim: true },
    topic: { type: String, required: true, trim: true },
    level: { type: Number, required: true },
    curriculum: { type: String, trim: true },

    // Track all steps
    steps: {
      type: [StepActivitySchema],
      default: [], // ✅ safe default
    },

    // Totals for quick lookup
    totalPoints: { type: Number, default: 0 },
    totalQuestionsAttempted: { type: Number, default: 0 },
    totalCorrect: { type: Number, default: 0 },
    totalWrong: { type: Number, default: 0 },
    totalTimeMinutes: { type: Number, default: 0 }, // sum of all steps

    // Quest completion
    completedAt: { type: Date },

    // ✅ Track the quest the child is currently at
    currentQuest: {
      subject: { type: String, trim: true },
      topic: { type: String, trim: true },
      level: { type: Number },
      startedAt: { type: Date, default: Date.now },
      status: {
        type: String,
        enum: ["in-progress", "completed"],
        default: "in-progress",
      },
    },
  },
  { timestamps: true }
);

export default mongoose.model("ActivityLog", ActivityLogSchema);
