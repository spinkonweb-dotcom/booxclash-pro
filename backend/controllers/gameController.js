import Game from "../models/Game.js";

export const getAllGames = async (req, res) => {
  try {
    const games = await Game.find().sort({ createdAt: -1 });
    res.json(games);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch games." });
  }
};

export const createGame = async (req, res) => {
  try {
    const { title, component } = req.body;
    const rawPath = req.file?.path || "";
    const imageUrl = rawPath.replace(/\\/g, "/"); // Convert backslashes to forward slashes

    const newGame = new Game({ title, component, imageUrl });
    await newGame.save();
    res.status(201).json(newGame);
  } catch (err) {
    res.status(500).json({ error: "Failed to create game." });
  }
};


export const deleteGame = async (req, res) => {
  try {
    await Game.findByIdAndDelete(req.params.id);
    res.json({ message: "Game deleted successfully." });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete game." });
  }
};

export const updateGame = async (req, res) => {
  try {
    const { title, component } = req.body;
    const rawPath = req.file?.path;
    const imageUrl = rawPath?.replace(/\\/g, "/");

    const updated = await Game.findByIdAndUpdate(
      req.params.id,
      { title, component, ...(imageUrl && { imageUrl }) },
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to update game." });
  }
};

