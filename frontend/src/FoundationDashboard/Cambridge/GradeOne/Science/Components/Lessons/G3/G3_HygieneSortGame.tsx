import React, { useState, useEffect, useRef, useCallback } from "react";
import { CheckCircle } from "lucide-react";
import confetti from "canvas-confetti";

interface LessonProps {
  onComplete: () => void;
}

// --- DATA STRUCTURES ---

type ItemCategory = 'hygiene' | 'toy';

type GameItem = {
  id: string;
  name: string;
  emoji: string;
  category: ItemCategory;
};

// --- GAME DATA ---

const ALL_GAME_ITEMS: GameItem[] = [
  // Hygiene
  { id: "soap", name: "Soap", emoji: "🧼", category: "hygiene" },
  { id: "toothbrush", name: "Toothbrush", emoji: "🦷", category: "hygiene" },
  { id: "shampoo", name: "Shampoo", emoji: "🧴", category: "hygiene" },
  { id: "towel", name: "Towel", emoji: "🧖", category: "hygiene" },
  { id: "comb", name: "Comb", emoji: "💈", category: "hygiene" },
  
  // Toys / Other
  { id: "duck", name: "Rubber Duck", emoji: "🦆", category: "toy" },
  { id: "car", name: "Toy Car", emoji: "🚗", category: "toy" },
  { id: "apple", name: "Apple", emoji: "🍎", category: "toy" }, // Non-hygiene tool
  { id: "ball", name: "Ball", emoji: "🏀", category: "toy" },
  { id: "block", name: "Building Block", emoji: "🧱", category: "toy" },
];

const BINS: { category: ItemCategory; emoji: string; label: string; color: string; highlight: string; }[] = [
  { category: "hygiene", emoji: "🛁", label: "Bathroom Shelf", color: "bg-cyan-600", highlight: "border-cyan-400" },
  { category: "toy", emoji: "🧸", label: "Toy Box", color: "bg-orange-600", highlight: "border-orange-400" },
];

// --- COMPONENT ---

const HygieneSortGame: React.FC<LessonProps> = ({ onComplete }) => {
  // --- STATE ---
  const [itemsOnConveyor, setItemsOnConveyor] = useState<GameItem[]>([]);
  const [itemsSorted, setItemsSorted] = useState<GameItem[]>([]);
  const [currentLevelItems, setCurrentLevelItems] = useState<GameItem[]>([]); // All items for the current game
  const [gameStarted, setGameStarted] = useState(false);
  const [isGameComplete, setIsGameComplete] = useState(false);

  // Drag state
  const [draggingItem, setDraggingItem] = useState<GameItem | null>(null);
  const [dragOverBin, setDragOverBin] = useState<ItemCategory | null>(null);
  const [dragPosition, setDragPosition] = useState<{ x: number, y: number } | null>(null); // For touch ghost

  // --- SOUNDS ---
  // Note: This logic is correct. useRef's argument is only evaluated on initial render.
  type AudioLike = HTMLAudioElement | {
    play: () => void | Promise<void>;
    pause: () => void;
    currentTime: number;
    addEventListener: (...args: any[]) => void;
    removeEventListener: (...args: any[]) => void;
  };

  const createMockAudio = (): AudioLike => ({
    play: () => { /* console.log("Audio play mock") */ },
    pause: () => { /* console.log("Audio pause mock") */ },
    currentTime: 0,
    addEventListener: () => {},
    removeEventListener: () => {},
  });

  const correctSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/correct.mp3") : createMockAudio());
  const wrongSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/incorrect.mp3") : createMockAudio());
  const clapSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/clap.mp3") : createMockAudio());

  // Sound helper to reset and play
  const playSound = useCallback((sound: AudioLike) => {
    // Reset time for both real audio and mock
    try { sound.currentTime = 0; } catch { /* ignore if not writable */ }

    const playResult = sound.play();
    if (playResult && typeof (playResult as Promise<void>).catch === "function") {
      (playResult as Promise<void>).catch(err => console.error("Error playing sound:", err));
    }
  }, []);


  // --- GAME SETUP & CONVEYOR BELT LOGIC ---
  useEffect(() => {
    // Shuffle and pick a subset of items for the game
    const shuffledItems = [...ALL_GAME_ITEMS].sort(() => Math.random() - 0.5);
    const gameItems = shuffledItems.slice(0, 8); // e.g., 8 items per game
    setCurrentLevelItems(gameItems);
    setItemsOnConveyor([]);
    setItemsSorted([]);
    setGameStarted(false);
    setIsGameComplete(false);
  }, []); // Run once on component mount

  const startGame = useCallback(() => {
    setGameStarted(true);
    let itemIndex = 0;
    const interval = setInterval(() => {
      if (itemIndex < currentLevelItems.length) {
        setItemsOnConveyor(prev => [...prev, currentLevelItems[itemIndex]]);
        itemIndex++;
      } else {
        clearInterval(interval);
      }
    }, 2500); // New item appears every 2.5 seconds
    return () => clearInterval(interval);
  }, [currentLevelItems]);

  useEffect(() => {
    if (currentLevelItems.length > 0 && !gameStarted) {
      const timer = setTimeout(startGame, 1000);
      return () => clearTimeout(timer);
    }
  }, [currentLevelItems, gameStarted, startGame]);


  // --- GAME COMPLETION CHECK ---
  useEffect(() => {
    if (gameStarted && itemsSorted.length === currentLevelItems.length && currentLevelItems.length > 0) {
      setIsGameComplete(true);
      playSound(clapSound.current);
      confetti({ particleCount: 200, spread: 80, origin: { y: 0.6 } });
    }
  }, [itemsSorted, currentLevelItems, gameStarted, playSound]);


  // --- DESKTOP DRAG & DROP LOGIC ---

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, item: GameItem) => {
    e.dataTransfer.setData("itemId", item.id);
    setDraggingItem(item);
  };

  const handleDragEnd = () => {
    setDraggingItem(null);
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
    const itemToDrop = currentLevelItems.find(item => item.id === itemId);

    if (itemToDrop) {
      if (itemToDrop.category === targetCategory) {
        playSound(correctSound.current);
        setItemsSorted(prev => [...prev, itemToDrop]);
        setItemsOnConveyor(prev => prev.filter(item => item.id !== itemToDrop.id));
      } else {
        playSound(wrongSound.current);
      }
    }
    setDraggingItem(null); // Reset dragging state
  };

  // --- MOBILE TOUCH D&D LOGIC (REFACTORED) ---

  // These handlers are attached to the window to allow dragging outside the item
  const handleGlobalTouchMove = useCallback((e: TouchEvent) => {
    if (!draggingItem) return;

    // Prevent scrolling while dragging
    e.preventDefault(); 

    const touch = e.touches[0];
    if (touch) {
      setDragPosition({ x: touch.clientX, y: touch.clientY });

      // Check what element is under the finger
      const element = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement | null;
      const binElement = element?.closest("[data-bin-category]") as HTMLElement | null;
      setDragOverBin(binElement?.dataset?.binCategory as ItemCategory | null);
    }
  }, [draggingItem]);

  const handleGlobalTouchEnd = useCallback(() => {
    if (!draggingItem) return;

    if (dragOverBin) {
      if (draggingItem.category === dragOverBin) {
        playSound(correctSound.current);
        setItemsSorted(prev => [...prev, draggingItem]);
        setItemsOnConveyor(prev => prev.filter(i => i.id !== draggingItem.id));
      } else {
        playSound(wrongSound.current);
      }
    }

    // Cleanup
    setDraggingItem(null);
    setDragOverBin(null);
    setDragPosition(null);
    window.removeEventListener("touchmove", handleGlobalTouchMove);
    window.removeEventListener("touchend", handleGlobalTouchEnd);
  }, [draggingItem, dragOverBin, playSound]);

  // This starts the touch drag process
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>, item: GameItem) => {
    // Prevent desktop drag from firing on touch
    e.preventDefault(); 
    setDraggingItem(item);
    
    // Set initial position for the ghost item
    const touch = e.touches[0];
    if (touch) {
        setDragPosition({ x: touch.clientX, y: touch.clientY });
    }

    // Attach global listeners
    window.addEventListener("touchmove", handleGlobalTouchMove, { passive: false });
    window.addEventListener("touchend", handleGlobalTouchEnd, { passive: false });
  };


  // --- RENDER ---
  if (isGameComplete) {
    return (
      <div className="p-6 text-center flex flex-col items-center justify-center h-full text-white">
        <CheckCircle size={80} className="text-green-400 mb-4" />
        <h2 className="text-3xl font-bold">All Cleaned Up!</h2>
        <p className="text-lg mb-6">You sorted all the items correctly!</p>
        <button
          onClick={onComplete}
          className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Finish Lesson
        </button>
      </div>
    );
  }

  // Find the emoji for the item being dragged (for the touch ghost)
  const draggingItemEmoji = draggingItem ? draggingItem.emoji : null;

  return (
    <>
      {/* Ghost item for touch drag */}
      {draggingItemEmoji && dragPosition && (
        <div
          className="pointer-events-none fixed top-0 left-0 text-7xl z-50"
          style={{ transform: `translate(${dragPosition.x - 30}px, ${dragPosition.y - 30}px)` }}
        >
          {draggingItemEmoji}
        </div>
      )}

      <div className="p-4 flex flex-col h-full text-white overflow-hidden">
        <h3 className="text-2xl font-bold text-center mb-4">Sort the items!</h3>

        {/* Conveyor Belt Area */}
        <div className="relative w-full h-32 bg-stone-700 rounded-lg overflow-hidden border-b-8 border-stone-800 flex items-center justify-end mb-6">
          {/* Conveyor Belt Graphics */}
          <div className="absolute inset-0 bg-repeat-x bg-[length:60px_60px] animate-conveyor-belt opacity-30"></div>
          
          {/* Items on Conveyor - now queuing from the right */}
          <div className="relative h-full flex flex-row-reverse items-center px-4 overflow-hidden">
            {itemsOnConveyor.filter(Boolean).map((item) => ( 
              <div
                key={item.id}
                className={`text-6xl mx-4 transition-transform duration-300 cursor-grab active:cursor-grabbing animate-slide-in ${
                  draggingItem?.id === item.id ? "opacity-30 scale-125" : "opacity-100"
                }`}
                draggable
                style={{ touchAction: "none" }} // Prevents page scroll on touch
                onDragStart={(e) => handleDragStart(e, item)}
                onDragEnd={handleDragEnd}
                onTouchStart={(e) => handleTouchStart(e, item)}
                // Touch move and end are now handled globally
              >
                {item.emoji}
              </div>
            ))}
          </div>
        </div>

        {/* Drop Bins Area */}
        <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4">
          {BINS.map((bin) => (
            <div
              key={bin.category}
              data-bin-category={bin.category}
              onDragOver={(e) => handleDragOver(e, bin.category)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, bin.category)}
              className={`min-h-[150px] rounded-xl p-4 flex flex-col items-center justify-start transition-all duration-200 border-4 border-dashed ${bin.color} ${
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

        {/* Invisible styling for animations */}
        <style>
          {`
            @keyframes conveyor-belt {
              from { background-position: 0 0; }
              to { background-position: 60px 0; }
            }
            .animate-conveyor-belt {
              background-image: linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px),
                              linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px);
              animation: conveyor-belt 1s linear infinite;
            }
            
            @keyframes slideInOnBelt {
              from { transform: translateX(40px) scale(0.5); opacity: 0; }
              to { transform: translateX(0) scale(1); opacity: 1; }
            }
            .animate-slide-in {
              animation: slideInOnBelt 0.4s ease-out forwards;
            }
          `}
        </style>
      </div>
    </>
  );
};

export default HygieneSortGame;
