import React, { useState, useEffect } from "react";

// Re-use the QuestionType from the parent for consistency
type StartType = "multiple-choice" | "image" | "video" | "visual";

// Define the interface for the StartContent's data, matching StartContentType
interface StartData {
  type: StartType;
  prompt?: string; // Made optional to match parent
  options?: string[]; // Made optional to match parent
  correctAnswer?: string; // Made optional to match parent
  image?: string; // Changed from string | File to string for consistency with backend upload
  videoLink?: string;
  points?: number;
}

interface StartContentProps {
  onChange: (startData: StartData) => void;
  initialData?: StartData; // Use StartData directly as it's already Partial-like with optional fields
}

const StartContent: React.FC<StartContentProps> = ({ onChange, initialData }) => {
  // Initialize state with initialData or sensible defaults, ensuring consistency
  const [type, setType] = useState<StartType>(initialData?.type || "multiple-choice");
  const [prompt, setPrompt] = useState(initialData?.prompt || "");
  const [options, setOptions] = useState<string[]>(initialData?.options || []);
  const [correctAnswer, setCorrectAnswer] = useState(initialData?.correctAnswer || "");
  const [image, setImage] = useState<string>(initialData?.image || ""); // Changed to string
  const [videoLink, setVideoLink] = useState(initialData?.videoLink || "");
  const [points, setPoints] = useState<number>(initialData?.points || 0);

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";

  // Effect to update internal state when initialData changes (e.g., when editing an existing lesson)
  useEffect(() => {
    if (initialData) {
      setType(initialData.type || "multiple-choice");
      setPrompt(initialData.prompt || "");
      setOptions(initialData.options || []);
      setCorrectAnswer(initialData.correctAnswer || "");
      setImage(initialData.image || "");
      setVideoLink(initialData.videoLink || "");
      setPoints(initialData.points || 0);
    }
  }, [initialData]);

  // Function to emit changes to the parent
  const emitChange = (partial: Partial<StartData> = {}) => {
    onChange({
      type,
      prompt,
      options: options.length > 0 ? options : undefined, // Only include if options exist
      correctAnswer: correctAnswer || undefined, // Only include if correct answer exists
      image: image || undefined, // Only include if image exists
      videoLink: videoLink || undefined, // Only include if video link exists
      points,
      ...partial,
    });
  };

  // Handlers for options
  const handleOptionChange = (index: number, value: string) => {
    const updated = [...options];
    updated[index] = value;
    setOptions(updated);
    emitChange({ options: updated });
  };

  const addOption = () => {
    const updated = [...options, ""];
    setOptions(updated);
    emitChange({ options: updated });
  };

  const removeOption = (index: number) => {
    const updated = options.filter((_, i) => i !== index);
    setOptions(updated);
    emitChange({ options: updated });
  };

  // Handler for type change
  const handleTypeChange = (newType: StartType) => {
    setType(newType);
    // Reset relevant fields when type changes to avoid stale data
    if (newType !== "image" && newType !== "visual") setImage("");
    if (newType !== "video") setVideoLink("");
    if (newType === "multiple-choice" || newType === "image" || newType === "video" || newType === "visual") {
      // If these types require options, ensure they are initialized
      if (options.length === 0) setOptions(["", ""]);
    } else {
      setOptions([]); // Clear options if not relevant
      setCorrectAnswer(""); // Clear correct answer if not relevant
    }
    emitChange({ type: newType });
  };

  // Determine if options and correct answer fields should be shown
  const showOptionsAndAnswer = type === "multiple-choice" || type === "image" || type === "video" || type === "visual";

  return (
    <div className="border border-gray-300 p-4 mt-4 rounded-md shadow-sm space-y-3">
      <h3 className="text-lg font-semibold">Start (Spark Curiosity)</h3>

      <div>
        <label className="block text-sm font-medium">Type:</label>
        <select
          value={type}
          onChange={(e) => handleTypeChange(e.target.value as StartType)}
          className="w-full p-2 border border-gray-300 rounded-md"
        >
          <option value="multiple-choice">Multiple Choice</option>
          <option value="image">Image Prompt</option>
          <option value="video">Video Prompt</option>
          <option value="visual">Visual Prompt</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium">Question/Prompt:</label>
        <textarea
          value={prompt}
          onChange={(e) => {
            setPrompt(e.target.value);
            emitChange({ prompt: e.target.value });
          }}
          rows={3}
          className="w-full p-2 border border-gray-300 rounded-md"
          placeholder="Enter the main question or prompt for this section."
        />
      </div>

      {(type === "image" || type === "visual") && (
        <div>
          <label className="block text-sm font-medium">Upload Image:</label>
          <input
            type="file"
            accept="image/*"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;

              const formData = new FormData();
              formData.append("image", file);

              try {
                const res = await fetch(`${API_BASE}/api/lesson-content/upload-image`, {
                  method: "POST",
                  body: formData,
                });

                const data = await res.json();
                if (data.imageUrl) {
                  setImage(data.imageUrl);
                  emitChange({ image: data.imageUrl });
                }
              } catch (error) {
                console.error("Image upload failed", error);
                // TODO: Show user-friendly error message
              }
            }}
            className="block w-full"
          />

          {image && (
            <img
              src={image}
              alt="Uploaded preview"
              className="mt-2 max-w-full max-h-48 rounded border"
            />
          )}
        </div>
      )}

      {type === "video" && (
        <div>
          <label className="block text-sm font-medium">YouTube Link:</label>
          <input
            type="text"
            value={videoLink}
            onChange={(e) => {
              setVideoLink(e.target.value);
              emitChange({ videoLink: e.target.value });
            }}
            placeholder="e.g., https://www.youtube.com/watch?v=dQw4w9WgXcQ"
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>
      )}

      {showOptionsAndAnswer && (
        <>
          <div>
            <label className="block text-sm font-medium">Options:</label>
            {options.map((opt, idx) => (
              <div key={idx} className="flex items-center mb-2">
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => handleOptionChange(idx, e.target.value)}
                  placeholder={`Option ${idx + 1}`}
                  className="block w-full p-2 border border-gray-300 rounded-md"
                />
                {options.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeOption(idx)}
                    className="ml-2 text-red-500 hover:text-red-700"
                    title="Remove Option"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addOption}
              className="text-sm text-blue-500 hover:underline"
            >
              + Add Option
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium">Correct Answer:</label>
            <input
              type="text"
              value={correctAnswer}
              onChange={(e) => {
                setCorrectAnswer(e.target.value);
                emitChange({ correctAnswer: e.target.value });
              }}
              className="w-full p-2 border border-gray-300 rounded-md"
              placeholder="Enter the correct answer"
            />
          </div>
        </>
      )}

      <div>
        <label className="block text-sm font-medium">Points:</label>
        <input
          type="number"
          value={points}
          onChange={(e) => {
            const newPoints = Number(e.target.value);
            setPoints(newPoints);
            emitChange({ points: newPoints });
          }}
          className="w-full border p-2 rounded"
          placeholder="Enter points for Start activity"
        />
      </div>
    </div>
  );
};

export default StartContent;
