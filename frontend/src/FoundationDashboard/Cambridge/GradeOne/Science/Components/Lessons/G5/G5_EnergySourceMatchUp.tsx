import React, { useState, useEffect, useRef, useCallback } from "react";
import { CheckCircle } from "lucide-react";
import confetti from "canvas-confetti";

interface LessonProps {
  onComplete: () => void;
}

// --- DATA STRUCTURES ---

type EnergySourceType = 'sun' | 'wind' | 'outlet';
type ItemType = 'plant' | 'pinwheel' | 'lamp';

type EnergySource = {
  type: EnergySourceType;
  label: string;
  emoji: string;
};

type PoweredItem = {
  type: ItemType;
  label: string;
  emoji: string;
  correctSource: EnergySourceType;
  powered: boolean; // To track game state
};

// --- GAME DATA ---

const SOURCES: EnergySource[] = [
  { type: 'sun', label: 'Sun', emoji: '☀️' },
  { type: 'wind', label: 'Wind', emoji: '💨' },
  { type: 'outlet', label: 'Outlet', emoji: '🔌' },
];

const INITIAL_ITEMS: PoweredItem[] = [
  { type: 'plant', label: 'Plant', emoji: '🌱', correctSource: 'sun', powered: false },
  { type: 'pinwheel', label: 'Pinwheel', emoji: '🌬️', correctSource: 'wind', powered: false },
  { type: 'lamp', label: 'Lamp', emoji: '💡', correctSource: 'outlet', powered: false },
];

// --- COMPONENT ---

const EnergySourceGame: React.FC<LessonProps> = ({ onComplete }) => {
  // --- STATE ---
  const [items, setItems] = useState<PoweredItem[]>(INITIAL_ITEMS);
  const [activeSource, setActiveSource] = useState<EnergySourceType | null>(null);
  const [isGameComplete, setIsGameComplete] = useState(false);
  const [wrongItem, setWrongItem] = useState<ItemType | null>(null);
  const [prompt, setPrompt] = useState("Select an energy source.");

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
  const resetGame = useCallback(() => {
    // Create new array copies to ensure state update
    setItems(INITIAL_ITEMS.map(item => ({ ...item, powered: false })));
    setActiveSource(null);
    setIsGameComplete(false);
    setWrongItem(null);
    setPrompt("Select an energy source.");
  }, []);

  useEffect(() => {
    resetGame();
  }, [resetGame]);

  // --- GAME LOGIC ---

  // Check for game completion
  useEffect(() => {
    const allPowered = items.every(item => item.powered);
    if (allPowered && !isGameComplete) {
      setTimeout(() => {
        setIsGameComplete(true);
        clapSound.current.play();
        confetti({ particleCount: 200, spread: 80, origin: { y: 0.6 } });
      }, 1000); // Wait for last animation
    }
  }, [items, isGameComplete, clapSound]);

  const handleSourceClick = (sourceType: EnergySourceType) => {
    setActiveSource(sourceType);
    const source = SOURCES.find(s => s.type === sourceType);
    setPrompt(`What does the ${source?.label.toLowerCase()} power?`);
    setWrongItem(null);
  };

  const handleItemClick = (clickedItem: PoweredItem) => {
    if (!activeSource || clickedItem.powered) return;

    if (activeSource === clickedItem.correctSource) {
      // --- CORRECT ---
      correctSound.current.play();
      setItems(prevItems =>
        prevItems.map(item =>
          item.type === clickedItem.type ? { ...item, powered: true } : item
        )
      );
      setActiveSource(null);
      setPrompt("Powered up! Select another source.");
    } else {
      // --- WRONG ---
      wrongSound.current.play();
      setWrongItem(clickedItem.type);
      setActiveSource(null);
      setPrompt("That's not the right source. Try again.");
      setTimeout(() => {
        setWrongItem(null);
        if (!activeSource) setPrompt("Select an energy source.");
      }, 1000);
    }
  };

  // --- RENDER ---
  if (isGameComplete) {
    return (
      <div className="p-6 text-center flex flex-col items-center justify-center h-full text-white">
        <CheckCircle size={80} className="text-green-400 mb-4" />
        <h2 className="text-3xl font-bold">Great Job!</h2>
        <p className="text-lg mb-6">You matched all the energy sources!</p>
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
      <h3 className="text-2xl font-bold text-center mb-2">Energy Source Match-Up</h3>
      <p className="text-lg text-center text-cyan-300 mb-4 h-12">{prompt}</p>

      {/* Items to Power Area */}
      <div className="relative flex-grow flex flex-col md:flex-row justify-around items-center gap-4 mb-4 min-h-[250px]">
        {items.map((item) => {
          const isWrong = wrongItem === item.type;
          // Highlight if it's the correct target for the active source
          const isTarget = activeSource === item.correctSource && !item.powered;
          
          let poweredClass = '';
          if (item.powered) {
            if (item.type === 'lamp') poweredClass = 'animate-pulse';
            if (item.type === 'pinwheel') poweredClass = 'animate-spin-slow';
            if (item.type === 'plant') poweredClass = 'animate-bounce-slow';
          }

          return (
            <button
              key={item.type}
              onClick={() => handleItemClick(item)}
              disabled={item.powered}
              className={`flex flex-col items-center justify-center p-4 rounded-lg transition-all duration-300 w-36 h-36
                ${item.powered ? 'bg-yellow-500/30 border-2 border-yellow-400' : 'bg-white/10 border-2 border-white/30 border-dashed'}
                ${isWrong ? 'animate-shake' : ''}
                ${isTarget ? 'scale-105 ring-4 ring-blue-400' : ''}
                disabled:opacity-100
              `}
            >
              <span className={`text-7xl ${poweredClass}`}>{item.emoji}</span>
              <span className="text-lg font-bold mt-2">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Energy Source Palette */}
      <div className="flex justify-center items-center gap-3">
        {SOURCES.map((source) => {
          const isActive = activeSource === source.type;
          const isFaded = activeSource && !isActive;

          return (
            <button
              key={source.type}
              onClick={() => handleSourceClick(source.type)}
              className={`flex-1 flex flex-col items-center justify-center p-4 rounded-lg 
                bg-indigo-600 hover:bg-indigo-500
                transition-all duration-200
                ${isActive ? 'scale-105 ring-4 ring-blue-400' : ''}
                ${isFaded ? 'opacity-30' : ''}
              `}
            >
              <span className="text-5xl">{source.emoji}</span>
              <span className="text-xl font-semibold">{source.label}</span>
            </button>
          );
        })}
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

          @keyframes spin-slow {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .animate-spin-slow { animation: spin-slow 3s linear infinite; }

          @keyframes bounce-slow {
            0%, 100% { transform: translateY(-5%); animation-timing-function: cubic-bezier(0.8,0,1,1); }
            50% { transform: translateY(0); animation-timing-function: cubic-bezier(0,0,0.2,1); }
          }
          .animate-bounce-slow { animation: bounce-slow 2s infinite; }
        `}
      </style>
    </div>
  );
};

export default EnergySourceGame;