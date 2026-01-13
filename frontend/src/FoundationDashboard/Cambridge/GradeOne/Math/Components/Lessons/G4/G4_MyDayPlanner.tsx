import React, { useState, useEffect, useRef } from "react";
import { CheckCircle } from "lucide-react";
import confetti from "canvas-confetti";

interface LessonProps {
  onComplete: () => void;
}

// --- DATA STRUCTURES ---

type ItemCategory = 'morning' | 'afternoon' | 'evening';

type GameItem = {
  id: string;
  name: string;
  emoji: string;
  category: ItemCategory;
};

// --- GAME DATA ---

const ALL_GAME_ITEMS: GameItem[] = [
  // Morning
  { id: "wakeup", name: "Waking Up", emoji: "🥱", category: "morning" },
  { id: "breakfast", name: "Breakfast", emoji: "🥞", category: "morning" },
  { id: "brushTeeth", name: "Brush Teeth", emoji: "🦷", category: "morning" },

  // Afternoon
  { id: "lunch", name: "Eating Lunch", emoji: "🥪", category: "afternoon" },
  { id: "school", name: "School", emoji: "🏫", category: "afternoon" },
  { id: "play", name: "Playing", emoji: "⚽", category: "afternoon" },

  // Evening
  { id: "dinner", name: "Dinner", emoji: "🍝", category: "evening" },
  { id: "story", name: "Bedtime Story", emoji: "📖", category: "evening" },
  { id: "sleep", name: "Sleep", emoji: "😴", category: "evening" },
  { id: "bath", name: "Bath Time", emoji: "🛁", category: "evening" },
];

const BINS: { category: ItemCategory; emoji: string; label: string; color: string; highlight: string; }[] = [
  { category: "morning", emoji: "🌅", label: "Morning", color: "bg-orange-400", highlight: "border-orange-200" },
  { category: "afternoon", emoji: "☀️", label: "Afternoon", color: "bg-blue-500", highlight: "border-blue-300" },
  { category: "evening", emoji: "🌙", label: "Evening", color: "bg-indigo-700", highlight: "border-indigo-400" },
];

// Helper to shuffle an array
const shuffleArray = <T,>(array: T[]): T[] => {
  return [...array].sort(() => Math.random() - 0.5);
};

// --- COMPONENT ---

const MyDayPlannerGame: React.FC<LessonProps> = ({ onComplete }) => {
  // --- STATE ---
  const [unsortedItems, setUnsortedItems] = useState<GameItem[]>([]);
  const [sortedItems, setSortedItems] = useState<{ [key in ItemCategory]: GameItem[] }>({ morning: [], afternoon: [], evening: [] });
  const [totalItemCount, setTotalItemCount] = useState(0);
  const [isGameComplete, setIsGameComplete] = useState(false);

  // Drag state
  const [draggingItemId, setDraggingItemId] = useState<string | null>(null);
  const [dragOverBin, setDragOverBin] = useState<ItemCategory | null>(null);

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
    // Select a subset of items for the game
    const gameItems = shuffleArray(ALL_GAME_ITEMS).slice(0, 9); // e.g., 9 items
    setUnsortedItems(gameItems);
    setTotalItemCount(gameItems.length);
    setSortedItems({ morning: [], afternoon: [], evening: [] });
    setIsGameComplete(false);
  }, []); // Run once on component mount

  // --- GAME COMPLETION CHECK ---
  useEffect(() => {
    if (totalItemCount > 0 && unsortedItems.length === 0 && !isGameComplete) {
      setIsGameComplete(true);
      clapSound.current.play();
      confetti({ particleCount: 200, spread: 80, origin: { y: 0.6 } });
    }
  }, [unsortedItems, totalItemCount, isGameComplete, clapSound]);


  // --- DRAG & DROP LOGIC ---

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, item: GameItem) => {
    e.dataTransfer.setData("itemId", item.id);
    setDraggingItemId(item.id);
  };

  const handleDragEnd = () => {
    setDraggingItemId(null);
    setDragOverBin(null);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, category: ItemCategory) => {
    e.preventDefault();
    setDragOverBin(category);
  };

  const handleDragLeave = () => {
    setDragOverBin(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetCategory: ItemCategory) => {
    e.preventDefault();
    setDragOverBin(null);
    const itemId = e.dataTransfer.getData("itemId");
    const draggedItem = unsortedItems.find(item => item.id === itemId);

    if (draggedItem) {
      if (draggedItem.category === targetCategory) {
        correctSound.current.play();
        setSortedItems(prev => ({
          ...prev,
          [targetCategory]: [...prev[targetCategory], draggedItem]
        }));
        setUnsortedItems(prev => prev.filter(item => item.id !== itemId));
      } else {
        wrongSound.current.play();
      }
    }
    setDraggingItemId(null); // Reset dragging state
  };

  // --- MOBILE TOUCH HANDLERS ---
  const handleTouchStart = (_e: React.TouchEvent<HTMLDivElement>, item: GameItem) => {
    setDraggingItemId(item.id);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement | null;
    const binElement = element?.closest("[data-bin-category]") as HTMLElement | null;
    setDragOverBin(binElement?.dataset?.binCategory as ItemCategory | null);
  };

  const handleTouchEnd = (_e: React.TouchEvent<HTMLDivElement>, item: GameItem) => {
    if (dragOverBin) {
      if (item.category === dragOverBin) {
        correctSound.current.play();
        setSortedItems(prev => ({
          ...prev,
          [dragOverBin]: [...prev[dragOverBin], item]
        }));
        setUnsortedItems(prev => prev.filter(i => i.id !== item.id));
      } else {
        wrongSound.current.play();
      }
    }
    setDraggingItemId(null);
    setDragOverBin(null);
  };


  // --- RENDER ---
  if (isGameComplete) {
    return (
      <div className="p-6 text-center flex flex-col items-center justify-center h-full text-white">
        <CheckCircle size={80} className="text-green-400 mb-4" />
        <h2 className="text-3xl font-bold">Great Planning!</h2>
        <p className="text-lg mb-6">You sorted the whole day!</p>
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
      <h3 className="text-2xl font-bold text-center mb-4">My Day Planner</h3>

      {/* Items to Sort Pile */}
      <div className="flex-grow bg-white/10 rounded-lg p-4 mb-4 flex justify-center items-center flex-wrap gap-4 min-h-[150px]">
        {unsortedItems.map((item) => (
          <div
            key={item.id}
            className={`flex flex-col items-center cursor-grab transition-all duration-300 ${
              draggingItemId === item.id ? "opacity-30 scale-125" : "opacity-100"
            }`}
            draggable
            style={{ touchAction: "none" }}
            onDragStart={(e) => handleDragStart(e, item)}
            onDragEnd={handleDragEnd}
            onTouchStart={(e) => handleTouchStart(e, item)}
            onTouchMove={handleTouchMove}
            onTouchEnd={(e) => handleTouchEnd(e, item)}
          >
            <span className="text-6xl">{item.emoji}</span>
            <span className="text-xs font-semibold">{item.name}</span>
          </div>
        ))}
        {unsortedItems.length === 0 && totalItemCount > 0 && (
          <p className="text-xl text-white/70">All sorted!</p>
        )}
      </div>

      {/* Drop Bins Area */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {BINS.map((bin) => (
          <div
            key={bin.category}
            data-bin-category={bin.category}
            onDragOver={(e) => handleDragOver(e, bin.category)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, bin.category)}
            className={`min-h-[200px] rounded-xl p-4 flex flex-col items-center justify-start transition-all duration-200 border-4 border-dashed ${bin.color} ${
              dragOverBin === bin.category ? `${bin.highlight} scale-105 shadow-lg` : "border-white/20"
            }`}
          >
            <span className="text-8xl mb-2">{bin.emoji}</span>
            <p className="text-2xl font-bold">{bin.label}</p>
            {/* Show items already sorted into this bin */}
            <div className="flex flex-wrap justify-center mt-2 gap-1 text-2xl">
              {sortedItems[bin.category].map(item => <span key={item.id} className="p-1">{item.emoji}</span>)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyDayPlannerGame;