import React, { useState, useEffect, useRef, useCallback } from "react";
import { CheckCircle } from "lucide-react";
import confetti from "canvas-confetti";

interface LessonProps {
  onComplete: () => void;
}

// --- DATA STRUCTURES ---

type AnswerOption = {
  id: string;
  emoji: string;
  text: string;
  isCorrect: boolean;
};

type GameRound = {
  id: number;
  question: string;
  options: AnswerOption[];
};

// --- GAME DATA ---
const ALL_ROUNDS: GameRound[] = [
  {
    id: 1,
    question: "What should you do before you eat?",
    options: [
      { id: "1a", emoji: "🧼", text: "Wash Hands", isCorrect: true },
      { id: "1b", emoji: "🧱", text: "Play in Mud", isCorrect: false },
      { id: "1c", emoji: "😴", text: "Go to Sleep", isCorrect: false },
    ],
  },
  {
    id: 2,
    question: "Which item is UNSAFE to touch?",
    options: [
      { id: "2a", emoji: "🧸", text: "Teddy Bear", isCorrect: false },
      { id: "2b", emoji: "🔥", text: "Hot Stove", isCorrect: true },
      { id: "2c", emoji: "🍎", text: "Apple", isCorrect: false },
    ],
  },
  {
    id: 3,
    question: "Which of these is a healthy choice?",
    options: [
      { id: "3a", emoji: "🥤", text: "Soda", isCorrect: false },
      { id: "3b", emoji: "🍬", text: "Candy", isCorrect: false },
      { id: "3c", emoji: "🥦", text: "Broccoli", isCorrect: true },
    ],
  },
  {
    id: 4,
    question: "What do you use to clean your teeth?",
    options: [
      { id: "4a", emoji: "🦷", text: "Toothbrush", isCorrect: true },
      { id: "4b", emoji: "💈", text: "Comb", isCorrect: false },
      { id: "4c", emoji: "👟", text: "Shoe", isCorrect: false },
    ],
  },
  {
    id: 5,
    question: "When should you wash your hands?",
    options: [
      { id: "5a", emoji: "📖", text: "Reading", isCorrect: false },
      { id: "5b", emoji: "🚽", text: "After Toilet", isCorrect: true },
      { id: "5c", emoji: "📺", text: "Watching TV", isCorrect: false },
    ],
  },
  {
    id: 6,
    question: "Which item is NOT a hygiene tool?",
    options: [
      { id: "6a", emoji: "🧼", text: "Soap", isCorrect: false },
      { id: "6b", emoji: "🧴", text: "Shampoo", isCorrect: false },
      { id: "6c", emoji: "🚗", text: "Toy Car", isCorrect: true },
    ],
  },
  {
    id: 7,
    question: "What is a safe way to play?",
    options: [
      { id: "7a", emoji: "✂️", text: "Run with Scissors", isCorrect: false },
      { id: "7b", emoji: "⚽", text: "Play Ball", isCorrect: true },
      { id: "7c", emoji: "🔌", text: "Play with Outlet", isCorrect: false },
    ],
  },
  {
    id: 8,
    question: "What helps your body rest and grow?",
    options: [
      { id: "8a", emoji: "😴", text: "Sleeping", isCorrect: true },
      { id: "8b", emoji: "🦠", text: "Germs", isCorrect: false },
      { id: "8c", emoji: "🤧", text: "Coughing", isCorrect: false },
    ],
  },
];

const TOTAL_ROUNDS = 6; // Let's do 6 rounds

// Helper to shuffle an array
const shuffleArray = <T,>(array: T[]): T[] => {
  return [...array].sort(() => Math.random() - 0.5);
};

// --- COMPONENT ---

const QuizShowGame: React.FC<LessonProps> = ({ onComplete }) => {
  // --- STATE ---
  const [gameRounds, setGameRounds] = useState<GameRound[]>([]);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [currentRound, setCurrentRound] = useState<GameRound | null>(null);
  
  const [isGameComplete, setIsGameComplete] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);

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
    const rounds = shuffleArray(ALL_ROUNDS).slice(0, TOTAL_ROUNDS);
    // Shuffle options for each round
    const roundsWithShuffledOptions = rounds.map(round => ({
      ...round,
      options: shuffleArray(round.options)
    }));
    setGameRounds(roundsWithShuffledOptions);
    setCurrentRoundIndex(0);
  }, []);

  useEffect(() => {
    generateGameRounds();
  }, [generateGameRounds]);

  // Load current round
  useEffect(() => {
    if (gameRounds.length > 0 && currentRoundIndex < gameRounds.length) {
      setCurrentRound(gameRounds[currentRoundIndex]);
      setFeedback(null);
      setSelectedOptionId(null);
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

  const handleAnswerClick = (selectedOption: AnswerOption) => {
    if (feedback) return; // Don't check if already showing feedback

    setSelectedOptionId(selectedOption.id);

    if (selectedOption.isCorrect) {
      correctSound.current.play();
      setFeedback('correct');
      setTimeout(handleNextRound, 1200);
    } else {
      wrongSound.current.play();
      setFeedback('wrong');
      setTimeout(() => {
        setFeedback(null);
        setSelectedOptionId(null);
      }, 1000);
    }
  };

  // --- RENDER ---
  if (isGameComplete) {
    return (
      <div className="p-6 text-center flex flex-col items-center justify-center h-full text-white">
        <CheckCircle size={80} className="text-green-400 mb-4" />
        <h2 className="text-3xl font-bold">Health Expert!</h2>
        <p className="text-lg mb-6">You aced the quiz!</p>
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
  
  const { question, options } = currentRound;

  return (
    <div className="p-4 flex flex-col h-full text-white">
      <h3 className="text-2xl font-bold text-center mb-6">{question}</h3>

      {/* Answer Options */}
      <div className="flex-grow flex flex-col items-center justify-center gap-4">
        {options.map((option) => (
          <button
            key={option.id}
            onClick={() => handleAnswerClick(option)}
            disabled={!!feedback}
            className={`w-full max-w-sm p-4 bg-indigo-600 rounded-lg flex items-center gap-4
              transition-all duration-200
              ${selectedOptionId === option.id && feedback === 'correct' ? 'bg-green-600 scale-105' : ''}
              ${selectedOptionId === option.id && feedback === 'wrong' ? 'bg-red-600 animate-shake' : ''}
              ${feedback && selectedOptionId !== option.id ? 'opacity-50' : ''}
              ${!feedback ? 'hover:bg-indigo-500' : ''}
            `}
          >
            <span className="text-6xl p-3 bg-white/20 rounded-lg">{option.emoji}</span>
            <span className="text-2xl font-semibold">{option.text}</span>
          </button>
        ))}
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

export default QuizShowGame;
