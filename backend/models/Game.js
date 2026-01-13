import mongoose from "mongoose";

const gameSchema = new mongoose.Schema({
  title: { type: String, required: true },
  component: { type: String, required: true },
  imageUrl: { type: String, required: true },
});

export default mongoose.model("Game", gameSchema);
