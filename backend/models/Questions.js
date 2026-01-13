import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
  curriculum: {
    type: String,
    enum: ["Local", "Cambridge"],
    required: true,
  },
  subject: { type: String, required: true },
  
  // The 'level' field has been updated to use our defined difficulty levels
  level: {
    type: String,
    enum: [
      "Very Easy",
      "Easy (Foundation)",
      "Intermediate",
      "Advanced",
      "Expert",
      "Master",
    ],
    required: true,
  },

  topic: { type: String, required: true },

  question: { type: String, required: true },
  options: { type: [String], required: true }, // e.g., ["A", "B", "C", "D"]
  answer: { type: String, required: true }, // e.g., "A"
  type: {
    type: String,
    enum: ["multipleChoice", "oneWord", "trueFalse", "visual"],
    default: "multipleChoice",
  },
});

export default mongoose.model("Question", questionSchema);