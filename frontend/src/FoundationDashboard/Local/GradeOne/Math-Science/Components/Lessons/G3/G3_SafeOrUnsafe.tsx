import React, { useState, useEffect, useRef } from "react";
import { CheckCircle, ThumbsUp, ThumbsDown } from "lucide-react";
import confetti from "canvas-confetti";

interface LessonProps {
  onComplete: () => void;
}

// --- DATA STRUCTURES ---

type ScenarioCategory = 'safe' | 'unsafe';

type Scenario = {
  id: string;
  description: string;
  emoji: string;
  category: ScenarioCategory;
};

// --- GAME DATA ---

const ALL_SCENARIOS: Scenario[] = [
  // Safe Scenarios
  { id: "playBall", description: "Playing with a ball", emoji: "⚽", category: "safe" },
  { id: "readBook", description: "Reading a book", emoji: "📖", category: "safe" },
  { id: "washHands", description: "Washing hands", emoji: "🧼", category: "safe" },
  { id: "wearHelmet", description: "Wearing a helmet", emoji: " Helm.", category: "safe" }, // Helmet emoji
  { id: "crossWalk", description: "Crossing at crosswalk", emoji: "🚶‍♀️", category: "safe" },
  { id: "eatFruit", description: "Eating fruit", emoji: "🍓", category: "safe" },

  // Unsafe Scenarios
  { id: "touchStove", description: "Touching a hot stove", emoji: "🔥", category: "unsafe" },
  { id: "runScissors", description: "Running with scissors", emoji: "✂️", category: "unsafe" },
  { id: "playRoad", description: "Playing in the road", emoji: "🛣️", category: "unsafe" },
  { id: "talkStranger", description: "Talking to strangers", emoji: "👤", category: "unsafe" },
  { id: "climbHigh", description: "Climbing too high", emoji: "🪜", category: "unsafe" },
  { id: "playOutlet", description: "Playing with an outlet", emoji: "🔌", category: "unsafe" },
];

// Helper to shuffle an array
const shuffleArray = <T,>(array: T[]): T[] => {
  return [...array].sort(() => Math.random() - 0.5);
};

// --- COMPONENT ---

const SafeOrUnsafeGame: React.FC<LessonProps> = ({ onComplete }) => {
  // --- STATE ---
  const [currentScenarioIndex, setCurrentScenarioIndex] = useState(0);
  const [gameScenarios, setGameScenarios] = useState<Scenario[]>([]);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [isGameComplete, setIsGameComplete] = useState(false);
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(null);

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
    // Select a subset of scenarios for the game
    const scenarios = shuffleArray(ALL_SCENARIOS).slice(0, 5); // e.g., 5 scenarios per game
    setGameScenarios(scenarios);
    setCurrentScenarioIndex(0);
    setCorrectAnswers(0);
    setIsGameComplete(false);
    setFeedback(null);
  }, []); // Run once on component mount

  // --- HANDLER FOR USER'S CHOICE ---
  const handleChoice = (choice: ScenarioCategory) => {
    if (feedback) return; // Prevent multiple clicks during feedback

    const currentScenario = gameScenarios[currentScenarioIndex];
    if (currentScenario.category === choice) {
      setFeedback("correct");
      setCorrectAnswers(prev => prev + 1);
      correctSound.current.play();
    } else {
      setFeedback("incorrect");
      wrongSound.current.play();
    }

    // Move to next scenario after a short delay
    setTimeout(() => {
      setFeedback(null);
      if (currentScenarioIndex < gameScenarios.length - 1) {
        setCurrentScenarioIndex(prev => prev + 1);
      } else {
        setIsGameComplete(true);
        clapSound.current.play();
        confetti({ particleCount: 200, spread: 80, origin: { y: 0.6 } });
      }
    }, 1500);
  };

  const currentScenario = gameScenarios[currentScenarioIndex];

  // --- RENDER ---
  if (isGameComplete) {
    return (
      <div className="p-6 text-center flex flex-col items-center justify-center h-full text-white">
        <CheckCircle size={80} className="text-green-400 mb-4" />
        <h2 className="text-3xl font-bold">Safety Superstar!</h2>
        <p className="text-lg mb-6">You know how to stay safe!</p>
        <p className="text-xl">You got {correctAnswers} out of {gameScenarios.length} correct!</p>
        <button
          onClick={onComplete}
          className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors mt-6"
        >
          Finish Lesson
        </button>
      </div>
    );
  }

  if (!currentScenario) {
    return <div className="p-4 text-center text-white text-xl">Loading scenarios...</div>;
  }

  return (
    <div className="p-4 flex flex-col h-full text-white overflow-hidden justify-between items-center">
      <h3 className="text-2xl font-bold text-center mb-6">Safe or Unsafe?</h3>

      {/* Scenario Display */}
      <div className="flex flex-col items-center justify-center bg-white/10 rounded-xl p-6 shadow-lg mb-8 w-11/12 max-w-md min-h-[250px] transition-all duration-300 ease-in-out">
        <p className="text-6xl mb-4 animate-pop">{currentScenario.emoji}</p>
        <p className="text-2xl font-semibold text-center">{currentScenario.description}</p>
      </div>

      {/* Feedback Overlay */}
      {feedback && (
        <div className={`absolute inset-0 flex items-center justify-center z-10 transition-opacity duration-300 ${feedback ? 'opacity-100' : 'opacity-0'}`}>
          <div className={`text-9xl rounded-full p-8 ${feedback === 'correct' ? 'text-green-400 bg-green-900/70' : 'text-red-400 bg-red-900/70'}`}>
            {feedback === 'correct' ? '✅' : '❌'}
          </div>
        </div>
      )}

      {/* Choice Buttons */}
      <div className="w-full grid grid-cols-2 gap-4 max-w-md">
        <button
          onClick={() => handleChoice("safe")}
          disabled={!!feedback}
          className={`flex flex-col items-center justify-center p-4 rounded-xl text-white font-bold text-xl
            transition-all duration-200 shadow-md transform
            ${currentScenario.category === 'safe' && feedback === 'correct' ? 'bg-green-500 scale-105' : 'bg-green-700 hover:bg-green-600 active:scale-95'}
            ${currentScenario.category !== 'safe' && feedback === 'incorrect' ? 'bg-red-500 scale-105' : ''}
            ${feedback && 'opacity-70 cursor-not-allowed'}
          `}
        >
          <ThumbsUp size={48} className="mb-2" />
          Safe!
        </button>
        <button
          onClick={() => handleChoice("unsafe")}
          disabled={!!feedback}
          className={`flex flex-col items-center justify-center p-4 rounded-xl text-white font-bold text-xl
            transition-all duration-200 shadow-md transform
            ${currentScenario.category === 'unsafe' && feedback === 'correct' ? 'bg-red-500 scale-105' : 'bg-red-700 hover:bg-red-600 active:scale-95'}
            ${currentScenario.category !== 'unsafe' && feedback === 'incorrect' ? 'bg-red-500 scale-105' : ''}
            ${feedback && 'opacity-70 cursor-not-allowed'}
          `}
        >
          <ThumbsDown size={48} className="mb-2" />
          Unsafe!
        </button>
      </div>
    </div>
  );
};

export default SafeOrUnsafeGame;
