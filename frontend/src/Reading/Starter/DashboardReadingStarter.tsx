import React, { useState } from "react";
import { readingStarterData } from "../readingStarter.data";

const DashboardStarterReading: React.FC = () => {
  const bites = readingStarterData.bites;
  const [currentBiteIndex, setCurrentBiteIndex] = useState(0);

  const currentBite = bites[currentBiteIndex];
  const BiteComponent = currentBite.component;

  const handleBiteComplete = () => {
    // move to next bite if exists
    if (currentBiteIndex < bites.length - 1) {
      setCurrentBiteIndex(currentBiteIndex + 1);
    } else {
      alert("🎉 All bites completed for this level!");
    }
  };

  return (
    <div className="p-6">
      {/* HEADER */}
      <h1 className="text-2xl font-bold mb-4">Starter Reading Dashboard</h1>

      {/* PROGRESS DISPLAY */}
      <div className="mb-6">
        <p className="text-gray-700">
          Bite {currentBiteIndex + 1} of {bites.length}
        </p>
      </div>

      {/* ACTIVE BITE */}
      <BiteComponent onComplete={handleBiteComplete} />
    </div>
  );
};

export default DashboardStarterReading;
