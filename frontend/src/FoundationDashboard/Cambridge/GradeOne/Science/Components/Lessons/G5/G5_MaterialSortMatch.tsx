import React, { useState, useEffect, useRef, useCallback } from "react";
import { CheckCircle } from "lucide-react";
import confetti from "canvas-confetti";

interface LessonProps {
  onComplete: () => void;
}

// --- DATA STRUCTURES ---

type MaterialType = 'wood' | 'metal' | 'glass' | 'plastic';

type SortItem = {
  id: number;
  name: string;
  emoji: string;
  material: MaterialType;
};

type Bin = {
  type: MaterialType;
  label: string;
  emoji: string;
  bgColor: string;
  borderColor: string;
};

// --- GAME DATA ---

const BINS: Bin[] = [
  { type: 'wood', label: 'Wood', emoji: '🪵', bgColor: 'bg-yellow-800', borderColor: 'border-yellow-700' },
  { type: 'metal', label: 'Metal', emoji: '⚙️', bgColor: 'bg-slate-500', borderColor: 'border-slate-400' },
  { type: 'glass', label: 'Glass', emoji: '🥛', bgColor: 'bg-sky-400', borderColor: 'border-sky-300' },
  { type: 'plastic', label: 'Plastic', emoji: '♻️', bgColor: 'bg-green-600', borderColor: 'border-green-500' },
];

const ALL_ITEMS: SortItem[] = [
  // Wood
  { id: 1, name: 'Spoon', emoji: '🥄', material: 'wood' },
  { id: 2, name: 'Chair', emoji: '🪑', material: 'wood' },
  { id: 3, name: 'Log', emoji: '🪵', material: 'wood' },
  { id: 4, name: 'Box', emoji: '📦', material: 'wood' },
  // Metal
  { id: 5, name: 'Key', emoji: '🔑', material: 'metal' },
  { id: 6, name: 'Wrench', emoji: '🔧', material: 'metal' },
  { id: 7, name: 'Can', emoji: '🥫', material: 'metal' },
  { id: 8, name: 'Pan', emoji: '🍳', material: 'metal' },
  // Glass
  { id: 9, name: 'Goblet', emoji: '🍷', material: 'glass' },
  { id: 10, name: 'Jar', emoji: '🫙', material: 'glass' },
  { id: 11, name: 'Spectacles', emoji: '👓', material: 'glass' },
  { id: 12, name: 'Bottle', emoji: '🍾', material: 'glass' },
  // Plastic
  { id: 13, name: 'Water Bottle', emoji: '🚰', material: 'plastic' },
  { id: 14, name: 'Shopping Bag', emoji: '🛍️', material: 'plastic' },
  { id: 15, name: 'Toy Duck', emoji: '🦆', material: 'plastic' },
  { id: 16, name: 'Bucket', emoji: '🪣', material: 'plastic' },
];

const TOTAL_ITEMS = 8; // Let's sort 8 items

// Helper to shuffle an array
const shuffleArray = <T,>(array: T[]): T[] => {
  return [...array].sort(() => Math.random() - 0.5);
};

// --- COMPONENT ---

const MaterialSortGame: React.FC<LessonProps> = ({ onComplete }) => {
  // --- STATE ---
  const [itemsToSort, setItemsToSort] = useState<SortItem[]>([]);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [currentItem, setCurrentItem] = useState<SortItem | null>(null);
  
  const [isGameComplete, setIsGameComplete] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'correct' | 'wrong', bin: MaterialType } | null>(null);
  const [score, setScore] = useState(0);

  // --- SOUNDS ---
  const createMockAudio = () => ({
    play: () => { /* console.log("Audio play mock") */ },
    pause: () => { /* console.log("Audio pause mock") */ },
    currentTime: 0,
  });

  const correctSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/correct.mp3") : createMockAudio());
  const wrongSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/incorrect.mp3") : createMockAudio());
  const clapSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/clap.mp3") : createMockAudio());

  // --- GAME SETUP ---
  const generateGameItems = useCallback(() => {
    const items = shuffleArray(ALL_ITEMS).slice(0, TOTAL_ITEMS);
    setItemsToSort(items);
    setCurrentItemIndex(0);
    setScore(0);
    setIsGameComplete(false); // Reset game completeness
  }, []);

  useEffect(() => {
    generateGameItems();
  }, [generateGameItems]);

  // Load current item
  useEffect(() => {
    if (itemsToSort.length > 0 && currentItemIndex < itemsToSort.length) {
      setFeedback(null);
      // Add a small delay to feel like a new item is "arriving"
      setTimeout(() => {
        setCurrentItem(itemsToSort[currentItemIndex]);
      }, 300); // Wait for feedback animation to finish
    }
  }, [itemsToSort, currentItemIndex]);

  // --- GAME LOGIC ---
  const handleNextItem = () => {
    if (currentItemIndex < TOTAL_ITEMS - 1) {
      setCurrentItemIndex(prev => prev + 1);
    } else {
      setIsGameComplete(true);
      clapSound.current.play();
      confetti({ particleCount: 200, spread: 80, origin: { y: 0.6 } });
    }
  };

  const handleBinClick = (binType: MaterialType) => {
    if (feedback || !currentItem) return; // Don't allow click if feedback is being shown or no item

    if (currentItem.material === binType) {
      // --- CORRECT ---
      correctSound.current.play();
      setFeedback({ type: 'correct', bin: binType });
      setScore(prev => prev + 1);
      setCurrentItem(null); // Hide item immediately
      setTimeout(handleNextItem, 1000); // Wait for feedback to show, then next
    } else {
      // --- WRONG ---
      wrongSound.current.play();
      setFeedback({ type: 'wrong', bin: binType });
      setTimeout(() => {
        setFeedback(null); // Reset feedback after a delay
      }, 1000);
    }
  };

  // --- RENDER ---
  if (isGameComplete) {
    return (
      <div className="p-6 text-center flex flex-col items-center justify-center h-full text-white">
        <CheckCircle size={80} className="text-green-400 mb-4" />
        <h2 className="text-3xl font-bold">Great Sorting!</h2>
        <p className="text-lg mb-6">You sorted {score} out of {TOTAL_ITEMS} items correctly!</p>
        <button
          onClick={onComplete}
          className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Finish Lesson
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 flex flex-col h-full text-white overflow-hidden">
      <h3 className="text-2xl font-bold text-center mb-2">Factory Sort</h3>
      
      {/* Progress Bar */}
      <div className="w-full bg-gray-700 rounded-full h-4 mb-2">
        <div
          className="bg-blue-500 h-4 rounded-full transition-all duration-300"
          style={{ width: `${((currentItemIndex) / TOTAL_ITEMS) * 100}%` }} // Show progress based on items *completed*
        ></div>
      </div>
      <p className="text-center text-sm text-gray-300 mb-4">
        Item {currentItemIndex + 1} of {TOTAL_ITEMS} (Score: {score})
      </p>

      {/* "Conveyor Belt" Area */}
      <div className="relative h-48 bg-gray-800 rounded-lg flex justify-center items-center mb-4 overflow-hidden border-2 border-gray-600">
        <div className="absolute top-0 left-0 w-full h-full opacity-20">
          {/* Conveyor belt lines */}
          <div className="absolute bg-gray-500 h-full w-2 top-0 animate-conveyor-slow"></div>
          <div className="absolute bg-gray-500 h-full w-2 top-0 left-1/4 animate-conveyor-slow" style={{animationDelay: '0.5s'}}></div>
          <div className="absolute bg-gray-500 h-full w-2 top-0 left-2/4 animate-conveyor-slow" style={{animationDelay: '1s'}}></div>
          <div className="absolute bg-gray-500 h-full w-2 top-0 left-3/4 animate-conveyor-slow" style={{animationDelay: '1.5s'}}></div>
        </div>
        
        {currentItem ? (
          <div
            className="flex flex-col items-center justify-center p-4 bg-white/10 rounded-lg shadow-lg animate-item-appear"
          >
            <span className="text-7xl">{currentItem.emoji}</span>
            <span className="text-lg font-bold">{currentItem.name}</span>
          </div>
        ) : (
          !isGameComplete && (
            <div className="text-gray-400">Loading next item...</div>
          )
        )}
      </div>

      {/* Sorting Bins */}
      <div className="grid grid-cols-2 gap-3">
        {BINS.map((bin) => {
          const isCorrectBin = feedback?.type === 'correct' && feedback.bin === bin.type;
          const isWrongBin = feedback?.type === 'wrong' && feedback.bin === bin.type;
          const isFaded = feedback && feedback.bin !== bin.type && feedback.type !== 'correct';

          return (
            <button
              key={bin.type}
              onClick={() => handleBinClick(bin.type)}
              disabled={!!feedback}
              className={`flex flex-col items-center justify-center p-4 rounded-lg border-4 transition-all duration-200
                ${bin.bgColor} ${bin.borderColor}
                ${isCorrectBin ? 'scale-105 ring-4 ring-green-400' : ''}
                ${isWrongBin ? 'animate-shake' : ''}
                ${isFaded ? 'opacity-30' : ''}
                ${!feedback ? 'hover:scale-105' : ''}
                disabled:cursor-not-allowed
              `}
            >
              <span className="text-5xl">{bin.emoji}</span>
              <span className="text-2xl font-bold">{bin.label}</span>
            </button>
          );
        })}
      </div>

      {/* Animations */}
      <style>
        {`
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
          }
          .animate-shake { animation: shake 0.3s ease-in-out; }
          
          @keyframes item-appear {
            from { transform: translateX(-50px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
          .animate-item-appear { animation: item-appear 0.3s ease-out; }
          
          @keyframes conveyor-slow {
             from { transform: translateX(-100%); }
             to { transform: translateX(500%); }
          }
          .animate-conveyor-slow { animation: conveyor-slow 10s linear infinite; }
        `}
      </style>
    </div>
  );
};

export default MaterialSortGame;