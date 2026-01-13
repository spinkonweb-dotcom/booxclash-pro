import React, { useState, useEffect, useRef, useCallback } from "react";
import { CheckCircle } from "lucide-react";
import confetti from "canvas-confetti";

interface LessonProps {
  onComplete: () => void;
}

// --- DATA STRUCTURES ---

type SenseType = 'sight' | 'sound' | 'smell' | 'taste' | 'touch';

type SenseItem = {
  id: string;
  emoji: string;
  name: string;
  correctSense: SenseType;
};

type SenseIcon = {
  type: SenseType;
  emoji: string;
  label: string;
};

// --- GAME DATA ---
const SENSE_ICONS: SenseIcon[] = [
  { type: 'sight', emoji: '👁️', label: 'Sight' },
  { type: 'sound', emoji: '👂', label: 'Sound' },
  { type: 'smell', emoji: '👃', label: 'Smell' },
  { type: 'taste', emoji: '👄', label: 'Taste' },
  { type: 'touch', emoji: '👐', label: 'Touch' },
];

const ALL_ITEMS: SenseItem[] = [
  { id: "bell", emoji: "🔔", name: "Bell", correctSense: "sound" },
  { id: "flower", emoji: "🌸", name: "Flower", correctSense: "smell" },
  { id: "iceCream", emoji: "🍦", name: "Ice Cream", correctSense: "taste" },
  { id: "rainbow", emoji: "🌈", name: "Rainbow", correctSense: "sight" },
  { id: "cactus", emoji: "🌵", name: "Cactus", correctSense: "touch" },
  { id: "music", emoji: "🎵", name: "Music", correctSense: "sound" },
  { id: "pizza", emoji: "🍕", name: "Pizza", correctSense: "taste" },
  { id: "book", emoji: "📖", name: "Book", correctSense: "sight" },
  { id: "soap", emoji: "🧼", name: "Soap", correctSense: "smell" },
  { id: "teddy", emoji: "🧸", name: "Teddy Bear", correctSense: "touch" },
];

const TOTAL_ROUNDS = 8;

// Helper to shuffle an array
const shuffleArray = <T,>(array: T[]): T[] => {
  return [...array].sort(() => Math.random() - 0.5);
};

// --- COMPONENT ---

const SenseMatchGame: React.FC<LessonProps> = ({ onComplete }) => {
  // --- STATE ---
  const [gameItems, setGameItems] = useState<SenseItem[]>([]);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [currentItem, setCurrentItem] = useState<SenseItem | null>(null);
  const [isGameComplete, setIsGameComplete] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

  // Drag state
  const [draggingSense, setDraggingSense] = useState<SenseType | null>(null);
  const [dragOverItem, setDragOverItem] = useState(false);

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
  const generateGameRounds = useCallback(() => {
    const rounds = shuffleArray(ALL_ITEMS).slice(0, TOTAL_ROUNDS);
    setGameItems(rounds);
    setCurrentItemIndex(0);
  }, []);

  useEffect(() => {
    generateGameRounds();
  }, [generateGameRounds]);

  // Load current item
  useEffect(() => {
    if (gameItems.length > 0 && currentItemIndex < gameItems.length) {
      setCurrentItem(gameItems[currentItemIndex]);
      setFeedback(null);
    }
  }, [gameItems, currentItemIndex]);

  // --- GAME LOGIC ---
  const handleNextItem = () => {
    if (currentItemIndex < TOTAL_ROUNDS - 1) {
      setCurrentItemIndex(prev => prev + 1);
    } else {
      setIsGameComplete(true);
      clapSound.current.play();
      confetti({ particleCount: 200, spread: 80, origin: { y: 0.6 } });
    }
  };

  const processDrop = (droppedSense: SenseType) => {
    if (feedback || !currentItem) return; // Prevent multiple quick answers

    if (droppedSense === currentItem.correctSense) {
      correctSound.current.play();
      setFeedback('correct');
      setTimeout(handleNextItem, 1200);
    } else {
      wrongSound.current.play();
      setFeedback('wrong');
      setTimeout(() => setFeedback(null), 800);
    }
  };

  // --- DRAG & DROP HANDLERS ---
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, senseType: SenseType) => {
    e.dataTransfer.setData("senseType", senseType);
    setDraggingSense(senseType);
  };

  const handleDragEnd = () => {
    setDraggingSense(null);
    setDragOverItem(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOverItem(true);
  };

  const handleDragLeave = () => {
    setDragOverItem(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOverItem(false);
    const droppedSense = e.dataTransfer.getData("senseType") as SenseType;
    if (droppedSense) {
      processDrop(droppedSense);
    }
    setDraggingSense(null);
  };

  // --- TOUCH HANDLERS ---
  const handleTouchStart = (_e: React.TouchEvent<HTMLDivElement>, senseType: SenseType) => {
    setDraggingSense(senseType);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement | null;
    const itemZone = element?.closest("[data-item-dropzone]");
    setDragOverItem(!!itemZone);
  };

  const handleTouchEnd = (_e: React.TouchEvent<HTMLDivElement>) => {
    if (dragOverItem && draggingSense) {
      processDrop(draggingSense);
    }
    setDraggingSense(null);
    setDragOverItem(false);
  };

  // --- RENDER ---
  if (isGameComplete) {
    return (
      <div className="p-6 text-center flex flex-col items-center justify-center h-full text-white">
        <CheckCircle size={80} className="text-green-400 mb-4" />
        <h2 className="text-3xl font-bold">Super Senses!</h2>
        <p className="text-lg mb-6">You matched all the senses!</p>
        <button
          onClick={onComplete}
          className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Finish Lesson
        </button>
      </div>
    );
  }

  if (!currentItem) {
    return <div className="p-6 text-center text-white">Loading...</div>;
  }

  return (
    <div className="p-4 flex flex-col h-full text-white overflow-hidden">
      <h3 className="text-2xl font-bold text-center mb-4">How do you know it's there?</h3>
      
      {/* Item Area (Drop Zone) */}
      <div 
        className="flex-grow flex flex-col items-center justify-center p-4"
      >
        <div
          data-item-dropzone="true"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative flex flex-col items-center justify-center w-full max-w-xs h-64 bg-white/10 rounded-xl transition-all duration-200 border-4 border-dashed
            ${dragOverItem ? 'border-cyan-400 scale-105 shadow-lg' : 'border-white/20'}
            ${feedback === 'correct' ? 'border-green-500 bg-green-900' : ''}
            ${feedback === 'wrong' ? 'border-red-500 bg-red-900 animate-shake' : ''}
          `}
        >
          <div className="text-8xl">{currentItem.emoji}</div>
          <div className="text-2xl font-semibold mt-2">{currentItem.name}</div>

          {/* Correct Feedback Icon */}
          {feedback === 'correct' && (
            <div className="absolute text-8xl text-white opacity-80">
              {SENSE_ICONS.find(icon => icon.type === currentItem.correctSense)?.emoji}
            </div>
          )}
        </div>
      </div>

      {/* Sense Icons Area (Drag Items) */}
      <div className="w-full bg-stone-700 rounded-lg p-4 flex justify-center items-center gap-2 md:gap-4 flex-wrap">
        {SENSE_ICONS.map((icon) => (
          <div
            key={icon.type}
            draggable
            style={{ touchAction: "none" }}
            onDragStart={(e) => handleDragStart(e, icon.type)}
            onDragEnd={handleDragEnd}
            onTouchStart={(e) => handleTouchStart(e, icon.type)}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className={`w-16 h-16 md:w-20 md:h-20 bg-indigo-600 rounded-lg flex flex-col items-center justify-center text-3xl md:text-4xl shadow-lg cursor-grab
              transition-all duration-200
              ${draggingSense === icon.type ? 'opacity-30 scale-110' : 'opacity-100 hover:bg-indigo-500'}
            `}
          >
            {icon.emoji}
            <span className="text-xs font-medium">{icon.label}</span>
          </div>
        ))}
      </div>
      
      {/* Custom styles for shake animation */}
      <style>
        {`
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
          }
          .animate-shake {
            animation: shake 0.3s ease-in-out;
          }
        `}
      </style>
    </div>
  );
};

export default SenseMatchGame;
