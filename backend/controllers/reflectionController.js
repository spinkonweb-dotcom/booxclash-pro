import dotenv from "dotenv";
dotenv.config();

import Reflection from "../models/Reflection.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// Utility to detect possible student struggles
const detectStruggle = (text) => {
  const lower = text.toLowerCase();

  const struggles = [
    { keyword: "subtract", concept: "subtracting integers", tip: "Think of subtraction as moving left on a number line. If you subtract a negative, you move to the right!" },
    { keyword: "divide", concept: "division", tip: "Division is like sharing equally. For example, 12 ÷ 3 means splitting 12 into 3 equal groups." },
    { keyword: "multiply", concept: "multiplication", tip: "Multiplication is like repeated addition. 3 × 4 means adding 3 four times." },
    { keyword: "fraction", concept: "fractions", tip: "A fraction shows part of a whole. 1/2 means one part out of two equal parts." },
    { keyword: "decimal", concept: "decimals", tip: "Decimals are numbers with parts less than 1. For example, 0.5 means half." },
    { keyword: "negative", concept: "negative numbers", tip: "Negative numbers are less than 0. On a number line, they're to the left of 0." },
    { keyword: "place value", concept: "place value", tip: "Each digit has a value based on where it is. In 245, the 2 is worth 200 because it's in the hundreds place." }
  ];

  return struggles.find(s => lower.includes(s.keyword)) || null;
};

export const submitReflection = async (req, res) => {
  try {
    const { prompt, response, studentId, level } = req.body;

    if (!prompt || !response) {
      return res.status(400).json({ error: "Prompt and response are required" });
    }

    const joinedPrompt = Array.isArray(prompt) ? prompt.join(" ") : prompt;

    const reflection = new Reflection({ prompt, response, studentId, level });
    await reflection.save();

    // Step 1: Grammar correction
    let correctedResponse = response;
    try {
      const correctionPrompt = `Correct this student's sentence for grammar and spelling while keeping the meaning the same: "${response}"`;
      const model = genAI.getGenerativeModel({ model: "models/gemini-1.5-flash-latest" });
      const correctionResult = await model.generateContent({
        contents: [{ parts: [{ text: correctionPrompt }] }],
      });
      correctedResponse = correctionResult.response.text().trim();
    } catch (err) {
      // use original response
    }

    // Step 2: AI Feedback
    const shouldGenerateFeedback = typeof level !== "number" || level >= 2;
    let aiFeedbackTeacher = "";
    let aiFeedbackStudent = "";

    if (shouldGenerateFeedback) {
      const struggle = detectStruggle(correctedResponse);

      // Teacher Feedback
      try {
        const teacherPrompt = `
The student's original reflection prompt was: "${joinedPrompt}"
The student's response was: "${correctedResponse}"

Analyze this reflection. Give supportive feedback, highlight any misunderstandings (especially related to math), and offer 2-3 actionable suggestions for growth.
        `.trim();

        const teacherModel = genAI.getGenerativeModel({ model: "models/gemini-1.5-flash-latest" });
        const result = await teacherModel.generateContent({
          contents: [{ parts: [{ text: teacherPrompt }] }],
        });

        aiFeedbackTeacher = result.response.text().trim();
      } catch {
        aiFeedbackTeacher = "AI feedback could not be generated at this time.";
      }

      // Student Feedback (personalized)
      try {
        const concept = struggle?.concept;
        const tip = struggle?.tip;

        const studentPrompt = `
A grade ${level || 1} student wrote this: "${correctedResponse}"
in response to the question: "${joinedPrompt}".

They are trying hard but may be struggling with ${concept || "a concept in the lesson"}.

Write a friendly and supportive message directly to the student. It should:
1. Praise their effort.
2. Briefly explain ${concept || "something they might be confused about"} in simple terms.
3. Give an example or tip to help them next time: ${tip || "Try to think step by step and ask questions when you're unsure!"}

Keep the tone kind, short, and age-appropriate.
        `.trim();

        const studentModel = genAI.getGenerativeModel({ model: "models/gemini-1.5-flash-latest" });
        const result = await studentModel.generateContent({
          contents: [{ parts: [{ text: studentPrompt }] }],
        });

        aiFeedbackStudent = result.response.text().trim();
      } catch {
        aiFeedbackStudent = struggle
          ? `You're doing great! It sounds like you're trying to learn ${struggle.concept}. Here's a tip: ${struggle.tip}`
          : "Great effort! Keep practicing and always ask questions when you're not sure.";
      }
    }

    // Save updated reflection
    reflection.aiFeedbackTeacher = aiFeedbackTeacher;
    reflection.aiFeedbackStudent = aiFeedbackStudent;
    await reflection.save();

    res.status(201).json({
      message: "Reflection saved and AI feedback generated!",
      reflection,
      aiFeedback: {
        teacher: aiFeedbackTeacher,
        student: aiFeedbackStudent,
      },
    });
  } catch (err) {
    console.error("Error in submitReflection:", err);
    res.status(500).json({ error: "Server error" });
  }
};
