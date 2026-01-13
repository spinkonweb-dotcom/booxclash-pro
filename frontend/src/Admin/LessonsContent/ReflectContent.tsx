import React, { useState, useEffect } from "react";
import { ReflectContentType } from "../FoundationContent"; // Import the type from the parent

// Define the Props interface for the ReflectContent component
interface ReflectContentProps {
  initialData?: ReflectContentType; // Data passed from the parent for initial state or editing
  onChange: (data: ReflectContentType) => void; // Callback to update the parent's state
}

const ReflectContent: React.FC<ReflectContentProps> = ({ initialData, onChange }) => {
  // Initialize internal state with initialData or sensible defaults
  const [prompts, setPrompts] = useState<string[]>(initialData?.prompts || []);
  const [points, setPoints] = useState<number>(initialData?.points || 0);
  const [newPrompt, setNewPrompt] = useState(""); // State for the new prompt input field

  // Effect to update internal state when initialData changes (e.g., when editing an existing lesson)
  useEffect(() => {
    if (initialData) {
      setPrompts(initialData.prompts || []);
      setPoints(initialData.points || 0);
    }
  }, [initialData]);

  // Helper function to emit changes to the parent
  const emitChange = (partial: Partial<ReflectContentType> = {}) => {
    onChange({
      prompts,
      points,
      ...partial, // Apply any specific changes from the current handler
    });
  };

  // Handler for adding a new prompt
  const handleAddPrompt = () => {
    const trimmed = newPrompt.trim();
    if (!trimmed) return;

    const updatedPrompts = [...prompts, trimmed];
    setPrompts(updatedPrompts);
    emitChange({ prompts: updatedPrompts });
    setNewPrompt(""); // Clear the input field after adding
  };

  // Handler for deleting an existing prompt
  const handleDelete = (indexToRemove: number) => {
    const updatedPrompts = prompts.filter((_, i) => i !== indexToRemove);
    setPrompts(updatedPrompts);
    emitChange({ prompts: updatedPrompts });
  };

  // Handler for points changes
  const handlePointsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPoints = Number(e.target.value);
    setPoints(newPoints);
    emitChange({ points: newPoints });
  };

  return (
    <div className="space-y-3 bg-white p-4 rounded shadow-md">
      <h3 className="text-lg font-semibold mb-2">💭 Reflect Content</h3>

      <ul className="list-decimal list-inside space-y-1 text-purple-900">
        {prompts.map((prompt, index) => (
          <li key={index} className="flex justify-between items-center">
            <span>{prompt}</span>
            <button
              onClick={() => handleDelete(index)}
              className="text-red-600 text-xs hover:underline"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>

      <div className="flex flex-col sm:flex-row gap-2 mt-4">
        <input
          type="text"
          value={newPrompt}
          onChange={(e) => setNewPrompt(e.target.value)}
          placeholder="e.g., What did you find interesting today?"
          className="w-full p-2 border rounded"
        />
        <button
          type="button"
          onClick={handleAddPrompt}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Add Question
        </button>
      </div>

      <div className="mt-4">
        <label className="block text-sm font-medium">Points</label>
        <input
          type="number"
          value={points} // Use internal 'points' state
          onChange={handlePointsChange}
          className="w-full border p-2 rounded"
          placeholder="Enter points for Reflect activity"
        />
      </div>
    </div>
  );
};

export default ReflectContent;
