import Question from "../models/Questions.js";
import fs from "fs"; // Node.js built-in file system module

// Helper function to read and parse the uploaded JSON file
const parseJsonFile = (filePath) => {
  try {
    const fileContent = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(fileContent);
  } catch (err) {
    console.error("Error parsing JSON file:", err);
    throw new Error("Invalid JSON file provided.");
  }
};

export const uploadQuestions = async (req, res) => {
  try {
    // Check if a file was uploaded
    if (!req.file) {
      return res.status(400).json({ error: "No JSON file uploaded." });
    }

    // Parse the uploaded JSON file
    const questions = parseJsonFile(req.file.path);

    // Validate the parsed data
    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({
        error: "JSON file must contain a non-empty array of questions.",
      });
    }

    // Insert questions into the database
    const inserted = await Question.insertMany(questions);

    // Clean up the temporary file
    fs.unlinkSync(req.file.path);

    res.status(201).json({
      message: "Questions uploaded successfully!",
      insertedCount: inserted.length,
    });
  } catch (err) {
    console.error("Upload error:", err);
    // Ensure the temporary file is deleted in case of an error
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: err.message || "Failed to upload questions." });
  }
};

export const getQuestions = async (req, res) => {
  const { curriculum, subject, level, topic } = req.query;
  const query = {};

  if (curriculum) query.curriculum = curriculum;
  if (subject) query.subject = subject;
  
  // The 'level' field is now a string, so we don't need to cast it to a Number
  if (level) query.level = level;
  
  if (topic) query.topic = topic;

  try {
    const questions = await Question.find(query);
    res.json(questions);
  } catch (err) {
    console.error("Fetch error:", err);
    res.status(500).json({ error: "Failed to fetch questions." });
  }
};

export const deleteQuestion = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await Question.findByIdAndDelete(id);
    if (!result) {
      return res.status(404).json({ error: "Question not found." });
    }
    res.json({ message: "Question deleted successfully." });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ error: "Failed to delete question." });
  }
};