import React, { useState, useEffect, useRef, useCallback } from "react";
import { CheckCircle } from "lucide-react";
import confetti from "canvas-confetti";

interface LessonProps {
  onComplete: () => void;
}

// --- DATA STRUCTURES ---

type PatternItem = string | number;

type GameRound = {
  description: string;
  sequence: PatternItem[]; // The pattern shown, e.g., [2, 4, 6]
  options: PatternItem[];    // The choices, e.g., [8, 7, 10]
  missing: PatternItem;      // The correct answer, e.g., 8
};

// --- GAME DATA ---
const ALL_PATTERNS: GameRound[] = [
  {
    description: "What comes next? Count by 2s!",
    sequence: [2, 4, 6],
    options: [8, 7, 10],
    missing: 8,
  },
  {
    description: "What comes next? Count by 5s!",
    sequence: [5, 10, 15],
    options: [20, 16, 25],
    missing: 20,
  },
  {
    description: "What comes next? Count by 10s!",
    sequence: [10, 20, 30],
    options: [40, 35, 50],
    missing: 40,
  },
  {
    description: "Follow the pattern!",
    sequence: ["🟥", "🟦", "🟥"],
    options: ["🟦", "🟥", "🟩"],
    missing: "🟦",
  },
  {
    description: "Follow the pattern!",
    sequence: ["☀️", "🌙", "☀️"],
    options: ["🌙", "☀️", "⭐"],
    missing: "🌙",
  },
  {
    description: "Follow the pattern!",
    sequence: [1, 2, 3, 1, 2],
    options: [3, 1, 4],
    missing: 3,
  },
  {
    description: "What comes next?",
    sequence: ["A", "B", "A", "B"],
    options: ["A", "B", "C"],
    missing: "A",
  },
  {
    description: "What comes next?",
    sequence: ["🍎", "🍎", "🍌", "🍎", "🍎"],
    options: ["🍌", "🍎", "🍊"],
    missing: "🍌",
  },
];

const TOTAL_ROUNDS = 8;

// Helper to shuffle an array
const shuffleArray = <T,>(array: T[]): T[] => {
  return [...array].sort(() => Math.random() - 0.5);
};

// --- COMPONENT ---

const PatternTrainGame: React.FC<LessonProps> = ({ onComplete }) => {
  // --- STATE ---
  const [gameRounds, setGameRounds] = useState<GameRound[]>([]);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [currentRound, setCurrentRound] = useState<GameRound | null>(null);
  
  const [isGameComplete, setIsGameComplete] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [wrongSelection, setWrongSelection] = useState<PatternItem | null>(null);

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
    const rounds = shuffleArray(ALL_PATTERNS).slice(0, TOTAL_ROUNDS);
    setGameRounds(rounds);
    setCurrentRoundIndex(0);
  }, []);

  useEffect(() => {
    generateGameRounds();
  }, [generateGameRounds]);

  // Load current round
  useEffect(() => {
    if (gameRounds.length > 0 && currentRoundIndex < gameRounds.length) {
      setCurrentRound({
        ...gameRounds[currentRoundIndex],
        options: shuffleArray(gameRounds[currentRoundIndex].options) // Shuffle options
      });
      setFeedback(null);
      setWrongSelection(null);
    }
  }, [gameRounds, currentRoundIndex]);

  // --- GAME FLOW ---
  const handleNextRound = () => {
    if (currentRoundIndex < TOTAL_ROUNDS - 1) {
      setCurrentRoundIndex(prev => prev + 1);
    } else {
      setIsGameComplete(true);
      clapSound.current.play();
      confetti({ particleCount: 200, spread: 80, origin: { y: 0.6 } });
    }
  };

  const handleAnswerClick = (selectedItem: PatternItem) => {
    if (feedback || !currentRound) return; // Don't check if already showing feedback

    if (selectedItem === currentRound.missing) {
      correctSound.current.play();
      setFeedback('correct');
      // Briefly show the correct item in the empty slot
      setCurrentRound(prev => {
        if (prev) {
          const newSequence = [...prev.sequence, prev.missing];
          return {
            ...prev,
            sequence: newSequence
          };
        }
        return null;
      });
      setTimeout(handleNextRound, 1500);
    } else {
      wrongSound.current.play();
      setFeedback('wrong');
      setWrongSelection(selectedItem);
      setTimeout(() => {
        setFeedback(null);
        setWrongSelection(null);
      }, 1000);
    }
  };

  // --- RENDER ---
  if (isGameComplete) {
    return (
      <div className="p-6 text-center flex flex-col items-center justify-center h-full text-white">
        <CheckCircle size={80} className="text-green-400 mb-4" />
        <h2 className="text-3xl font-bold">Great Job!</h2>
        <p className="text-lg mb-6">You're a Pattern Pro!</p>
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
  
  const { description, sequence, options, missing } = currentRound;

  return (
    <div className="p-4 flex flex-col h-full text-white overflow-hidden">
      <h3 className="text-2xl font-bold text-center mb-2">Complete the Pattern!</h3>
      <p className="text-lg text-center text-cyan-300 mb-6">{description}</p>
      
      {/* Train Area */}
      <div className="flex-grow flex flex-col items-center justify-center">
        <div className="flex items-center justify-center flex-wrap gap-2">
          {/* Train Engine */}
          <div className="text-6xl md:text-8xl">🚂</div>
          {/* Train Cars */}
          {sequence.map((item, index) => (
            <div
              key={index}
              className={`w-20 h-20 md:w-24 md:h-24 bg-indigo-600 rounded-lg flex items-center justify-center text-4xl font-bold shadow-md
                ${feedback === 'correct' && index === sequence.length - 1 ? 'animate-pulse' : ''}
              `}
            >
              {item}
            </div>
          ))}
          {/* Empty Car (unless just answered correctly) */}
          {feedback !== 'correct' && (
            <div className="w-20 h-20 md:w-24 md:h-24 bg-white/10 rounded-lg flex items-center justify-center text-4xl font-bold border-4 border-dashed border-white/40">
              ?
            </div>
          )}
        </div>
      </div>

      {/* Station Area (Answer Buttons) */}
      <div className="flex flex-col items-center mt-6">
        <h4 className="text-xl font-semibold mb-4">Choose the next car:</h4>
        <div className="flex flex-wrap justify-center gap-4">
          {options.map((item, index) => (
            <button
              key={index}
              onClick={() => handleAnswerClick(item)}
              disabled={!!feedback}
              className={`w-24 h-24 bg-amber-500 text-white font-bold text-4xl rounded-lg shadow-lg
                hover:bg-amber-600 transition-all duration-200
                ${feedback === 'correct' && item === missing ? 'bg-green-600 scale-110' : ''}
                ${wrongSelection === item ? 'bg-red-600 animate-shake' : ''}
              `}
            >
              {item}
            </button>
          ))}
        </div>
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

export default PatternTrainGame;

