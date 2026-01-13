import React, { useState, useEffect, useRef } from "react";
import { CheckCircle, RotateCcw } from "lucide-react";
import confetti from "canvas-confetti";

interface LessonProps {
  onComplete: () => void;
}

// --- DATA STRUCTURES ---

type GameRound = {
  id: string;
  name: string;
  visual: string; // Tailwind class for width
  correctLength: number;
};

// --- GAME DATA ---
const ALL_ROUNDS: GameRound[] = [
  { id: "book", name: "Book", visual: "w-48", correctLength: 2 },
  { id: "desk", name: "Desk", visual: "w-96", correctLength: 4 },
  { id: "pencil", name: "Pencil", visual: "w-24", correctLength: 1 },
  { id: "whiteboard", name: "Whiteboard", visual: "w-[30rem]", correctLength: 6 },
  { id: "plant", name: "Plant", visual: "w-48", correctLength: 2 },
  { id: "chair", name: "Chair", visual: "w-72", correctLength: 3 },
];

// Helper to shuffle an array
const shuffleArray = <T,>(array: T[]): T[] => {
  return [...array].sort(() => Math.random() - 0.5);
};

// --- COMPONENT ---

const MeasureWithMyBodyGame: React.FC<LessonProps> = ({ onComplete }) => {
  // --- STATE ---
  const [gameRounds, setGameRounds] = useState<GameRound[]>([]);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [currentRound, setCurrentRound] = useState<GameRound | null>(null);

  // Measurement zone state
  const [handsInZone, setHandsInZone] = useState(0);
  
  const [isGameComplete, setIsGameComplete] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

  // Drag state
  const [isDragging, setIsDragging] = useState(false);
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
  const popSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/pop.mp3") : createMockAudio()); // A softer sound for adding items

  // --- GAME SETUP ---
  useEffect(() => {
    setGameRounds(shuffleArray(ALL_ROUNDS));
    setCurrentRoundIndex(0);
  }, []);

  // Load current round
  useEffect(() => {
    if (gameRounds.length > 0 && currentRoundIndex < gameRounds.length) {
      setCurrentRound(gameRounds[currentRoundIndex]);
      setHandsInZone(0);
      setFeedback(null);
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

  const handleCheckAnswer = () => {
    if (feedback || !currentRound) return; // Don't check if already showing feedback

    if (handsInZone === currentRound.correctLength) {
      correctSound.current.play();
      setFeedback('correct');
      setTimeout(handleNextRound, 1500);
    } else {
      wrongSound.current.play();
      setFeedback('wrong');
      setTimeout(() => setFeedback(null), 1000);
    }
  };

  const handleClear = () => {
    setHandsInZone(0);
    setFeedback(null);
  };

  // --- DRAG & DROP HANDLERS ---
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData("itemType", "hand");
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
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
    setFeedback(null); // Clear feedback on new drop
    const itemType = e.dataTransfer.getData("itemType");
    
    if (itemType === 'hand') {
      setHandsInZone(prev => prev + 1);
      popSound.current.play();
    }
    setIsDragging(false);
  };

  // --- TOUCH HANDLERS ---
  const handleTouchStart = (_e: React.TouchEvent<HTMLDivElement>) => {
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement | null;
    const dropZone = element?.closest("[data-dropzone]");
    setDragOverZone(!!dropZone);
  };

  const handleTouchEnd = (_e: React.TouchEvent<HTMLDivElement>) => {
    if (dragOverZone) {
      setFeedback(null);
      setHandsInZone(prev => prev + 1);
      popSound.current.play();
    }
    setIsDragging(false);
    setDragOverZone(false);
  };

  // --- RENDER ---
  if (isGameComplete) {
    return (
      <div className="p-6 text-center flex flex-col items-center justify-center h-full text-white">
        <CheckCircle size={80} className="text-green-400 mb-4" />
        <h2 className="text-3xl font-bold">Great Measuring!</h2>
        <p className="text-lg mb-6">You're a master measurer!</p>
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
      <h3 className="text-2xl font-bold text-center mb-2">How many "hands" long?</h3>
      <p className="text-lg text-center text-cyan-300 mb-4">
        Measure the {currentRound.name}!
      </p>

      {/* Object to Measure */}
      <div className="flex flex-col items-center justify-center mb-4">
        <div className={`h-16 bg-amber-600 rounded-lg ${currentRound.visual} border-4 border-amber-400`} />
        <p className="mt-2 text-xl font-semibold">{currentRound.name}</p>
      </div>

      {/* Measurement Zone (Drop Target) */}
      <div
        data-dropzone="true"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative flex-grow bg-white/10 rounded-xl p-4 flex items-center gap-1 min-h-[100px]
          transition-all duration-200 border-4 border-dashed
          ${dragOverZone ? 'border-cyan-400 scale-105' : 'border-white/20'}
          ${feedback === 'correct' ? 'border-green-500' : ''}
          ${feedback === 'wrong' ? 'border-red-500 animate-shake' : ''}
        `}
      >
        {/* Placed Hands */}
        {Array.from({ length: handsInZone }, (_, i) => (
          <span key={i} className="text-5xl">✋</span>
        ))}
        
        {/* Total Display */}
        <div className="absolute top-2 right-3 bg-black/50 text-white px-3 py-1 rounded-lg text-xl font-bold">
          {handsInZone}
        </div>
      </div>

      {/* Hand Bank (Draggable Item) */}
      <div className="w-full h-32 bg-stone-700 rounded-lg p-4 flex justify-center items-center gap-6 mt-4">
        <div className="flex flex-col items-center">
          <div
            draggable
            style={{ touchAction: "none" }}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className={`text-6xl cursor-grab p-2
              ${isDragging ? 'opacity-30 scale-125' : ''} transition-all`}
          >
            ✋
          </div>
          <span className="mt-1 font-semibold">Drag a Hand</span>
        </div>
      </div>
      
      {/* Control Buttons */}
      <div className="grid grid-cols-2 gap-4 mt-4">
        <button
          onClick={handleClear}
          className="flex items-center justify-center gap-2 bg-gray-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-gray-600 transition-colors"
        >
          <RotateCcw size={20} /> Clear
        </button>
        <button
          onClick={handleCheckAnswer}
          disabled={feedback === 'correct'}
          className="bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-500"
        >
          Check Answer
        </button>
      </div>

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

export default MeasureWithMyBodyGame;
