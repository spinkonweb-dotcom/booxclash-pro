import React, { useState, useEffect } from "react";
import { DoComponentType } from "../FoundationContent"; // Import the type from the parent

// Define the Props interface for the DoContent component
interface DoContentProps {
  initialData?: DoComponentType; // Data passed from the parent for initial state or editing
  onChange: (data: DoComponentType) => void; // Callback to update the parent's state
}

const DoContent: React.FC<DoContentProps> = ({ initialData, onChange }) => {
  // Initialize internal state with initialData or sensible defaults
  const [componentLink, setComponentLink] = useState(initialData?.componentLink || "");
  const [points, setPoints] = useState<number>(initialData?.points || 0);

  // Effect to update internal state when initialData changes (e.g., when editing an existing lesson)
  useEffect(() => {
    if (initialData) {
      setComponentLink(initialData.componentLink || "");
      setPoints(initialData.points || 0);
    }
  }, [initialData]);

  // Helper function to emit changes to the parent
  const emitChange = (partial: Partial<DoComponentType> = {}) => {
    onChange({
      componentLink,
      points,
      ...partial, // Apply any specific changes from the current handler
    });
  };

  // Handler for component link changes
  const handleComponentLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newComponentLink = e.target.value;
    setComponentLink(newComponentLink);
    emitChange({ componentLink: newComponentLink });
  };

  // Handler for points changes
  const handlePointsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPoints = Number(e.target.value);
    setPoints(newPoints);
    emitChange({ points: newPoints });
  };

  return (
    <div className="space-y-3 bg-white p-4 rounded shadow-md">
      <h3 className="text-lg font-semibold mb-2">🛠️ Do Content</h3>

      <div>
        <label className="block text-sm font-medium">Component Link</label>
        <input
          type="text"
          value={componentLink}
          onChange={handleComponentLinkChange}
          placeholder="e.g., /components/FractionsGame"
          className="w-full border p-2 rounded"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Points</label>
        <input
          type="number"
          value={points}
          onChange={handlePointsChange}
          className="w-full border p-2 rounded"
          placeholder="Enter points for Do activity"
        />
      </div>
    </div>
  );
};

export default DoContent;
