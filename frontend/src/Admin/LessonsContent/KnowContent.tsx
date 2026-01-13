import React from "react";
import axios from "axios";
import { KnowQuestionType } from "../FoundationContent";

// Define the Props interface for the KnowContent component
interface Props {
  questions: KnowQuestionType[];
  setQuestions: (questions: KnowQuestionType[]) => void;
  points?: number; // Optional prop for global points
  setPoints?: (points: number) => void; // Optional setter for global points
}

// Ensure API_BASE is correctly configured for image uploads
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";

const KnowContent: React.FC<Props> = ({ questions, setQuestions, points = 0, setPoints }) => {
  // Adds a new question to the list with a default type and unique ID
  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: crypto.randomUUID(), // Generates a unique ID for the new question
        type: "multiple-choice", // Default type for new questions
        prompt: "",
        points: points, // Inherit default points from the global points prop
        suggestedAnswers: [""],
        explanation: ""
      },
    ]);
  };

  // Updates specific fields of a question at a given index.
  // This function also handles resetting irrelevant fields when the question type changes.
  const updateQuestion = (index: number, newFields: Partial<KnowQuestionType>) => {
    const updatedQuestions = [...questions];
    const currentQuestion = { ...updatedQuestions[index] }; // Create a mutable copy of the current question

    // If the type is changing, reset relevant fields based on the new type
    if (newFields.type && newFields.type !== currentQuestion.type) {
      const newType = newFields.type;

      // Clear fields not relevant to the new type
      if (newType === "short-answer") {
        delete currentQuestion.options;
        delete currentQuestion.visualOptions;
        delete currentQuestion.correctAnswer;
        delete currentQuestion.image; // Clear main image for non-visual types
        if (!currentQuestion.suggestedAnswers) {
          currentQuestion.suggestedAnswers = [""]; // Initialize with one empty suggested answer
        }
      } else if (newType === "multiple-choice") {
        delete currentQuestion.visualOptions;
        delete currentQuestion.suggestedAnswers;
        delete currentQuestion.image; // Clear main image for non-visual types
        if (!currentQuestion.options || currentQuestion.options.length === 0) {
          currentQuestion.options = ["", ""]; // Initialize with two empty options
        }
      } else if (newType === "visual") {
        delete currentQuestion.options;
        delete currentQuestion.suggestedAnswers;
        if (!currentQuestion.visualOptions || currentQuestion.visualOptions.length === 0) {
          currentQuestion.visualOptions = [{ text: "", image: "" }]; // Initialize with one empty visual option
        }
      }
    }

    // Apply the new fields to the (potentially reset) current question
    updatedQuestions[index] = { ...currentQuestion, ...newFields };
    setQuestions(updatedQuestions);
  };

  // Removes a question from the list at a given index
  const removeQuestion = (index: number) => {
    const updated = [...questions];
    updated.splice(index, 1); // Removes 1 element at the specified index
    setQuestions(updated);
  };

  // Applies the given points value to all existing questions
  const applyPointsToAll = (value: number) => {
    if (setPoints) setPoints(value); // Update the global points state if available
    const updated = questions.map((q) => ({ ...q, points: value }));
    setQuestions(updated); // Update points for all questions in local state
  };

  // Handles image uploads for both main question images and visual option images
  const onImageChange = async (file: File, questionIndex: number, optionIndex?: number) => {
    const formData = new FormData();
    formData.append("image", file);

    try {
      // Make API call to upload the image
      const res = await axios.post(`${API_BASE}/api/lesson-content/upload-image`, formData);
      const imageUrl = res.data.imageUrl; // Get the URL of the uploaded image

      if (imageUrl) {
        const updatedQuestions = [...questions];
        if (optionIndex !== undefined) {
          // If optionIndex is provided, update the image for a specific visual option
          if (updatedQuestions[questionIndex].visualOptions) {
            updatedQuestions[questionIndex].visualOptions![optionIndex].image = imageUrl;
          }
        } else {
          // Otherwise, update the main image for the question
          updatedQuestions[questionIndex].image = imageUrl;
        }
        setQuestions(updatedQuestions); // Update the state with the new image URL
      }
    } catch (err) {
      console.error("Image upload failed:", err);
      // TODO: Optionally, add user-facing error feedback here (e.g., a toast notification)
    }
  };

  // Updates text or image for a specific visual option
  const updateVisualOption = (
    questionIndex: number,
    optionIndex: number,
    field: 'text' | 'image',
    value: string
  ) => {
    const updatedQuestions = [...questions];
    if (updatedQuestions[questionIndex].visualOptions) {
      updatedQuestions[questionIndex].visualOptions![optionIndex][field] = value;
      setQuestions(updatedQuestions);
    }
  };

  // Adds a new empty visual option to a question
  const addVisualOption = (questionIndex: number) => {
    const updatedQuestions = [...questions];
    // Initialize visualOptions array if it doesn't exist
    if (!updatedQuestions[questionIndex].visualOptions) {
      updatedQuestions[questionIndex].visualOptions = [];
    }
    updatedQuestions[questionIndex].visualOptions.push({ text: "", image: "" });
    setQuestions(updatedQuestions);
  };

  // Removes a visual option from a question
  const removeVisualOption = (questionIndex: number, optionIndex: number) => {
    const updatedQuestions = [...questions];
    if (updatedQuestions[questionIndex].visualOptions) {
      updatedQuestions[questionIndex].visualOptions.splice(optionIndex, 1);
      setQuestions(updatedQuestions);
    }
  };

  return (
    <div className="space-y-4 bg-white p-4 rounded shadow-md">
      <h3 className="text-lg font-semibold text-gray-800">📘 Know Step Questions</h3>

      {/* Section for setting global points for all questions */}
      {setPoints && (
        <div className="mb-4 p-3 border rounded-lg bg-blue-50">
          <label htmlFor="global-points" className="block text-sm font-medium text-blue-800 mb-1">
            Points (applies to all questions)
          </label>
          <input
            id="global-points"
            type="number"
            value={points}
            onChange={(e) => applyPointsToAll(Number(e.target.value))}
            placeholder="Enter points for all Know activity questions"
            className="w-full border border-blue-300 p-2 rounded-md focus:ring-blue-500 focus:border-blue-500"
            min="0"
          />
        </div>
      )}

      {/* Map through each question to render its editor fields */}
      {questions.map((q, index) => (
        <div key={q.id} className="border border-gray-200 p-4 rounded-lg bg-gray-100 space-y-4 shadow-sm">
          {/* Question Type Selection */}
          <div className="flex items-center gap-2">
            <label htmlFor={`type-${q.id}`} className="text-sm font-medium text-gray-700">Question Type:</label>
            <select
              id={`type-${q.id}`}
              value={q.type}
              onChange={(e) => {
                updateQuestion(index, { type: e.target.value as KnowQuestionType["type"] });
              }}
              className="p-2 rounded-md border border-gray-300 bg-white text-gray-800 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="multiple-choice">Multiple Choice (Text)</option>
              <option value="visual">Visual Multiple Choice</option>
            </select>
          </div>

          {/* Question Prompt */}
          <div>
            <label htmlFor={`prompt-${q.id}`} className="block text-sm font-medium text-gray-700 mb-1">Question Prompt:</label>
            <input
              id={`prompt-${q.id}`}
              type="text"
              value={q.prompt}
              onChange={(e) => updateQuestion(index, { prompt: e.target.value })}
              placeholder="Enter the question prompt"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          {/* Explanation */}
          <div>
            <label htmlFor={`explanation-${q.id}`} className="block text-sm font-medium text-gray-700 mb-1">Explanation (Optional):</label>
            <textarea
              id={`explanation-${q.id}`}
              value={q.explanation || ""}
              onChange={(e) => updateQuestion(index, { explanation: e.target.value })}
              placeholder="Provide an explanation for the correct answer"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500 resize-y"
              rows={3}
            />
          </div>
{/* Points */}
          <div>
            <label htmlFor={`points-${q.id}`} className="block text-sm font-medium text-gray-700 mb-1">Points:</label>
            <input
              id={`points-${q.id}`}
              type="number"
              value={q.points || ''}
              onChange={(e) => {
                // Ensure the value is a number, defaulting to 0 if input is empty
                const value = e.target.value === '' ? undefined : Number(e.target.value);
                updateQuestion(index, { points: value });
              }}
              placeholder="Points for this question"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
              min="0"
            />
          </div>
          {/* Multiple Choice Options (Text-based) */}
          {q.type === "multiple-choice" && (
            <div className="space-y-2 p-3 border border-gray-200 rounded-md bg-white">
              <label className="block text-sm font-medium text-gray-700">Text Options:</label>
              {(q.options || []).map((opt, i) => (
                <div key={i} className="flex gap-2 items-center mb-2">
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => {
                      const newOptions = [...(q.options || [])];
                      newOptions[i] = e.target.value;
                      updateQuestion(index, { options: newOptions });
                    }}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                    placeholder={`Option ${i + 1}`}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const newOptions = [...(q.options || [])];
                      newOptions.splice(i, 1); // Remove this option
                      updateQuestion(index, { options: newOptions });
                    }}
                    className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  updateQuestion(index, { options: [...(q.options || []), ""] })
                }
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
              >
                + Add Text Option
              </button>
            </div>
          )}

          {/* Visual Multiple Choice Options */}
          {q.type === "visual" && (
            <div className="space-y-4 p-3 border border-gray-200 rounded-md bg-white">
              {/* Optional: Main image for the prompt if needed for context */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Main Prompt Image (Optional):</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onImageChange(file, index); // No optionIndex for main image
                  }}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
                {q.image && (
                  <div className="mt-2 text-center">
                    <img
                      src={`${API_BASE}${q.image}`} // Use API_BASE for display
                      alt="Uploaded visual prompt"
                      className="max-w-full max-h-48 rounded-md border border-gray-200 object-contain mx-auto"
                      onError={(e) => { e.currentTarget.src = `https://placehold.co/150x150/cccccc/333333?text=Image+Error`; }}
                    />
                    <p className="text-xs text-gray-500 mt-1">Current Main Image</p>
                  </div>
                )}
              </div>

              <h4 className="text-md font-semibold text-gray-800 border-b pb-2 mb-3">Visual Options:</h4>
              {(q.visualOptions || []).map((opt, i) => (
                <div key={i} className="border border-gray-200 p-3 rounded-md bg-gray-50 space-y-2 mb-3">
                  <label htmlFor={`visual-option-text-${q.id}-${i}`} className="block text-sm font-medium text-gray-700 mb-1">Option {i + 1} Text:</label>
                  <input
                    id={`visual-option-text-${q.id}-${i}`}
                    type="text"
                    value={opt.text}
                    onChange={(e) => updateVisualOption(index, i, 'text', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                    placeholder={`Option ${i + 1} Text`}
                  />
                  <label htmlFor={`visual-option-image-${q.id}-${i}`} className="block text-sm font-medium text-gray-700 mt-2 mb-1">Option {i + 1} Image:</label>
                  <input
                    id={`visual-option-image-${q.id}-${i}`}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) onImageChange(file, index, i); // Pass optionIndex for specific option image
                    }}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                  {opt.image && (
                    <div className="mt-2 text-center">
                      <img
                        src={`${API_BASE}${opt.image}`} // Use API_BASE for display
                        alt={`Option ${i + 1} visual`}
                        className="max-w-full max-h-24 rounded-md border border-gray-200 object-contain mx-auto"
                        onError={(e) => { e.currentTarget.src = `https://placehold.co/100x100/cccccc/333333?text=Image+Error`; }}
                      />
                      <p className="text-xs text-gray-500 mt-1">Current Image</p>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removeVisualOption(index, i)}
                    className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition text-sm mt-2"
                  >
                    Remove Option
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addVisualOption(index)}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
              >
                + Add Visual Option
              </button>
            </div>
          )}

          {/* Correct Answer (Applies to multiple-choice and visual types) */}
          {(q.type === "multiple-choice" || q.type === "visual") && (
            <div>
              <label htmlFor={`correct-answer-${q.id}`} className="block text-sm font-medium text-gray-700 mb-1">Correct Answer:</label>
              <input
                id={`correct-answer-${q.id}`}
                type="text"
                value={q.correctAnswer || ""}
                onChange={(e) =>
                  updateQuestion(index, { correctAnswer: e.target.value })
                }
                placeholder="Enter the exact text of the correct option/answer"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                For multiple choice (text or visual), enter the exact text of the correct option.
              </p>
            </div>
          )}

          {/* Suggested Answers (Only for Short Answer type) */}
          {q.type === "short-answer" && (
            <div className="space-y-2 p-3 border border-gray-200 rounded-md bg-white">
              <label className="block text-sm font-medium text-gray-700">Suggested Answers (for Short Answer):</label>
              {(q.suggestedAnswers || []).map((ans, i) => (
                <div key={i} className="flex gap-2 items-center mb-2">
                  <input
                    type="text"
                    value={ans}
                    onChange={(e) => {
                      const updated = [...(q.suggestedAnswers || [])];
                      updated[i] = e.target.value;
                      updateQuestion(index, { suggestedAnswers: updated });
                    }}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                    placeholder={`Suggested Answer ${i + 1}`}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const updated = [...(q.suggestedAnswers || [])];
                      updated.splice(i, 1); // Remove this suggested answer
                      updateQuestion(index, { suggestedAnswers: updated });
                    }}
                    className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  updateQuestion(index, {
                    suggestedAnswers: [...(q.suggestedAnswers || []), ""],
                  })
                }
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
              >
                + Add Suggested Answer
              </button>
            </div>
          )}

          {/* Remove Question Button */}
          <button
            type="button"
            onClick={() => removeQuestion(index)}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
          >
            Remove Question
          </button>
        </div>
      ))}

      {/* Add New Question Button */}
      <button
        type="button"
        onClick={addQuestion}
        className="px-5 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition font-semibold text-lg"
      >
        + Add Question
      </button>
    </div>
  );
};

export default KnowContent;
