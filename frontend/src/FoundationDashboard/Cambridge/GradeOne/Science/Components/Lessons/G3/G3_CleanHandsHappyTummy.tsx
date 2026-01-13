import React, { useState, useEffect, useRef } from "react";
import { CheckCircle } from "lucide-react";
import confetti from "canvas-confetti";

interface LessonProps {
  onComplete: () => void;
}

// --- DATA STRUCTURES ---

type GameRound = {
  id: string;
  emoji: string;
  scenarioText: string;
  requiresWash: boolean; // True if washing is needed, false if not
};

// --- GAME DATA ---
const ALL_ROUNDS: GameRound[] = [
  { id: "mud", emoji: "🧱", scenarioText: "Playing in the mud", requiresWash: true },
  { id: "eat", emoji: "🍎", scenarioText: "About to eat lunch", requiresWash: true },
  { id: "read", emoji: "📖", scenarioText: "Reading a book", requiresWash: false },
  { id: "toilet", emoji: "🚽", scenarioText: "After using the toilet", requiresWash: true },
  { id: "pet", emoji: "🐶", scenarioText: "After petting the dog", requiresWash: true },
  { id: "watchTV", emoji: "📺", scenarioText: "Watching TV", requiresWash: false },
  { id: "sneeze", emoji: "🤧", scenarioText: "After sneezing", requiresWash: true },
  { id: "sleep", emoji: "😴", scenarioText: "Waking up from a nap", requiresWash: false },
  { id: "trash", emoji: "🗑️", scenarioText: "After taking out the trash", requiresWash: true },
  { id: "draw", emoji: "🖍️", scenarioText: "Drawing a picture", requiresWash: false },
];

const TOTAL_ROUNDS = 8;

// Helper to shuffle an array
const shuffleArray = <T,>(array: T[]): T[] => {
  return [...array].sort(() => Math.random() - 0.5);
};

// --- COMPONENT ---

const WhenToWashGame: React.FC<LessonProps> = ({ onComplete }) => {
  // --- STATE ---
  const [gameRounds, setGameRounds] = useState<GameRound[]>([]);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [currentRound, setCurrentRound] = useState<GameRound | null>(null);
  
  const [isGameComplete, setIsGameComplete] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [choice, setChoice] = useState<'wash' | 'no-wash' | null>(null); // Which button was pressed

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
  useEffect(() => {
    const rounds = shuffleArray(ALL_ROUNDS).slice(0, TOTAL_ROUNDS);
    setGameRounds(rounds);
    setCurrentRoundIndex(0);
  }, []);

  // Load current round
  useEffect(() => {
    if (gameRounds.length > 0 && currentRoundIndex < gameRounds.length) {
      setCurrentRound(gameRounds[currentRoundIndex]);
      setFeedback(null);
      setChoice(null);
    } else if (currentRoundIndex >= TOTAL_ROUNDS && TOTAL_ROUNDS > 0) {
      setIsGameComplete(true);
      clapSound.current.play();
      confetti({ particleCount: 200, spread: 80, origin: { y: 0.6 } });
    }
  }, [gameRounds, currentRoundIndex, clapSound]);

  // --- GAME LOGIC ---
  const handleNextRound = () => {
    setCurrentRoundIndex(prev => prev + 1);
  };

  const handleChoice = (madeChoice: 'wash' | 'no-wash') => {
    if (feedback || !currentRound) return; // Prevent multiple clicks

    const isCorrect = 
      (madeChoice === 'wash' && currentRound.requiresWash) ||
      (madeChoice === 'no-wash' && !currentRound.requiresWash);

    setChoice(madeChoice);

    if (isCorrect) {
      correctSound.current.play();
      setFeedback('correct');
      setTimeout(handleNextRound, 1200);
    } else {
      wrongSound.current.play();
      setFeedback('wrong');
      setTimeout(() => {
        setFeedback(null);
        setChoice(null);
      }, 1000);
    }
  };

  // --- RENDER ---
  if (isGameComplete) {
    return (
      <div className="p-6 text-center flex flex-col items-center justify-center h-full text-white">
        <CheckCircle size={80} className="text-green-400 mb-4" />
        <h2 className="text-3xl font-bold">Clean Hands Champion!</h2>
        <p className="text-lg mb-6">You know exactly when to wash!</p>
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
      <h3 className="text-2xl font-bold text-center mb-4">When should you wash your hands?</h3>
      
      {/* Scenario Area */}
      <div className="flex-grow flex flex-col items-center justify-center p-4 bg-white/10 rounded-xl min-h-[200px] mb-6">
        <div className="text-8xl md:text-9xl">{currentRound.emoji}</div>
        <p className="text-2xl md:text-3xl font-semibold text-center mt-4">{currentRound.scenarioText}</p>
      </div>

      {/* Button Area */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => handleChoice('wash')}
          disabled={!!feedback}
          className={`flex flex-col items-center justify-center p-6 bg-blue-600 text-white rounded-lg transition-all duration-200
            ${feedback && choice !== 'wash' ? 'opacity-50' : ''}
            ${feedback === 'correct' && choice === 'wash' ? 'scale-105 bg-green-600' : ''}
            ${feedback === 'wrong' && choice === 'wash' ? 'animate-shake bg-red-600' : ''}
            ${!feedback ? 'hover:bg-blue-700' : ''}
          `}
        >
          <span className="text-5xl">✋</span>
          <span className="text-2xl font-bold mt-2">Wash Hands</span>
        </button>

        <button
          onClick={() => handleChoice('no-wash')}
          disabled={!!feedback}
          className={`flex flex-col items-center justify-center p-6 bg-gray-600 text-white rounded-lg transition-all duration-200
            ${feedback && choice !== 'no-wash' ? 'opacity-50' : ''}
            ${feedback === 'correct' && choice === 'no-wash' ? 'scale-105 bg-green-600' : ''}
            ${feedback === 'wrong' && choice === 'no-wash' ? 'animate-shake bg-red-600' : ''}
            ${!feedback ? 'hover:bg-gray-700' : ''}
          `}
        >
          <span className="text-5xl">👍</span>
          <span className="text-2xl font-bold mt-2">No Wash Needed</span>
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

export default WhenToWashGame;
