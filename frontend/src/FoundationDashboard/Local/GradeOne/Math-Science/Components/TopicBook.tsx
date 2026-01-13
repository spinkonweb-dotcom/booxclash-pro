// src/components/TopicBook.tsx

import React from 'react';
import { BookCheck, Book } from 'lucide-react';

interface TopicBookProps {
  topic: string;
  isCompleted: boolean;
  isCurrent: boolean;
  onClick: () => void; // Added onClick
}

const TopicBook = React.forwardRef<HTMLDivElement, TopicBookProps>(
  ({ topic, isCompleted, isCurrent, onClick }, ref) => {
    const baseClasses = "flex flex-col items-center justify-center w-28 h-32 rounded-lg border-4 shadow-lg mx-2 text-white font-bold text-center p-2 transition-all duration-300";
    let stateClasses;
    
    if (isCompleted) {
      stateClasses = "bg-yellow-500 border-yellow-700 cursor-default";
    } else if (isCurrent) {
      stateClasses = "bg-purple-500 border-purple-700 scale-110 hover:scale-[1.15] cursor-pointer";
    } else {
      stateClasses = "bg-gray-400 border-gray-500 cursor-not-allowed";
    }
      
    return (
      <div 
        ref={ref}
        onClick={onClick}
        className={`${baseClasses} ${stateClasses}`}
      >
        {isCompleted ? <BookCheck size={32}/> : <Book size={32}/>}
        <span className="mt-1 text-sm">{topic}</span>
      </div>
    );
  }
);

export default TopicBook;