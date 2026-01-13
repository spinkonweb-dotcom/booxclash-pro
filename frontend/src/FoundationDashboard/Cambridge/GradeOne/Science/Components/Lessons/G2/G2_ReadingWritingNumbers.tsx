import React, { useState, useEffect, useRef, useCallback } from "react";
import { CheckCircle } from "lucide-react";
import confetti from "canvas-confetti";

interface LessonProps {
  onComplete: () => void;
}

// --- DATA STRUCTURES ---

type Order = {
  numeral: number;
  numberWord: string;
};

type GameRound = {
  correctOrder: Order;
  options: number[]; // Will include the correct numeral + 2 wrong ones
};

// --- GAME DATA ---
const ALL_ORDERS: Order[] = [
  { numeral: 1, numberWord: "One" },
  { numeral: 2, numberWord: "Two" },
  { numeral: 3, numberWord: "Three" },
  { numeral: 4, numberWord: "Four" },
  { numeral: 5, numberWord: "Five" },
  { numeral: 6, numberWord: "Six" },
  { numeral: 7, numberWord: "Seven" },
  { numeral: 8, numberWord: "Eight" },
  { numeral: 9, numberWord: "Nine" },
  { numeral: 10, numberWord: "Ten" },
  { numeral: 11, numberWord: "Eleven" },
  { numeral: 12, numberWord: "Twelve" },
  { numeral: 13, numberWord: "Thirteen" },
  { numeral: 14, numberWord: "Fourteen" },
  { numeral: 15, numberWord: "Fifteen" },
  { numeral: 16, numberWord: "Sixteen" },
  { numeral: 17, numberWord: "Seventeen" },
  { numeral: 18, numberWord: "Eighteen" },
  { numeral: 19, numberWord: "Nineteen" },
  { numeral: 20, numberWord: "Twenty" },
];

const TOTAL_ROUNDS = 8;

// Helper to shuffle an array
const shuffleArray = <T,>(array: T[]): T[] => {
  return [...array].sort(() => Math.random() - 0.5);
};

// --- COMPONENT ---

const OrderUpGame: React.FC<LessonProps> = ({ onComplete }) => {
  // --- STATE ---
  const [gameRounds, setGameRounds] = useState<GameRound[]>([]);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [currentOptions, setCurrentOptions] = useState<number[]>([]);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [isGameComplete, setIsGameComplete] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

  // Drag state
  const [draggingNumber, setDraggingNumber] = useState<number | null>(null);
  const [dragOverCustomer, setDragOverCustomer] = useState(false);

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
    const shuffledOrders = shuffleArray(ALL_ORDERS);
    const rounds: GameRound[] = [];

    for (let i = 0; i < TOTAL_ROUNDS; i++) {
      const correctOrder = shuffledOrders[i];
      
      // Get two wrong options
      const wrongOptions = shuffleArray(ALL_ORDERS.filter(o => o.numeral !== correctOrder.numeral)).slice(0, 2).map(o => o.numeral);
      
      const options = shuffleArray([correctOrder.numeral, ...wrongOptions]);
      
      rounds.push({ correctOrder, options });
    }
    setGameRounds(rounds);
  }, []);

  useEffect(() => {
    generateGameRounds();
  }, [generateGameRounds]);

  // --- LOAD CURRENT ROUND ---
  useEffect(() => {
    if (gameRounds.length > 0 && currentRoundIndex < gameRounds.length) {
      const round = gameRounds[currentRoundIndex];
      setCurrentOrder(round.correctOrder);
      setCurrentOptions(round.options);
      setFeedback(null);
    }
  }, [gameRounds, currentRoundIndex]);

  // --- GAME LOGIC ---
  const handleNextRound = () => {
    if (currentRoundIndex < TOTAL_ROUNDS - 1) {
      setCurrentRoundIndex(prev => prev + 1);
    } else {
      setIsGameComplete(true);
      clapSound.current.play();
      confetti({ particleCount: 200, spread: 80, origin: { y: 0.6 } });
    }
  };

  const processDrop = (droppedNumber: number) => {
    if (feedback || !currentOrder) return; // Prevent multiple quick answers

    if (droppedNumber === currentOrder.numeral) {
      correctSound.current.play();
      setFeedback('correct');
      // Hide the correct plate
      setCurrentOptions(prev => prev.filter(opt => opt !== droppedNumber));
      setTimeout(handleNextRound, 1200);
    } else {
      wrongSound.current.play();
      setFeedback('wrong');
      setTimeout(() => setFeedback(null), 800);
    }
  };

  // --- DRAG & DROP HANDLERS ---
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, numeral: number) => {
    e.dataTransfer.setData("numeral", numeral.toString());
    setDraggingNumber(numeral);
  };

  const handleDragEnd = () => {
    setDraggingNumber(null);
    setDragOverCustomer(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOverCustomer(true);
  };

  const handleDragLeave = () => {
    setDragOverCustomer(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOverCustomer(false);
    const droppedNumeral = parseInt(e.dataTransfer.getData("numeral"));
    if (droppedNumeral) {
      processDrop(droppedNumeral);
    }
    setDraggingNumber(null);
  };

  // --- TOUCH HANDLERS ---
  const handleTouchStart = (_e: React.TouchEvent<HTMLDivElement>, numeral: number) => {
    setDraggingNumber(numeral);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement | null;
    const customerZone = element?.closest("[data-customer-dropzone]");
    setDragOverCustomer(!!customerZone);
  };

  const handleTouchEnd = (_e: React.TouchEvent<HTMLDivElement>, numeral: number) => {
    if (dragOverCustomer) {
      processDrop(numeral);
    }
    setDraggingNumber(null);
    setDragOverCustomer(false);
  };

  // --- RENDER ---
  if (isGameComplete) {
    return (
      <div className="p-6 text-center flex flex-col items-center justify-center h-full text-white">
        <CheckCircle size={80} className="text-green-400 mb-4" />
        <h2 className="text-3xl font-bold">Great Job!</h2>
        <p className="text-lg mb-6">You served all the customers correctly!</p>
        <button
          onClick={onComplete}
          className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Finish Lesson
        </button>
      </div>
    );
  }

  if (!currentOrder) {
    return <div className="p-6 text-center text-white">Loading...</div>;
  }

  return (
    <div className="p-4 flex flex-col h-full text-white overflow-hidden">
      <h3 className="text-2xl font-bold text-center mb-4">Order Up!</h3>
      
      {/* Customer Area (Drop Zone) */}
      <div 
        className="flex-1 flex flex-col items-center justify-center p-4"
      >
        <div
          data-customer-dropzone="true"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative flex items-center justify-center w-full max-w-sm h-64 bg-indigo-800 rounded-xl transition-all duration-200 border-4 border-dashed
            ${dragOverCustomer ? 'border-cyan-400 scale-105 shadow-lg' : 'border-white/20'}
            ${feedback === 'correct' ? 'bg-green-700' : ''}
            ${feedback === 'wrong' ? 'bg-red-700' : ''}
          `}
        >
          {/* Customer Emoji */}
          <div className="text-8xl">🧑‍🍳</div>
          
          {/* Speech Bubble */}
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-11/12 bg-white text-indigo-900 p-4 rounded-lg shadow-xl">
            <p className="text-center text-xl md:text-2xl font-bold">"I'd like <span className="text-red-600">{currentOrder.numberWord}</span> pancakes, please!"</p>
            <div className="absolute left-1/2 -bottom-4 w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-t-8 border-t-white"></div>
          </div>

          {/* Feedback Icon */}
          {feedback === 'correct' && <div className="absolute text-8xl text-white">👍</div>}
          {feedback === 'wrong' && <div className="absolute text-8xl text-white animate-shake">👎</div>}
        </div>
      </div>

      {/* Plates Area (Drag Items) */}
      <div className="w-full h-48 bg-stone-700 rounded-lg p-4 flex justify-center items-center gap-6">
        {currentOptions.map((numeral) => (
          <div
            key={numeral}
            draggable
            style={{ touchAction: "none" }}
            onDragStart={(e) => handleDragStart(e, numeral)}
            onDragEnd={handleDragEnd}
            onTouchStart={(e) => handleTouchStart(e, numeral)}
            onTouchMove={handleTouchMove}
            onTouchEnd={(e) => handleTouchEnd(e, numeral)}
            className={`w-32 h-32 bg-slate-100 rounded-full flex items-center justify-center text-5xl font-bold text-slate-800 shadow-lg cursor-grab
              border-8 border-slate-300 transition-all duration-200
              ${draggingNumber === numeral ? 'opacity-30 scale-110' : 'opacity-100'}
            `}
          >
            {numeral}
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

export default OrderUpGame;
