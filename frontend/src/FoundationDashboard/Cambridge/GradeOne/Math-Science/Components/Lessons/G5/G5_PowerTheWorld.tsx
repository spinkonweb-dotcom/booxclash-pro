import React, { useState, useEffect, useRef, useCallback } from "react";
import { CheckCircle, ThumbsUp, ThumbsDown } from "lucide-react";
import confetti from "canvas-confetti";

interface LessonProps {
  onComplete: () => void;
}

// --- DATA STRUCTURES ---

type ActionType = 'saving' | 'wasting';

type Scenario = {
  id: number;
  description: string;
  emoji: string;
  type: ActionType;
  bgColor: string; // Background for the scene
};

// --- GAME DATA ---

const ALL_SCENARIOS: Scenario[] = [
  { id: 1, description: "Leaving the light on in an empty room.", emoji: "💡", type: 'wasting', bgColor: 'bg-yellow-300' },
  { id: 2, description: "Turning off the TV when you're done watching.", emoji: "📺", type: 'saving', bgColor: 'bg-gray-700' },
  { id: 3, description: "Leaving the refrigerator door open.", emoji: "🧊", type: 'wasting', bgColor: 'bg-blue-200' },
  { id: 4, description: "Putting on a sweater instead of turning up the heat.", emoji: "🧥", type: 'saving', bgColor: 'bg-gray-300' },
  { id: 5, description: "Letting the water run while brushing teeth.", emoji: "🚰", type: 'wasting', bgColor: 'bg-blue-400' },
  { id: 6, description: "Turning off the computer at night.", emoji: "💻", type: 'saving', bgColor: 'bg-gray-800' },
  { id: 7, description: "Leaving the video game on all day.", emoji: "🎮", type: 'wasting', bgColor: 'bg-indigo-400' },
  { id: 8, description: "Using sunlight to light a room.", emoji: "☀️", type: 'saving', bgColor: 'bg-sky-400' },
];

const TOTAL_ROUNDS = 6; // Let's do 6 rounds

// Helper to shuffle an array
const shuffleArray = <T,>(array: T[]): T[] => {
  return [...array].sort(() => Math.random() - 0.5);
};

// --- COMPONENT ---

const EnergySaverGame: React.FC<LessonProps> = ({ onComplete }) => {
  // --- STATE ---
  const [gameRounds, setGameRounds] = useState<Scenario[]>([]);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [currentRound, setCurrentRound] = useState<Scenario | null>(null);
  
  const [isGameComplete, setIsGameComplete] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'correct' | 'wrong', choice: ActionType } | null>(null);
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
  const generateGameRounds = useCallback(() => {
    const rounds = shuffleArray(ALL_SCENARIOS).slice(0, TOTAL_ROUNDS);
    setGameRounds(rounds);
    setCurrentRoundIndex(0);
    setScore(0);
    setIsGameComplete(false);
  }, []);

  useEffect(() => {
    generateGameRounds();
  }, [generateGameRounds]);

  // Load current round
  useEffect(() => {
    if (gameRounds.length > 0 && currentRoundIndex < gameRounds.length) {
      setFeedback(null);
      setCurrentRound(gameRounds[currentRoundIndex]);
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

  const handleChoiceClick = (choice: ActionType) => {
    if (feedback || !currentRound) return; // Don't check if already showing feedback

    if (choice === currentRound.type) {
      // --- CORRECT ---
      correctSound.current.play();
      setFeedback({ type: 'correct', choice: choice });
      setScore(prev => prev + 1);
      setTimeout(handleNextRound, 1200);
    } else {
      // --- WRONG ---
      wrongSound.current.play();
      setFeedback({ type: 'wrong', choice: choice });
      setTimeout(() => {
        setFeedback(null);
        // We don't advance to the next round on a wrong answer,
        // letting the user try again.
        // Or we can advance:
        // setTimeout(handleNextRound, 1200);
      }, 1000);
      // For this game, let's advance even if wrong
      setTimeout(handleNextRound, 1200);
    }
  };

  // --- RENDER ---
  if (isGameComplete) {
    return (
      <div className="p-6 text-center flex flex-col items-center justify-center h-full text-white">
        <CheckCircle size={80} className="text-green-400 mb-4" />
        <h2 className="text-3xl font-bold">Energy Expert!</h2>
        <p className="text-lg mb-6">You got {score} out of {TOTAL_ROUNDS} correct!</p>
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
  
  const { description, emoji, bgColor } = currentRound;

  return (
    <div className="p-4 flex flex-col h-full text-white overflow-hidden">
      <h3 className="text-2xl font-bold text-center mb-2">Energy Hog or Saver?</h3>
      
      {/* Progress Bar */}
      <div className="w-full bg-gray-700 rounded-full h-4 mb-2">
        <div
          className="bg-blue-500 h-4 rounded-full transition-all duration-300"
          style={{ width: `${((currentRoundIndex) / TOTAL_ROUNDS) * 100}%` }}
        ></div>
      </div>
      <p className="text-center text-sm text-gray-300 mb-4">
        Action {currentRoundIndex + 1} of {TOTAL_ROUNDS} (Score: {score})
      </p>

      {/* Scenario Area */}
      <div className="flex-grow flex flex-col justify-center items-center mb-4">
        {/* Scene */}
        <div className={`relative w-60 h-60 ${bgColor} rounded-xl p-4 flex justify-center items-center overflow-hidden mb-4`}>
          <span className="text-9xl">{emoji}</span>
          {/* Example of a more complex scene */}
          {currentRound.id === 1 && ( // Light left on
            <>
              <span className="text-9xl animate-pulse">{emoji}</span>
              <span className="absolute bottom-4 right-4 text-4xl">🚪</span>
            </>
          )}
          {currentRound.id === 2 && ( // TV off
            <>
              <span className="text-9xl opacity-30">{emoji}</span>
              <span className="absolute text-5xl text-red-500 font-bold">OFF</span>
            </>
          )}
        </div>
        {/* Description */}
        <p className="text-lg text-center text-cyan-300 h-16">{description}</p>
      </div>


      {/* Choice Buttons */}
      <div className="flex justify-center items-center gap-4">
        {/* Wasting Button */}
        <button
          onClick={() => handleChoiceClick('wasting')}
          disabled={!!feedback}
          className={`flex-1 flex flex-col items-center justify-center p-4 rounded-lg aspect-square
            transition-all duration-200 bg-red-600 hover:bg-red-500
            ${feedback && feedback.choice !== 'wasting' ? 'opacity-30' : ''}
            ${feedback && feedback.type === 'correct' && feedback.choice === 'wasting' ? 'scale-105 ring-4 ring-green-400' : ''}
            ${feedback && feedback.type === 'wrong' && feedback.choice === 'wasting' ? 'animate-shake' : ''}
          `}
        >
          <ThumbsDown size={48} />
          <span className="text-xl font-semibold mt-2">Wasting</span>
        </button>

        {/* Saving Button */}
        <button
          onClick={() => handleChoiceClick('saving')}
          disabled={!!feedback}
          className={`flex-1 flex flex-col items-center justify-center p-4 rounded-lg aspect-square
            transition-all duration-200 bg-green-600 hover:bg-green-500
            ${feedback && feedback.choice !== 'saving' ? 'opacity-30' : ''}
            ${feedback && feedback.type === 'correct' && feedback.choice === 'saving' ? 'scale-105 ring-4 ring-green-400' : ''}
            ${feedback && feedback.type === 'wrong' && feedback.choice === 'saving' ? 'animate-shake' : ''}
          `}
        >
          <ThumbsUp size={48} />
          <span className="text-xl font-semibold mt-2">Saving</span>
        </button>
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
        `}
      </style>
    </div>
  );
};

export default EnergySaverGame;