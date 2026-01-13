import React, { useState, useEffect, useRef } from "react";
import { CheckCircle } from "lucide-react";
import confetti from "canvas-confetti";

interface LessonProps {
  onComplete: () => void;
}

// --- DATA STRUCTURES ---

type GridItem = {
  id: number;
  emoji: string;
  category: 'bird' | 'flower' | 'tree' | 'car' | 'food' | 'toy';
  color: 'red' | 'blue' | 'green' | 'yellow' | 'other';
  sound: 'bird' | null;
};

type GameRound = {
  id: number;
  question: string;
  // A function to check if an item matches the criteria
  criteria: (item: GridItem) => boolean;
  targetCount: number;
  soundCue: 'bird' | null;
};

// --- GAME DATA ---
const ALL_GRID_ITEMS: GridItem[] = [
  { id: 1, emoji: "🐦", category: "bird", color: "blue", sound: "bird" },
  { id: 2, emoji: "🌸", category: "flower", color: "other", sound: null },
  { id: 3, emoji: "🌳", category: "tree", color: "green", sound: null },
  { id: 4, emoji: "🍎", category: "food", color: "red", sound: null },
  { id: 5, emoji: "🚗", category: "car", color: "red", sound: null },
  { id: 6, emoji: "🐦", category: "bird", color: "blue", sound: "bird" },
  { id: 7, emoji: "🌻", category: "flower", color: "yellow", sound: null },
  { id: 8, emoji: "🧸", category: "toy", color: "other", sound: null },
  { id: 9, emoji: "🌳", category: "tree", color: "green", sound: null },
  { id: 10, emoji: "🍓", category: "food", color: "red", sound: null },
  { id: 11, "emoji": "🔵", "category": "toy", "color": "blue", "sound": null },
  { id: 12, "emoji": "🌼", "category": "flower", "color": "other", "sound": null },
  { id: 13, "emoji": "🐦", "category": "bird", "color": "blue", "sound": "bird" },
  { id: 14, "emoji": "🚙", "category": "car", "color": "blue", "sound": null },
  { id: 15, "emoji": "🌳", "category": "tree", "color": "green", "sound": null },
  { id: 16, "emoji": "🌸", "category": "flower", "color": "other", "sound": null },
  { id: 17, "emoji": "🚗", "category": "car", "color": "red", "sound": null },
  { id: 18, "emoji": "🌻", "category": "flower", "color": "yellow", "sound": null },
  { id: 19, "emoji": "🌳", "category": "tree", "color": "green", "sound": null },
  { id: 20, "emoji": "🐦", "category": "bird", "color": "blue", "sound": "bird" },
];

const GAME_ROUNDS: GameRound[] = [
  {
    id: 1,
    question: "How many red things can you see?",
    criteria: (item) => item.color === 'red',
    targetCount: 4,
    soundCue: null,
  },
  {
    id: 2,
    question: "How many birds can you hear?",
    criteria: (item) => item.category === 'bird',
    targetCount: 4,
    soundCue: 'bird',
  },
  {
    id: 3,
    question: "How many flowers can you see?",
    criteria: (item) => item.category === 'flower',
    targetCount: 5,
    soundCue: null,
  },
];

// Helper to shuffle an array
const shuffleArray = <T,>(array: T[]): T[] => {
  return [...array].sort(() => Math.random() - 0.5);
};

// --- COMPONENT ---

const SenseAndCountGame: React.FC<LessonProps> = ({ onComplete }) => {
  // --- STATE ---
  const [gridItems, setGridItems] = useState<GridItem[]>([]);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [currentRound, setCurrentRound] = useState(GAME_ROUNDS[0]);
  
  const [selectedItemIds, setSelectedItemIds] = useState<Set<number>>(new Set());
  const [foundCount, setFoundCount] = useState(0);
  
  const [isGameComplete, setIsGameComplete] = useState(false);
  const [isRoundComplete, setIsRoundComplete] = useState(false);
  const [wrongClickId, setWrongClickId] = useState<number | null>(null);

  // --- SOUNDS ---
  const createMockAudio = (_src?: string) => ({
    play: () => { /* console.log(`Audio play mock: ${src}`) */ },
    pause: () => { /* console.log(`Audio pause mock: ${src}`) */ },
    currentTime: 0,
  });

  const correctSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/correct.mp3") : createMockAudio());
  const wrongSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/incorrect.mp3") : createMockAudio());
  const clapSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/clap.mp3") : createMockAudio());
  // Mock bird sound - in a real app, this would be a real sound file
  const birdSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/bird-tweet.mp3") : createMockAudio("bird"));

  // --- GAME SETUP & FLOW ---
  useEffect(() => {
    setGridItems(shuffleArray(ALL_GRID_ITEMS));
  }, []);

  // Load round
  useEffect(() => {
    const round = GAME_ROUNDS[currentRoundIndex];
    setCurrentRound(round);
    setFoundCount(0);
    setSelectedItemIds(new Set());
    setIsRoundComplete(false);
    setWrongClickId(null);
    
    // Play sound cue if it exists
    if (round.soundCue === 'bird') {
      // Play a few times to simulate an environment
      setTimeout(() => birdSound.current.play(), 500);
      setTimeout(() => birdSound.current.play(), 1500);
    }
  }, [currentRoundIndex]);

  // Check for round completion
  useEffect(() => {
    if (foundCount === currentRound.targetCount) {
      setIsRoundComplete(true);
      clapSound.current.play();
    }
  }, [foundCount, currentRound]);

  // --- INTERACTION ---
  const handleItemClick = (item: GridItem) => {
    if (isRoundComplete || selectedItemIds.has(item.id)) return;

    if (currentRound.criteria(item)) {
      correctSound.current.play();
      setFoundCount(prev => prev + 1);
      setSelectedItemIds(prev => new Set(prev).add(item.id));
    } else {
      wrongSound.current.play();
      setWrongClickId(item.id);
      setTimeout(() => setWrongClickId(null), 500);
    }
  };

  const handleNextRound = () => {
    if (currentRoundIndex < GAME_ROUNDS.length - 1) {
      setCurrentRoundIndex(prev => prev + 1);
    } else {
      setIsGameComplete(true);
      confetti({ particleCount: 200, spread: 80, origin: { y: 0.6 } });
    }
  };

  // --- RENDER ---
  if (isGameComplete) {
    return (
      <div className="p-6 text-center flex flex-col items-center justify-center h-full text-white">
        <CheckCircle size={80} className="text-green-400 mb-4" />
        <h2 className="text-3xl font-bold">Amazing Senses!</h2>
        <p className="text-lg mb-6">You found and counted everything!</p>
        <button
          onClick={onComplete}
          className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Finish Lesson
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 flex flex-col h-full text-white overflow-hidden">
      
      {/* Question Header */}
      <div className="text-center mb-4">
        <h3 className="text-2xl font-bold">{isRoundComplete ? "Great Job!" : currentRound.question}</h3>
        <p className="text-xl text-cyan-300">
          Found: <span className="font-bold">{foundCount}</span> / <span className="font-bold">{currentRound.targetCount}</span>
        </p>
      </div>
      
      {/* "I-Spy" Park Grid */}
      <div className="flex-grow bg-green-800/50 rounded-lg p-3 grid grid-cols-4 md:grid-cols-5 gap-2 md:gap-3 overflow-y-auto">
        {gridItems.map(item => (
          <div
            key={item.id}
            onClick={() => handleItemClick(item)}
            className={`aspect-square bg-white/10 rounded-lg flex items-center justify-center text-4xl
              transition-all duration-200
              ${selectedItemIds.has(item.id) ? 'opacity-30 scale-90' : 'cursor-pointer hover:bg-white/20'}
              ${wrongClickId === item.id ? 'animate-shake bg-red-500' : ''}
            `}
          >
            {/* Show a checkmark if selected correctly */}
            {selectedItemIds.has(item.id) && <span className="absolute text-green-400">✓</span>}
            {item.emoji}
          </div>
        ))}
      </div>

      {/* Next Button */}
      {isRoundComplete && (
        <button
          onClick={handleNextRound}
          className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors mt-4"
        >
          {currentRoundIndex < GAME_ROUNDS.length - 1 ? "Next Round" : "All Done!"}
        </button>
      )}

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

export default SenseAndCountGame;
