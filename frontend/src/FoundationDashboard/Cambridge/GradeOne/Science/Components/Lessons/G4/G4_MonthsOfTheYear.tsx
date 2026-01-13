import React, { useState, useEffect, useRef, useCallback } from "react";
import { CheckCircle, ArrowLeft, ArrowRight } from "lucide-react";
import confetti from "canvas-confetti";

interface LessonProps {
  onComplete: () => void;
}

// --- DATA STRUCTURES ---

type Month = {
  id: string;
  name: string;
  order: number; // 1-12
  icon: string;
};

type GameRound = {
  id: number;
  prompt: string;
  correctMonthId: string;
};

// --- GAME DATA ---
const ALL_MONTHS: Month[] = [
  { id: 'jan', name: 'January', order: 1, icon: '❄️' },
  { id: 'feb', name: 'February', order: 2, icon: '❤️' },
  { id: 'mar', name: 'March', order: 3, icon: '🍀' },
  { id: 'apr', name: 'April', order: 4, icon: '🌧️' },
  { id: 'may', name: 'May', order: 5, icon: '🌸' },
  { id: 'jun', name: 'June', order: 6, icon: '☀️' },
  { id: 'jul', name: 'July', order: 7, icon: '🎆' },
  { id: 'aug', name: 'August', order: 8, icon: '🏖️' },
  { id: 'sep', name: 'September', order: 9, icon: '🍂' },
  { id: 'oct', name: 'October', order: 10, icon: '🎃' },
  { id: 'nov', name: 'November', order: 11, icon: '🦃' },
  { id: 'dec', name: 'December', order: 12, icon: '🎄' },
];

const ALL_ROUNDS: GameRound[] = [
  { id: 1, prompt: 'Find July!', correctMonthId: 'jul' },
  { id: 2, prompt: 'Find the month with Halloween 🎃', correctMonthId: 'oct' },
  { id: 3, prompt: 'Find the month with Christmas 🎄', correctMonthId: 'dec' },
  { id: 4, prompt: 'Find January!', correctMonthId: 'jan' },
  { id: 5, prompt: 'Find the month with Valentine\'s Day ❤️', correctMonthId: 'feb' },
  { id: 6, prompt: 'Find the month with Thanksgiving 🦃', correctMonthId: 'nov' },
  { id: 7, prompt: 'Find May!', correctMonthId: 'may' },
];

// Helper to shuffle an array
const shuffleArray = <T,>(array: T[]): T[] => {
  return [...array].sort(() => Math.random() - 0.5);
};

// --- COMPONENT ---

const MonthsOfTheYearGame: React.FC<LessonProps> = ({ onComplete }) => {
  // --- STATE ---
  const [gameRounds, setGameRounds] = useState<GameRound[]>([]);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [currentRound, setCurrentRound] = useState<GameRound | null>(null);
  
  const [currentMonthIndex, setCurrentMonthIndex] = useState(0); // 0 = Jan, 1 = Feb, etc.
  
  const [isGameComplete, setIsGameComplete] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

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
    const rounds = shuffleArray(ALL_ROUNDS);
    setGameRounds(rounds);
    setCurrentRoundIndex(0);
    setCurrentMonthIndex(0); // Start at January
  }, []);

  useEffect(() => {
    generateGameRounds();
  }, [generateGameRounds]);

  // Load current round
  useEffect(() => {
    if (gameRounds.length > 0 && currentRoundIndex < gameRounds.length) {
      setCurrentRound(gameRounds[currentRoundIndex]);
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

  const handleMonthSelect = (selectedMonth: Month) => {
    if (feedback || !currentRound) return; // Don't check if already showing feedback

    if (selectedMonth.id === currentRound.correctMonthId) {
      correctSound.current.play();
      setFeedback('correct');
      setTimeout(handleNextRound, 1200);
    } else {
      wrongSound.current.play();
      setFeedback('wrong');
      setTimeout(() => {
        setFeedback(null);
      }, 1000);
    }
  };

  const changeMonth = (direction: 'next' | 'prev') => {
    if (feedback) return;
    
    if (direction === 'next') {
      setCurrentMonthIndex(prev => (prev + 1) % 12);
    } else {
      setCurrentMonthIndex(prev => (prev - 1 + 12) % 12);
    }
  };

  // --- RENDER ---
  if (isGameComplete) {
    return (
      <div className="p-6 text-center flex flex-col items-center justify-center h-full text-white">
        <CheckCircle size={80} className="text-green-400 mb-4" />
        <h2 className="text-3xl font-bold">Great Job!</h2>
        <p className="text-lg mb-6">You know the months of the year!</p>
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
  
  const displayedMonth = ALL_MONTHS[currentMonthIndex];

  return (
    <div className="p-4 flex flex-col h-full text-white overflow-hidden">
      <h3 className="text-2xl font-bold text-center mb-4">{currentRound.prompt}</h3>
      
      {/* Calendar Flipper */}
      <div className="flex-grow flex items-center justify-center gap-2">
        {/* Prev Button */}
        <button
          onClick={() => changeMonth('prev')}
          disabled={!!feedback}
          className="p-4 bg-white/10 rounded-full hover:bg-white/20 disabled:opacity-50"
        >
          <ArrowLeft size={32} />
        </button>
        
        {/* Calendar Page */}
        <div
          onClick={() => handleMonthSelect(displayedMonth)}
          className={`w-64 h-80 bg-slate-100 text-slate-800 rounded-lg shadow-xl flex flex-col items-center justify-center p-4 cursor-pointer
            transition-all duration-200
            ${feedback === 'correct' ? 'border-8 border-green-500 scale-105' : ''}
            ${feedback === 'wrong' ? 'border-8 border-red-500 animate-shake' : ''}
            ${!feedback ? 'hover:scale-105' : ''}
          `}
        >
          <div className="text-8xl">{displayedMonth.icon}</div>
          <div className="text-4xl font-bold mt-4">{displayedMonth.name}</div>
        </div>
        
        {/* Next Button */}
        <button
          onClick={() => changeMonth('next')}
          disabled={!!feedback}
          className="p-4 bg-white/10 rounded-full hover:bg-white/20 disabled:opacity-50"
        >
          <ArrowRight size={32} />
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

export default MonthsOfTheYearGame;