import mongoose from "mongoose";

// ✅ Define a sub-schema for completed lessons
const completedLessonSchema = new mongoose.Schema(
  {
    lessonId: {
      type: String, // e.g. "1", "math-101", etc.
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    type: {
      type: String, // 'lesson' or 'topic'
      required: true,
    },
    completedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false } // Prevent Mongoose from adding _id to each sub-document
);

// ✅ Main Child schema
const childSchema = new mongoose.Schema(
  {
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    childName: {
      type: String,
      required: true,
      trim: true,
    },
    country: {
      type: String,
      required: true,
      trim: true,
    },
    // 🌟 UPDATED: Changed type to String to accommodate Reading Levels ("Starter", "Basic") 
    // and numerical grades ("1", "2").
    childGrade: {
      type: String, 
      required: true,
    },
    avatarUrl: {
      type: String,
      default: "/images/default_avatar.png",
    },
    curriculum: {
      type: String,
      trim: true,
    },
    subject: {
      type: String,
      trim: true,
    },
    points: {
      type: Number,
      default: 0,
    },
    streak: {
      type: Number,
      default: 0,
    },
    // ✅ Updated to store lesson details, not just IDs
    lessonsCompleted: {
      type: [completedLessonSchema],
      default: [],
    },
    isPremium: {
      type: Boolean,
      default: false,
    },
    progressStatus: {
      type: String,
      enum: ['active', 'needs_upgrade', 'premium'], // Possible values
      default: 'active',
    },
  },
  { timestamps: true }
);

const Child = mongoose.model("Child", childSchema);
export default Child;