import React, { useState, useEffect, useRef, useCallback } from "react";
import { CheckCircle } from "lucide-react";
import confetti from "canvas-confetti";

interface LessonProps {
  onComplete: () => void;
}

// --- DATA STRUCTURES ---

type ItemCategory = 'recycle' | 'compost' | 'trash';

type RecyclingItem = {
  id: string;
  name: string;
  emoji: string;
  category: ItemCategory;
};

// --- GAME DATA ---

const ALL_RECYCLING_ITEMS: RecyclingItem[] = [
  { id: "plasticBottle", name: "Plastic Bottle", emoji: "🍾", category: "recycle" },
  { id: "newspaper", name: "Newspaper", emoji: "📰", category: "recycle" },
  { id: "can", name: "Aluminum Can", emoji: "🥫", category: "recycle" },
  { id: "cardboard", name: "Cardboard Box", emoji: "📦", category: "recycle" },

  { id: "appleCore", name: "Apple Core", emoji: "🍎", category: "compost" },
  { id: "bananaPeel", name: "Banana Peel", emoji: "🍌", category: "compost" },
  { id: "leaf", name: "Leaf", emoji: "🍁", category: "compost" },
  { id: "eggShell", name: "Egg Shell", emoji: "🥚", category: "compost" },

  { id: "candyWrapper", name: "Candy Wrapper", emoji: "🍬", category: "trash" },
  { id: "brokenToy", name: "Broken Toy", emoji: "🧸", category: "trash" },
  { id: "plasticBag", name: "Plastic Bag", emoji: "🛍️", category: "trash" },
  { id: "styrofoam", name: "Styrofoam", emoji: "🥡", category: "trash" },
];

const BINS = [
  { category: "recycle", emoji: "♻️", label: "Recycle", color: "bg-green-600", highlight: "border-green-400" },
  { category: "compost", emoji: "🍂", label: "Compost", color: "bg-amber-600", highlight: "border-amber-400" },
  { category: "trash", emoji: "🗑️", label: "Trash", color: "bg-gray-600", highlight: "border-gray-400" },
];

// --- COMPONENT ---

const RecyclingSortGame: React.FC<LessonProps> = ({ onComplete }) => {
  // --- STATE ---
  const [itemsOnConveyor, setItemsOnConveyor] = useState<RecyclingItem[]>([]);
  const [itemsSorted, setItemsSorted] = useState<RecyclingItem[]>([]);
  const [currentLevelItems, setCurrentLevelItems] = useState<RecyclingItem[]>([]); // All items for the current game
  const [gameStarted, setGameStarted] = useState(false);
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


  // --- GAME SETUP & CONVEYOR BELT LOGIC ---
  useEffect(() => {
    // Shuffle and pick a subset of items for the game
    const shuffledItems = [...ALL_RECYCLING_ITEMS].sort(() => Math.random() - 0.5);
    const gameItems = shuffledItems.slice(0, 8); // e.g., 8 items per game
    setCurrentLevelItems(gameItems);
    setItemsOnConveyor([]); // Clear conveyor initially
    setItemsSorted([]); // Clear sorted items
    setGameStarted(false); // Reset game started state
    setIsGameComplete(false);
  }, []); // Run once on component mount

  const startGame = useCallback(() => {
    setGameStarted(true);
    let itemIndex = 0;
    const interval = setInterval(() => {
      if (itemIndex < currentLevelItems.length) {
        // FIX: Ensure no duplicate items are somehow created during the process
        // This logic is already correct for adding, but helps debug if the issue is elsewhere.
        const itemToAdd = currentLevelItems[itemIndex];
        if (itemToAdd && !itemsOnConveyor.find(item => item.id === itemToAdd.id)) {
            setItemsOnConveyor(prev => [...prev, itemToAdd]);
        }
        itemIndex++;
      } else {
        clearInterval(interval);
      }
    }, 2000); // New item appears every 2 seconds
    return () => clearInterval(interval);
  }, [currentLevelItems, itemsOnConveyor]); // Added itemsOnConveyor as a dependency to check for duplicates

  useEffect(() => {
    if (currentLevelItems.length > 0 && !gameStarted) {
      // Game items are loaded, now start the conveyor belt after a short delay
      const timer = setTimeout(startGame, 1000);
      return () => clearTimeout(timer);
    }
  }, [currentLevelItems, gameStarted, startGame]);


  // --- GAME COMPLETION CHECK ---
  useEffect(() => {
    if (gameStarted && itemsSorted.length === currentLevelItems.length && currentLevelItems.length > 0) {
      setIsGameComplete(true);
      clapSound.current.play();
      confetti({ particleCount: 200, spread: 80, origin: { y: 0.6 } });
    }
  }, [itemsSorted, currentLevelItems, gameStarted]);


  // --- DRAG & DROP LOGIC ---

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, item: RecyclingItem) => {
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
    const draggedItem = currentLevelItems.find(item => item.id === itemId);

    if (draggedItem) {
      if (draggedItem.category === targetCategory) {
        correctSound.current.play();
        setItemsSorted(prev => [...prev, draggedItem]);
        // Removal logic is already safe
        setItemsOnConveyor(prev => prev.filter(item => item && item.id !== itemId));
      } else {
        wrongSound.current.play();
      }
    }
    setDraggingItemId(null); // Reset dragging state
  };

  // --- MOBILE TOUCH HANDLERS (Simplified for conveyor belt) ---
  const handleTouchStart = (_e: React.TouchEvent<HTMLDivElement>, item: RecyclingItem) => {
    setDraggingItemId(item.id);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement | null;
    const binElement = element?.closest("[data-bin-category]") as HTMLElement | null;

    if (binElement?.dataset?.binCategory) {
      setDragOverBin(binElement.dataset.binCategory as ItemCategory);
    } else {
      setDragOverBin(null);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>, item: RecyclingItem) => {
    const touch = e.changedTouches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement | null;
    const binElement = element?.closest("[data-bin-category]") as HTMLElement | null;

    if (binElement?.dataset?.binCategory) {
      const targetCategory = binElement.dataset.binCategory as ItemCategory;
      if (item.category === targetCategory) {
        correctSound.current.play();
        setItemsSorted(prev => [...prev, item]);
        // Removal logic is already safe
        setItemsOnConveyor(prev => prev.filter(i => i && i.id !== item.id));
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
        <h2 className="text-3xl font-bold">World-Class Recycler!</h2>
        <p className="text-lg mb-6">You sorted all the items correctly!</p>
        <button
          onClick={onComplete}
          className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Continue Your Mission
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 flex flex-col h-full text-white overflow-hidden">
      <h3 className="text-2xl font-bold text-center mb-4">Sort the items into the correct bins!</h3>

      {/* Conveyor Belt Area */}
      <div className="relative w-full h-32 bg-stone-700 rounded-lg overflow-hidden border-b-8 border-stone-800 flex items-center mb-6">
        {/* Conveyor Belt Graphics */}
        <div className="absolute inset-0 bg-repeat-x bg-[length:60px_60px] animate-conveyor-belt opacity-30"></div>
        {/* Items on Conveyor */}
        <div className="absolute left-0 top-0 bottom-0 flex items-center px-4">
          {/* FIX for 'Cannot read properties of undefined (reading 'id')':
            Use an explicit map with a check for 'item' to safely skip undefined/null values
            that might have slipped into the state, even with the prior filter.
          */}
          {itemsOnConveyor.map((item) => {
            if (!item || !item.id) {
              // This is the safety check that directly addresses the runtime error
              return null; 
            }
            return (
              <div
                key={item.id} // This is now safe
                className={`text-6xl mx-4 transition-transform duration-300 ${
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
                {item.emoji}
              </div>
            );
          })}
        </div>
      </div>

      {/* Drop Bins Area */}
      <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-4">
        {BINS.map((bin) => (
          <div
            key={bin.category}
            data-bin-category={bin.category}
            onDragOver={(e) => handleDragOver(e, bin.category as ItemCategory)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, bin.category as ItemCategory)}
            className={`min-h-[150px] rounded-xl p-4 flex flex-col items-center justify-center transition-all duration-200 border-4 border-dashed ${bin.color} ${
              dragOverBin === bin.category ? `${bin.highlight} scale-105 shadow-lg` : "border-white/20"
            }`}
          >
            <span className="text-6xl mb-2">{bin.emoji}</span>
            <p className="text-xl font-bold">{bin.label}</p>
            {/* Show items already sorted into this bin */}
            <div className="flex flex-wrap justify-center mt-2 gap-1 text-2xl">
              {itemsSorted
                .filter(item => item.category === bin.category)
                .map(item => <span key={item.id}>{item.emoji}</span>)}
            </div>
          </div>
        ))}
      </div>

      {/* Invisible styling for conveyor belt animation */}
      <style>{`
        @keyframes conveyor-belt {
          from { background-position: 0 0; }
          to { background-position: 60px 0; }
        }
        .animate-conveyor-belt {
          background-image: linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px);
          animation: conveyor-belt 1s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default RecyclingSortGame;