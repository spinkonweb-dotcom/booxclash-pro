import React, { useState, useEffect } from "react";
import { WatchContentType } from "../FoundationContent";

// Define the Props interface for the WatchContent component
interface WatchContentProps {
  initialData?: WatchContentType; // Data passed from the parent for initial state or editing
  onChange: (data: WatchContentType) => void; // Callback to update the parent's state
}

const WatchContent: React.FC<WatchContentProps> = ({ initialData, onChange }) => {
  // Initialize internal state with initialData or sensible defaults
  const [videoLink, setVideoLink] = useState(initialData?.videoLink || "");
  const [explanation, setExplanation] = useState(initialData?.explanation || "");
  const [points, setPoints] = useState<number>(initialData?.points || 0);

  // Effect to update internal state when initialData changes (e.g., when editing an existing lesson)
  useEffect(() => {
    if (initialData) {
      setVideoLink(initialData.videoLink || "");
      setExplanation(initialData.explanation || "");
      setPoints(initialData.points || 0);
    }
  }, [initialData]);

  // Helper function to emit changes to the parent
  const emitChange = (partial: Partial<WatchContentType> = {}) => {
    onChange({
      videoLink,
      explanation,
      points,
      ...partial, // Apply any specific changes from the current handler
    });
  };

  // Handler for video link changes
  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVideoLink = e.target.value;
    setVideoLink(newVideoLink);
    emitChange({ videoLink: newVideoLink });
  };

  // Handler for explanation changes
  const handleExplanationChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newExplanation = e.target.value;
    setExplanation(newExplanation);
    emitChange({ explanation: newExplanation });
  };

  // Handler for points changes
  const handlePointsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPoints = Number(e.target.value);
    setPoints(newPoints);
    emitChange({ points: newPoints });
  };

  return (
    <div className="bg-white p-4 rounded shadow-md space-y-3">
      <h3 className="text-lg font-semibold mb-2">📺 Watch Content</h3>

      <div>
        <label className="block text-sm font-medium">YouTube Link</label>
        <input
          type="url"
          value={videoLink}
          onChange={handleVideoChange}
          placeholder="https://www.youtube.com/watch?v=..."
          className="w-full border p-2 rounded mt-1"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Brief Explanation</label>
        <textarea
          value={explanation}
          onChange={handleExplanationChange}
          rows={3}
          className="w-full border p-2 rounded mt-1"
          placeholder="Why is this video important?"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Points</label>
        <input
          type="number"
          value={points}
          onChange={handlePointsChange}
          className="w-full border p-2 rounded mt-1"
          placeholder="Enter points for Watch activity"
        />
      </div>
    </div>
  );
};

export default WatchContent;
