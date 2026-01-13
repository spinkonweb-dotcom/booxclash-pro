import React, { useState, useEffect, useRef } from "react";
import { CheckCircle } from "lucide-react";
import confetti from "canvas-confetti";

interface LessonProps {
  onComplete: () => void;
}

// --- DATA STRUCTURES ---

type GameRound = {
  id: string;
  name: string;
  emoji: string;
  length: number; // In "units"
  widthClass: string; // Tailwind class for visual width (length * unit_width)
};

// --- GAME DATA ---
const UNIT_WIDTH_PX = 80; // Each "unit" on the ruler is 80px
const MAX_LENGTH = 6; // Max length of an object (ruler will be slightly longer)

const ALL_ROUNDS: GameRound[] = [
  { id: "carrot", name: "Carrot", emoji: "🥕", length: 3, widthClass: "w-[240px]" }, // 3 * 80
  { id: "key", name: "Key", emoji: "🔑", length: 2, widthClass: "w-[160px]" },     // 2 * 80
  { id: "pencil", name: "Pencil", emoji: "✏️", length: 4, widthClass: "w-[320px]" }, // 4 * 80
  { id: "worm", name: "Worm", emoji: "🪱", length: 5, widthClass: "w-[400px]" },   // 5 * 80
  { id: "phone", name: "Phone", emoji: "📱", length: 3, widthClass: "w-[240px]" },
  { id: "book", name: "Book", emoji: "📖", length: 4, widthClass: "w-[320px]" },
];

// Helper to shuffle an array
const shuffleArray = <T,>(array: T[]): T[] => {
  return [...array].sort(() => Math.random() - 0.5);
};

// --- HELPER COMPONENT: Ruler ---
const Ruler: React.FC<{ 
  onNumberClick: (num: number) => void;
  isDisabled: boolean;
  wrongSelection: number | null;
  correctSelection: number | null;
}> = ({ onNumberClick, isDisabled, wrongSelection, correctSelection }) => {
  
  return (
    <div 
      className="relative flex items-center h-16 bg-yellow-200 rounded-lg border-2 border-yellow-400 shadow-md"
      style={{ width: `${(MAX_LENGTH + 1) * UNIT_WIDTH_PX}px` }}
    >
      {/* "0" mark */}
      <div className="absolute left-0 top-0 bottom-0 flex flex-col items-center w-8">
        <div className="w-px h-full bg-yellow-700/70" />
        <span className="absolute -bottom-6 text-sm font-bold text-yellow-100">0</span>
      </div>

      {/* Numbered Marks */}
      {Array.from({ length: MAX_LENGTH }, (_, i) => {
        const number = i + 1;
        const isWrong = wrongSelection === number;
        const isCorrect = correctSelection === number;

        return (
          <button
            key={number}
            disabled={isDisabled}
            onClick={() => onNumberClick(number)}
            className={`absolute top-0 bottom-0 flex flex-col items-center transition-all
              ${isWrong ? 'animate-shake' : ''}
              ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer hover:scale-110'}
            `}
            style={{ left: `${number * UNIT_WIDTH_PX - 16}px`, width: '32px' }}
          >
            {/* Tick Mark */}
            <div className={`w-px h-1/2 ${isCorrect ? 'bg-green-600' : isWrong ? 'bg-red-600' : 'bg-yellow-700/70'}`} />
            {/* Number Button */}
            <span 
              className={`absolute -bottom-7 text-lg font-bold
                ${isCorrect ? 'text-green-400' : isWrong ? 'text-red-400' : 'text-yellow-100'}
              `}
            >
              {number}
            </span>
          </button>
        );
      })}
    </div>
  );
};

// --- MAIN COMPONENT ---

const RulerToolGame: React.FC<LessonProps> = ({ onComplete }) => {
  // --- STATE ---
  const [gameRounds, setGameRounds] = useState<GameRound[]>([]);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [currentRound, setCurrentRound] = useState<GameRound | null>(null);
  
  const [isRulerInPlace, setIsRulerInPlace] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [wrongSelection, setWrongSelection] = useState<number | null>(null);
  const [isGameComplete, setIsGameComplete] = useState(false);

  // Drag state
  const [isRulerDragging, setIsRulerDragging] = useState(false);
  const [dragOverZone, setDragOverZone] = useState(false);

  // --- SOUNDS ---
  const createMockAudio = () => ({
    play: () => { /* console.log("Audio play mock") */ },
    pause: () => { /* console.log("Audio pause mock") */ },
    currentTime: 0,
  });

  const correctSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/correct.mp3") : createMockAudio());
  const wrongSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/incorrect.mp3") : createMockAudio());
  const clapSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/clap.mp3") : createMockAudio());
  const popSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/pop.mp3") : createMockAudio()); // Snap sound

  // --- GAME SETUP ---
  useEffect(() => {
    setGameRounds(shuffleArray(ALL_ROUNDS));
    setCurrentRoundIndex(0);
  }, []);

  // Load current round
  useEffect(() => {
    if (gameRounds.length > 0 && currentRoundIndex < gameRounds.length) {
      setCurrentRound(gameRounds[currentRoundIndex]);
      setIsRulerInPlace(false);
      setFeedback(null);
      setWrongSelection(null);
    }
  }, [gameRounds, currentRoundIndex]);

  // --- GAME LOGIC ---
  const handleNextRound = () => {
    if (currentRoundIndex < gameRounds.length - 1) {
      setCurrentRoundIndex(prev => prev + 1);
    } else {
      setIsGameComplete(true);
      clapSound.current.play();
      confetti({ particleCount: 200, spread: 80, origin: { y: 0.6 } });
    }
  };

  const handleNumberClick = (tappedNumber: number) => {
    if (feedback || !currentRound) return;

    if (tappedNumber === currentRound.length) {
      correctSound.current.play();
      setFeedback('correct');
      setTimeout(handleNextRound, 1200);
    } else {
      wrongSound.current.play();
      setFeedback('wrong');
      setWrongSelection(tappedNumber);
      setTimeout(() => {
        setFeedback(null);
        setWrongSelection(null);
      }, 1000);
    }
  };

  // --- DRAG & DROP HANDLERS ---
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData("itemType", "ruler");
    setIsRulerDragging(true);
  };
  const handleDragEnd = () => {
    setIsRulerDragging(false);
    setDragOverZone(false);
  };
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOverZone(true);
  };
  const handleDragLeave = () => {
    setDragOverZone(false);
  };
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOverZone(false);
    const itemType = e.dataTransfer.getData("itemType");
    if (itemType === 'ruler') {
      setIsRulerInPlace(true);
      popSound.current.play();
    }
    setIsRulerDragging(false);
  };
  
  // --- TOUCH HANDLERS ---
  const handleTouchStart = () => setIsRulerDragging(true);
  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement | null;
    setDragOverZone(!!element?.closest("[data-dropzone]"));
  };
  const handleTouchEnd = () => {
    if (dragOverZone) {
      setIsRulerInPlace(true);
      popSound.current.play();
    }
    setIsRulerDragging(false);
    setDragOverZone(false);
  };

  // --- RENDER ---
  if (isGameComplete) {
    return (
      <div className="p-6 text-center flex flex-col items-center justify-center h-full text-white">
        <CheckCircle size={80} className="text-green-400 mb-4" />
        <h2 className="text-3xl font-bold">Great Measuring!</h2>
        <p className="text-lg mb-6">You're a master with the ruler!</p>
        <button
          onClick={onComplete}
          className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Finish Lesson
        </button>
      </div>
    );
  }

  if (!currentRound) {
    return <div className="p-6 text-center text-white">Loading...</div>;
  }

  return (
    <div className="p-4 flex flex-col h-full text-white overflow-hidden">
      <h3 className="text-2xl font-bold text-center mb-4">Drag the ruler to measure the {currentRound.name}!</h3>

      {/* Measurement Area */}
      <div className="flex-grow flex flex-col justify-center items-start p-4">
        {/* The Object */}
        <div className={`relative h-20 bg-white/10 rounded-lg p-4 flex items-center ${currentRound.widthClass}`}>
          <span className="text-6xl">{currentRound.emoji}</span>
          <span className="absolute -top-8 left-0 text-lg font-semibold">{currentRound.name}</span>
        </div>

        {/* Ruler Drop Zone */}
        <div
          data-dropzone="true"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative mt-12 w-full min-h-[100px]
            ${isRulerInPlace ? '' : 'border-4 border-dashed rounded-lg border-white/30'}
            ${dragOverZone ? 'bg-white/10' : ''}
          `}
        >
          {isRulerInPlace ? (
            <Ruler
              onNumberClick={handleNumberClick}
              isDisabled={feedback === 'correct'}
              wrongSelection={wrongSelection}
              correctSelection={feedback === 'correct' ? currentRound.length : null}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-lg text-white/70">Place ruler here</p>
            </div>
          )}
        </div>
      </div>

      {/* Draggable Ruler Source */}
      {!isRulerInPlace && (
        <div className="w-full h-32 bg-stone-700 rounded-lg p-4 flex justify-center items-center mt-4">
          <div
            draggable
            style={{ touchAction: "none" }}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className={`cursor-grab ${isRulerDragging ? 'opacity-30 scale-105' : ''}`}
          >
            <Ruler onNumberClick={() => {}} isDisabled={true} wrongSelection={null} correctSelection={null} />
          </div>
        </div>
      )}

      {/* Shake Animation */}
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

export default RulerToolGame;
