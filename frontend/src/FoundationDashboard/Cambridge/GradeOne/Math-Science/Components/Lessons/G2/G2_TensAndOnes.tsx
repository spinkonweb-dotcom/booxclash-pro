import React, { useState, useEffect, useRef } from "react";
import { CheckCircle, RotateCcw } from "lucide-react";
import confetti from "canvas-confetti";

interface LessonProps {
  onComplete: () => void;
}

// --- DATA STRUCTURES ---
type ItemType = 'ten' | 'one';

type GameRound = {
  targetNumber: number;
  tens: number;
  ones: number;
};

// --- GAME DATA ---
const ALL_ROUNDS: GameRound[] = [
  { targetNumber: 14, tens: 1, ones: 4 },
  { targetNumber: 27, tens: 2, ones: 7 },
  { targetNumber: 32, tens: 3, ones: 2 },
  { targetNumber: 9, tens: 0, ones: 9 },
  { targetNumber: 40, tens: 4, ones: 0 },
  { targetNumber: 53, tens: 5, ones: 3 },
  { targetNumber: 28, tens: 2, ones: 8 },
  { targetNumber: 16, tens: 1, ones: 6 },
];

// Helper to shuffle an array
const shuffleArray = <T,>(array: T[]): T[] => {
  return [...array].sort(() => Math.random() - 0.5);
};

// --- COMPONENT ---

const BuildTheNumberGame: React.FC<LessonProps> = ({ onComplete }) => {
  // --- STATE ---
  const [gameRounds, setGameRounds] = useState<GameRound[]>([]);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [currentRound, setCurrentRound] = useState<GameRound | null>(null);

  // Build zone state
  const [tensInZone, setTensInZone] = useState(0);
  const [onesInZone, setOnesInZone] = useState(0);
  
  const [isGameComplete, setIsGameComplete] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

  // Drag state
  const [draggingItem, setDraggingItem] = useState<ItemType | null>(null);
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
      setTensInZone(0);
      setOnesInZone(0);
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

    const { tens: correctTens, ones: correctOnes } = currentRound;
    
    if (tensInZone === correctTens && onesInZone === correctOnes) {
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
    setTensInZone(0);
    setOnesInZone(0);
    setFeedback(null);
  };

  // --- DRAG & DROP HANDLERS ---
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, itemType: ItemType) => {
    e.dataTransfer.setData("itemType", itemType);
    setDraggingItem(itemType);
  };

  const handleDragEnd = () => {
    setDraggingItem(null);
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
    const itemType = e.dataTransfer.getData("itemType") as ItemType;
    
    if (itemType === 'ten') {
      setTensInZone(prev => prev + 1);
      popSound.current.play();
    } else if (itemType === 'one') {
      setOnesInZone(prev => prev + 1);
      popSound.current.play();
    }
    setDraggingItem(null);
  };

  // --- TOUCH HANDLERS ---
  const handleTouchStart = (_e: React.TouchEvent<HTMLDivElement>, itemType: ItemType) => {
    setDraggingItem(itemType);
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
      if (draggingItem === 'ten') {
        setTensInZone(prev => prev + 1);
        popSound.current.play();
      } else if (draggingItem === 'one') {
        setOnesInZone(prev => prev + 1);
        popSound.current.play();
      }
    }
    setDraggingItem(null);
    setDragOverZone(false);
  };

  // --- RENDER ---
  if (isGameComplete) {
    return (
      <div className="p-6 text-center flex flex-col items-center justify-center h-full text-white">
        <CheckCircle size={80} className="text-green-400 mb-4" />
        <h2 className="text-3xl font-bold">Great Job!</h2>
        <p className="text-lg mb-6">You're a master builder!</p>
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
  
  const currentTotal = tensInZone * 10 + onesInZone;

  // Helper to render items in the build zone
  const renderItems = (tens: number, ones: number) => {
    return (
      <>
        {Array.from({ length: tens }, (_, i) => (
          <div key={`t-${i}`} className="w-6 h-24 bg-blue-500 border-2 border-blue-300 rounded m-1" />
        ))}
        {Array.from({ length: ones }, (_, i) => (
          <div key={`o-${i}`} className="w-6 h-6 bg-yellow-400 border-2 border-yellow-300 rounded m-1" />
        ))}
      </>
    );
  };

  return (
    <div className="p-4 flex flex-col h-full text-white">
      <h3 className="text-2xl font-bold text-center mb-2">Build the Number!</h3>
      <p className="text-3xl font-bold text-center text-yellow-300 mb-4">
        Build this number: {currentRound.targetNumber}
      </p>

      {/* Build Zone (Drop Target) */}
      <div
        data-dropzone="true"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative flex-grow bg-white/10 rounded-xl p-4 flex flex-wrap content-start gap-1 min-h-[200px]
          transition-all duration-200 border-4 border-dashed
          ${dragOverZone ? 'border-cyan-400 scale-105' : 'border-white/20'}
          ${feedback === 'correct' ? 'border-green-500' : ''}
          ${feedback === 'wrong' ? 'border-red-500 animate-shake' : ''}
        `}
      >
        {renderItems(tensInZone, onesInZone)}
        
        {/* Total Display */}
        <div className="absolute bottom-2 right-3 bg-black/50 text-white px-3 py-1 rounded-lg text-xl font-bold">
          Total: {currentTotal}
        </div>
      </div>

      {/* Item Bank (Draggable Items) */}
      <div className="w-full h-40 bg-stone-700 rounded-lg p-4 flex justify-center items-center gap-6 mt-4">
        {/* Ten Rod Source */}
        <div className="flex flex-col items-center">
          <div
            draggable
            style={{ touchAction: "none" }}
            onDragStart={(e) => handleDragStart(e, 'ten')}
            onDragEnd={handleDragEnd}
            onTouchStart={(e) => handleTouchStart(e, 'ten')}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className={`w-10 h-32 bg-blue-500 border-2 border-blue-300 rounded cursor-grab
              ${draggingItem === 'ten' ? 'opacity-30 scale-110' : ''} transition-all`}
          />
          <span className="mt-1 font-semibold">Ten</span>
        </div>
        
        {/* One Cube Source */}
        <div className="flex flex-col items-center">
          <div
            draggable
            style={{ touchAction: "none" }}
            onDragStart={(e) => handleDragStart(e, 'one')}
            onDragEnd={handleDragEnd}
            onTouchStart={(e) => handleTouchStart(e, 'one')}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className={`w-10 h-10 bg-yellow-400 border-2 border-yellow-300 rounded cursor-grab
              ${draggingItem === 'one' ? 'opacity-30 scale-110' : ''} transition-all`}
          />
          <span className="mt-1 font-semibold">One</span>
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

export default BuildTheNumberGame;
