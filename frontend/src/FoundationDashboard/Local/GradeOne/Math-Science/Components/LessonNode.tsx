import React from "react";
// 1. Add a new icon (like Gem or Unlock) for the special paywall node
import { Check, Star, Lock, Gem } from "lucide-react"; 
import { Lesson } from "../Data/lessonData";

interface LessonNodeProps {
  lesson: Lesson;
  isCompleted: boolean;
  isCurrent: boolean;
  isLocked: boolean;
  // 2. Add a new prop to identify the specific node that triggers the upgrade modal
  isPaywallTrigger: boolean; 
  onClick: () => void;
  style?: React.CSSProperties;
  paywallIconUrl?: string;
}

const LessonNode = React.forwardRef<HTMLButtonElement, LessonNodeProps>(
  ({ isCompleted, isCurrent, isLocked, isPaywallTrigger, onClick, style }, ref) => {
    let content, buttonClasses;

    if (isCompleted) {
      content = <Check size={40} className="text-green-800" />;
      buttonClasses = "bg-yellow-400 border-yellow-600 cursor-pointer hover:scale-105";
    } else if (isCurrent) {
      content = <Star size={40} className="text-white animate-pulse" />;
      buttonClasses = "bg-blue-500 border-blue-700 scale-110 hover:scale-[1.15] cursor-pointer";
    // 3. Add a new condition for the special paywall trigger node
    } else if (isPaywallTrigger) {
      content = <Gem size={32} className="text-white" />; // Use the Gem icon
      // Give it a distinct, enticing style to encourage clicks
      buttonClasses = "bg-purple-500 border-purple-700 cursor-pointer hover:scale-105 animate-bounce";
    } else { // This handles all other locked nodes
      content = <Lock size={32} className="text-gray-500" />;
      buttonClasses = "bg-gray-300 border-gray-400 cursor-not-allowed";
    }

    return (
      <button
        ref={ref}
        onClick={onClick}
        // 4. CRITICAL CHANGE: Only disable the button if it's locked AND it's NOT the special trigger
        disabled={isLocked && !isPaywallTrigger}
        className={`w-24 h-24 flex items-center justify-center rounded-full border-8 shadow-xl transition-all duration-300 ${buttonClasses}`}
        style={style}
      >
        {content}
      </button>
    );
  }
);

export default LessonNode;