import mongoose from "mongoose";

const itemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  imageUrl: { type: String, required: true }, // store uploaded image URL or path
});

const materialToolSetSchema = new mongoose.Schema({
  subject: { type: String, enum: ["Math", "Physics", "Chemistry", "Biology"], required: true },
  topic: { type: String, required: true },
  materials: [itemSchema],
  tools: [itemSchema],
}, { timestamps: true });

export default mongoose.models.MaterialToolSet || mongoose.model("MaterialToolSet", materialToolSetSchema);
