import React, { useState, useEffect, useRef } from "react";
import { CheckCircle } from "lucide-react";
import confetti from "canvas-confetti";

interface LessonProps {
  onComplete: () => void;
}

// --- DATA STRUCTURES ---

type HygieneItem = {
  id: string;
  name: string;
  emoji: string;
};

// --- GAME DATA ---

const ALL_ITEMS: HygieneItem[] = [
  { id: "toothbrush", name: "Toothbrush", emoji: "🦷" },
  { id: "soap", name: "Soap", emoji: "🧼" },
  { id: "comb", name: "Comb", emoji: "💈" }, // Using comb emoji
];

// The correct order
const CORRECT_SEQUENCE: string[] = ["toothbrush", "soap", "comb"];

// Helper to shuffle an array
const shuffleArray = <T,>(array: T[]): T[] => {
  return [...array].sort(() => Math.random() - 0.5);
};

// --- COMPONENT ---

const HygieneHeroesGame: React.FC<LessonProps> = ({ onComplete }) => {
  // --- STATE ---
  const [itemsToDrag, setItemsToDrag] = useState<HygieneItem[]>([]);
  const [correctItemsInOrder, setCorrectItemsInOrder] = useState<HygieneItem[]>([]);
  const [nextCorrectItemId, setNextCorrectItemId] = useState<string>(CORRECT_SEQUENCE[0]);
  
  const [isGameComplete, setIsGameComplete] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [characterEmoji, setCharacterEmoji] = useState("🥱"); // Character visual state

  // Drag state
  const [draggingItem, setDraggingItem] = useState<HygieneItem | null>(null);
  const [dragOverZone, setDragOverZone] = useState(false);

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
    setItemsToDrag(shuffleArray(ALL_ITEMS));
    setCorrectItemsInOrder([]);
    setNextCorrectItemId(CORRECT_SEQUENCE[0]);
    setIsGameComplete(false);
    setFeedback(null);
    setCharacterEmoji("🥱");
  }, []); // Run once on component mount

  // --- GAME LOGIC ---

  const processDrop = (droppedItem: HygieneItem) => {
    if (feedback || !droppedItem) return;

    if (droppedItem.id === nextCorrectItemId) {
      correctSound.current.play();
      setFeedback('correct');

      // Move item
      setCorrectItemsInOrder(prev => [...prev, droppedItem]);
      setItemsToDrag(prev => prev.filter(item => item.id !== droppedItem.id));

      const nextIndex = correctItemsInOrder.length + 1;
      
      if (nextIndex < CORRECT_SEQUENCE.length) {
        // More items to go
        setNextCorrectItemId(CORRECT_SEQUENCE[nextIndex]);
      } else {
        // --- GAME COMPLETE ---
        setNextCorrectItemId(""); // No more items
        setIsGameComplete(true);
        setCharacterEmoji("🦸"); // Become a hero
        clapSound.current.play();
        confetti({ particleCount: 200, spread: 80, origin: { y: 0.6 } });
      }

      setTimeout(() => setFeedback(null), 500); // Reset feedback
    } else {
      wrongSound.current.play();
      setFeedback('wrong');
      setTimeout(() => setFeedback(null), 800);
    }
  };

  // --- DRAG & DROP HANDLERS ---
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, item: HygieneItem) => {
    e.dataTransfer.setData("itemId", item.id);
    setDraggingItem(item);
  };

  const handleDragEnd = () => {
    setDraggingItem(null);
    setDragOverZone(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOverZone(true);
  };

  const handleDragLeave = () => {
    setDragOverZone(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOverZone(false);
    const itemId = e.dataTransfer.getData("itemId");
    const droppedItem = ALL_ITEMS.find(item => item.id === itemId);
    if (droppedItem) {
      processDrop(droppedItem);
    }
    setDraggingItem(null);
  };

  // --- TOUCH HANDLERS ---
  const handleTouchStart = (_e: React.TouchEvent<HTMLDivElement>, item: HygieneItem) => {
    setDraggingItem(item);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement | null;
    const dropZone = element?.closest("[data-dropzone]");
    setDragOverZone(!!dropZone);
  };

  const handleTouchEnd = (_e: React.TouchEvent<HTMLDivElement>) => {
    if (dragOverZone && draggingItem) {
      processDrop(draggingItem);
    }
    setDraggingItem(null);
    setDragOverZone(false);
  };

  // --- RENDER ---
  if (isGameComplete) {
    return (
      <div className="p-6 text-center flex flex-col items-center justify-center h-full text-white">
        <CheckCircle size={80} className="text-green-400 mb-4" />
        <h2 className="text-3xl font-bold">Hygiene Hero!</h2>
        <p className="text-lg mb-6">You're all ready for the day!</p>
        <button
          onClick={onComplete}
          className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Finish Lesson
        </button>
      </div>
    );
  }

  const nextItemHint = ALL_ITEMS.find(item => item.id === nextCorrectItemId)?.name;

  return (
    <div className="p-4 flex flex-col h-full text-white overflow-hidden">
      <h3 className="text-2xl font-bold text-center mb-2">Get ready for the day!</h3>
      <p className="text-lg text-center text-cyan-300 mb-4">
        {nextItemHint ? `Next up: ${nextItemHint}` : "All done!"}
      </p>

      {/* Character Drop Zone */}
      <div 
        data-dropzone="true"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative flex-grow flex flex-col items-center justify-center p-4 bg-indigo-800 rounded-xl transition-all duration-200 border-4 border-dashed min-h-[200px]
          ${dragOverZone ? 'border-cyan-400 scale-105' : 'border-white/20'}
          ${feedback === 'wrong' ? 'border-red-500 animate-shake' : ''}
        `}
      >
        <div className="text-9xl">{characterEmoji}</div>
        
        {/* Area for correct items */}
        <div className="absolute bottom-2 left-2 flex gap-2">
          {correctItemsInOrder.map(item => (
            <div key={item.id} className="text-4xl p-2 bg-black/30 rounded-lg">
              {item.emoji}
            </div>
          ))}
        </div>
      </div>

      {/* Items to Drag */}
      <div className="w-full h-32 bg-stone-700 rounded-lg p-4 flex justify-center items-center gap-6 mt-4">
        {itemsToDrag.map(item => (
          <div
            key={item.id}
            draggable
            style={{ touchAction: "none" }}
            onDragStart={(e) => handleDragStart(e, item)}
            onDragEnd={handleDragEnd}
            onTouchStart={(e) => handleTouchStart(e, item)}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className={`flex flex-col items-center justify-center w-20 h-20 bg-blue-500 rounded-lg shadow-lg cursor-grab
              ${draggingItem?.id === item.id ? 'opacity-30 scale-110' : 'opacity-100 hover:bg-blue-400'}
            `}
          >
            <span className="text-4xl">{item.emoji}</span>
            <span className="text-xs font-semibold">{item.name}</span>
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

export default HygieneHeroesGame;
