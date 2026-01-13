import React from "react";
import { Check, Star, Lock } from "lucide-react";
import { Lesson } from "../Data/lessonData";

interface LessonCardProps {
  lesson: Lesson;
  isCompleted: boolean;
  isCurrent: boolean;
  isLocked: boolean;
  onClick: () => void;
  style?: React.CSSProperties;
}

const LessonCard = React.forwardRef<HTMLButtonElement, LessonCardProps>(
  ({ lesson, isCompleted, isCurrent, isLocked, onClick, style }, ref) => {
    let StatusIcon;
    let iconClasses = "";
    let cardBorder = "border-gray-400"; // Default border

    if (isCompleted) {
      StatusIcon = Check;
      iconClasses = "bg-green-500 text-white";
      cardBorder = "border-green-500";
    } else if (isCurrent) {
      StatusIcon = Star;
      iconClasses = "bg-blue-500 text-white animate-pulse";
      cardBorder = "border-blue-500 scale-105"; // Highlight current card
    } else {
      StatusIcon = Lock;
      iconClasses = "bg-gray-500 text-white";
    }

    // Fallback image if lesson doesn’t include one
    const imageUrl = lesson.cardImageUrl || "/images/lessons/default-card.png";

    return (
      <button
        ref={ref}
        onClick={onClick}
        disabled={isLocked}
        className={`relative w-48 h-48 m-4 rounded-xl shadow-lg border-4 transition-all duration-300 transform 
          hover:scale-105 ${cardBorder} 
          ${isLocked && !isCurrent ? "grayscale opacity-60 cursor-not-allowed" : ""}
          ${isCurrent ? "scale-105" : ""}`}
        style={style}
      >
        {/* Background Image */}
        <div
          className="w-full h-full bg-cover bg-center rounded-xl"
          style={{ backgroundImage: `url(${imageUrl})` }}
        />

        {/* Title Container */}
        <div className="absolute bottom-0 left-0 w-full p-2 bg-black bg-opacity-50 rounded-b-xl">
          <p className="text-white text-sm font-semibold text-center truncate">
            {lesson.title}
          </p>
        </div>

        {/* Status Icon */}
        <div
          className={`absolute -top-3 -right-3 w-10 h-10 rounded-full flex items-center justify-center 
            border-4 border-white shadow-md ${iconClasses}`}
        >
          <StatusIcon size={20} />
        </div>
      </button>
    );
  }
);

LessonCard.displayName = "LessonCard"; // ✅ For better React DevTools debugging
export default LessonCard;
