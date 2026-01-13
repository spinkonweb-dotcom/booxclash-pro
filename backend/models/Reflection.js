import mongoose from "mongoose";

const reflectionSchema = new mongoose.Schema(
  {
    prompt: { type: [String], required: true },
    response: { type: String, required: true },
    studentId: { type: String }, // Optional: Link to a specific user
    level: { type: Number }, // NEW: Optional level/age
    aiFeedbackTeacher: { type: String }, // NEW
    aiFeedbackStudent: { type: String }, // NEW
  },
  { timestamps: true }
);

export default mongoose.model("Reflection", reflectionSchema);
