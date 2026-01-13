import React, { useState } from "react";
import { readingStarterData } from "../../readingStarter.data";

interface BiteProps {
  onComplete: () => void;
}

const Bite1: React.FC<BiteProps> = ({ onComplete }) => {
  // 1. Get the Bite Data
  const bite = readingStarterData.bites.find((b) => b.id === 1);

  if (!bite) return <div className="p-4 text-red-500">Error: Bite 1 data not found.</div>;

  const lessons = bite.lessons;
  const [lessonIndex, setLessonIndex] = useState(0);

  // 2. Get the Current Lesson Configuration
  const currentLessonConfig = lessons[lessonIndex];

  if (!currentLessonConfig) {
    return <div className="p-4">Loading lesson...</div>;
  }

  // --- THE FIX IS HERE ---
  // We cast to React.ComponentType<any> to allow 'onComplete' and dynamic props without TS errors
  const CurrentLessonComponent = currentLessonConfig.component as React.ComponentType<any>;

  const handleLessonComplete = () => {
    if (lessonIndex < lessons.length - 1) {
      setLessonIndex(lessonIndex + 1);
    } else {
      onComplete(); // Notify parent (Dashboard)
    }
  };

  return (
    <div className="p-4 bg-white shadow rounded max-w-xl mx-auto mt-4 min-h-[500px]">
      {/* BITE HEADER */}
      <div className="mb-6 border-b pb-2 flex justify-between items-end">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Bite {bite.id}</h2>
          <p className="text-sm text-slate-500">
             Level 1: Foundations
          </p>
        </div>
        <div className="text-sm font-medium text-slate-400">
          Lesson {lessonIndex + 1} / {lessons.length}
        </div>
      </div>

      {/* ACTIVE LESSON RENDERER */}
      <div className="mt-4">
        <CurrentLessonComponent
          key={currentLessonConfig.id} 
          {...(currentLessonConfig.props || {})} 
          onComplete={handleLessonComplete}
        />
      </div>
    </div>
  );
};

export default Bite1;