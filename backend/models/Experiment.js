import { Schema, model } from 'mongoose';

const MaterialToolSchema = new Schema({
  id: String,
  name: String,
  imageUrl: String,
});

const ExperimentSchema = new Schema({
  topic: { type: String, required: true },
  name: { type: String, required: true },
  materials: [MaterialToolSchema],
  tools: [MaterialToolSchema],
  result: { type: String },
  steps: { type: String }, // ➡️ NEW field for steps
  thumbnailUrl: { type: String }, // for thumbnail
}, {
  timestamps: true // createdAt and updatedAt
});

export default model('Experiment', ExperimentSchema);
