import React, { useState, useEffect, useRef } from "react";
import { CheckCircle } from "lucide-react";
import confetti from "canvas-confetti";

interface LessonProps {
  onComplete: () => void;
}

// --- DATA STRUCTURES ---

type ComparisonObject = {
  id: string;
  emoji: string;
  name: string;
  length: 'short' | 'long'; // Relative length for the comparison
  widthClass: string; // Tailwind CSS class for visual representation
};

type GameRound = {
  id: string;
  objects: [ComparisonObject, ComparisonObject]; // Always two objects
  questionType: 'longer' | 'shorter';
  correctObjectId: string;
};

// --- GAME DATA ---
const ALL_COMPARISON_PAIRS: [ComparisonObject, ComparisonObject][] = [
  [
    { id: "pencil_short", emoji: "✏️", name: "Short Pencil", length: "short", widthClass: "w-24" },
    { id: "snake_long", emoji: "🐍", name: "Long Snake", length: "long", widthClass: "w-48" },
  ],
  [
    { id: "worm_short", emoji: "🪱", name: "Short Worm", length: "short", widthClass: "w-28" },
    { id: "ruler_long", emoji: "📏", name: "Long Ruler", length: "long", widthClass: "w-56" },
  ],
  [
    { id: "candle_short", emoji: "🕯️", name: "Short Candle", length: "short", widthClass: "w-20" },
    { id: "torch_long", emoji: "🔦", name: "Long Torch", length: "long", widthClass: "w-40" },
  ],
  [
    { id: "finger_short", emoji: "🤏", name: "Short Finger", length: "short", widthClass: "w-24" },
    { id: "arm_long", emoji: "💪", name: "Long Arm", length: "long", widthClass: "w-48" },
  ],
  [
    { id: "tooth_short", emoji: "🦷", name: "Short Tooth", length: "short", widthClass: "w-16" },
    { id: "bone_long", emoji: "🦴", name: "Long Bone", length: "long", widthClass: "w-32" },
  ],
  // --- New pairs added below ---
  [
    { id: "sock_short", emoji: "🧦", name: "Short Sock", length: "short", widthClass: "w-24" },
    { id: "scarf_long", emoji: "🧣", name: "Long Scarf", length: "long", widthClass: "w-48" },
  ],
  [
    { id: "bus_short", emoji: "🚌", name: "Short Bus", length: "short", widthClass: "w-32" },
    { id: "train_long", emoji: "🚂", name: "Long Train", length: "long", widthClass: "w-64" },
  ],
  [
    { id: "boat_short", emoji: "⛵", name: "Short Boat", length: "short", widthClass: "w-32" },
    { id: "ship_long", emoji: "🚢", name: "Long Ship", length: "long", widthClass: "w-64" },
  ],
  [
    { id: "key_short", emoji: "🔑", name: "Short Key", length: "short", widthClass: "w-20" },
    { id: "bat_long", emoji: "🏏", name: "Long Bat", length: "long", widthClass: "w-40" },
  ],
  [
    { id: "ant_short", emoji: "🐜", name: "Short Ant", length: "short", widthClass: "w-16" },
    { id: "lizard_long", emoji: "🦎", name: "Long Lizard", length: "long", widthClass: "w-32" },
  ],
];

// Helper to shuffle an array
const shuffleArray = <T,>(array: T[]): T[] => {
  return [...array].sort(() => Math.random() - 0.5);
};

// Function to generate game rounds
const generateGameRounds = (): GameRound[] => {
  const rounds: GameRound[] = [];
  const shuffledPairs = shuffleArray(ALL_COMPARISON_PAIRS);

  shuffledPairs.forEach((pair, index) => {
    // Determine question type randomly (longer or shorter)
    const questionType: 'longer' | 'shorter' = Math.random() > 0.5 ? 'longer' : 'shorter';
    
    // Determine the correct object based on question type
    let correctObject: ComparisonObject;
    if (questionType === 'longer') {
      correctObject = pair[0].length === 'long' ? pair[0] : pair[1];
    } else { // 'shorter'
      correctObject = pair[0].length === 'short' ? pair[0] : pair[1];
    }

    rounds.push({
      id: `round-${index}`,
      objects: pair,
      questionType: questionType,
      correctObjectId: correctObject.id,
    });
  });
  return rounds;
};

// --- COMPONENT ---

const ShortOrLongGame: React.FC<LessonProps> = ({ onComplete }) => {
  // --- STATE ---
  const [gameRounds, setGameRounds] = useState<GameRound[]>([]);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [currentRound, setCurrentRound] = useState<GameRound | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [isGameComplete, setIsGameComplete] = useState(false);

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
    const rounds = generateGameRounds();
    setGameRounds(rounds);
    setCurrentRoundIndex(0);
    if (rounds.length > 0) {
      setCurrentRound(rounds[0]);
    }
  }, []);

  // Update current round when index changes
  useEffect(() => {
    if (gameRounds.length > 0 && currentRoundIndex < gameRounds.length) {
      setCurrentRound(gameRounds[currentRoundIndex]);
      setFeedback(null);
      setSelectedObjectId(null);
    } else if (currentRoundIndex >= gameRounds.length && gameRounds.length > 0) {
      setIsGameComplete(true);
      clapSound.current.play();
      confetti({ particleCount: 200, spread: 80, origin: { y: 0.6 } });
    }
  }, [currentRoundIndex, gameRounds, clapSound]);

  // --- GAME LOGIC ---
  const handleObjectClick = (objectId: string) => {
    if (feedback || !currentRound) return; // Prevent multiple clicks or clicks while feedback is shown

    setSelectedObjectId(objectId);

    if (objectId === currentRound.correctObjectId) {
      correctSound.current.play();
      setFeedback('correct');
      setTimeout(() => {
        setCurrentRoundIndex(prev => prev + 1);
      }, 1000);
    } else {
      wrongSound.current.play();
      setFeedback('wrong');
      setTimeout(() => {
        setFeedback(null); // Clear wrong feedback after a short delay
        setSelectedObjectId(null);
      }, 1000);
    }
  };

  // --- RENDER ---
  if (isGameComplete) {
    return (
      <div className="p-6 text-center flex flex-col items-center justify-center h-full text-white">
        <CheckCircle size={80} className="text-green-400 mb-4" />
        <h2 className="text-3xl font-bold">Excellent Comparisons!</h2>
        <p className="text-lg mb-6">You master identifying what's short and long!</p>
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

  const questionText = `Which is ${currentRound.questionType}?`;

  return (
    <div className="p-4 flex flex-col h-full text-white">
      <h3 className="text-2xl font-bold text-center mb-4">{questionText}</h3>

      {/* Container now stacks vertically on small screens (flex-col) and horizontally on medium+ (md:flex-row) */}
      <div className="flex-grow flex flex-col md:flex-row items-center justify-around gap-4 p-2">
        {currentRound.objects.map(obj => (
          <div
            key={obj.id}
            onClick={() => handleObjectClick(obj.id)}
            // Cards take full width on small screens (w-full, max-w-sm) and auto width on medium+
            className={`flex flex-col items-center p-3 rounded-xl transition-all duration-300 w-full max-w-sm md:w-auto md:max-w-none
              ${feedback === null ? 'cursor-pointer hover:scale-105 hover:bg-white/10' : ''}
              ${selectedObjectId === obj.id && feedback === 'correct' ? 'bg-green-600 shadow-lg scale-110' : ''}
              ${selectedObjectId === obj.id && feedback === 'wrong' ? 'bg-red-600 shadow-lg animate-shake' : ''}
              ${selectedObjectId !== obj.id && feedback !== null ? 'opacity-50' : ''}
              border-2 ${selectedObjectId === obj.id ? (feedback === 'correct' ? 'border-green-400' : 'border-red-400') : 'border-white/20'}
            `}
          >
            {/* Emoji container width is still controlled by widthClass */}
            <div className={`flex items-center justify-center bg-gray-700 rounded-full h-20 px-4 mb-2 ${obj.widthClass}`}>
              <span className="text-5xl">{obj.emoji}</span>
            </div>
            <p className="text-lg font-semibold text-center">{obj.name}</p>
          </div>
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

export default ShortOrLongGame;

