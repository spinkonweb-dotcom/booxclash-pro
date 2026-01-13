import React, { useState, useEffect, useRef } from "react";
import { CheckCircle } from "lucide-react";
import confetti from "canvas-confetti";

interface LessonProps {
  onComplete: () => void;
}

// --- DATA STRUCTURES ---

type ItemOrigin = 'natural' | 'man-made';

type SceneryItem = {
  id: string;
  name: string;
  emoji: string;
  origin: ItemOrigin;
};

// --- GAME DATA ---

const ALL_SCENERY_ITEMS: SceneryItem[] = [
  // Natural Items
  { id: "bird", name: "Bird", emoji: "🐦", origin: "natural" },
  { id: "rock", name: "Rock", emoji: "🪨", origin: "natural" },
  { id: "flower", name: "Flower", emoji: "🌸", origin: "natural" },
  { id: "tree", name: "Tree", emoji: "🌳", origin: "natural" },
  { id: "sun", name: "Sun", emoji: "☀️", origin: "natural" },
  { id: "river", name: "River", emoji: "🌊", origin: "natural" },
  { id: "cloud", name: "Cloud", emoji: "☁️", origin: "natural" },
  { id: "moon", name: "Moon", emoji: "🌕", origin: "natural" },

  // Man-Made Items
  { id: "bicycle", name: "Bicycle", emoji: "🚲", origin: "man-made" },
  { id: "car", name: "Car", emoji: "🚗", origin: "man-made" },
  { id: "house", name: "House", emoji: "🏠", origin: "man-made" },
  { id: "bridge", name: "Bridge", emoji: "🌉", origin: "man-made" },
  { id: "robot", name: "Robot", emoji: "🤖", origin: "man-made" },
  { id: "lamp", name: "Lamp", emoji: "💡", origin: "man-made" },
  { id: "phone", name: "Phone", emoji: "📱", origin: "man-made" },
  { id: "watch", name: "Watch", emoji: "⌚", origin: "man-made" },
];

const ENVIRONMENTS: { origin: ItemOrigin; emoji: string; label: string; color: string; highlight: string; }[] = [
  { origin: "natural", emoji: "🌳", label: "Forest", color: "bg-green-700", highlight: "border-lime-400" },
  { origin: "man-made", emoji: "🏙️", label: "City", color: "bg-blue-800", highlight: "border-sky-400" },
];

// --- COMPONENT ---

const ScenerySortGame: React.FC<LessonProps> = ({ onComplete }) => {
  // --- STATE ---
  const [itemsToSort, setItemsToSort] = useState<SceneryItem[]>([]); // Items waiting to be sorted
  // REMOVED: activeItem state is no longer needed
  const [sortedItems, setSortedItems] = useState<{ [key in ItemOrigin]?: SceneryItem[] }>({
    natural: [],
    'man-made': [],
  });
  const [currentLevelItems, setCurrentLevelItems] = useState<SceneryItem[]>([]); // All items for the current game
  const [isGameComplete, setIsGameComplete] = useState(false);
  // REMOVED: gameStartedRef is no longer needed

  // Drag state
  const [draggingItemId, setDraggingItemId] = useState<string | null>(null);
  const [dragOverEnvironment, setDragOverEnvironment] = useState<ItemOrigin | null>(null);

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
    // Shuffle and pick a subset of items for the game
    const shuffledItems = [...ALL_SCENERY_ITEMS].sort(() => Math.random() - 0.5);
    const gameItems = shuffledItems.slice(0, 8); // e.g., 8 items per game
    setCurrentLevelItems(gameItems);
    setItemsToSort(gameItems); // Initially, all game items are in the "to sort" pile
    setSortedItems({ natural: [], 'man-made': [] });
    setIsGameComplete(false);
  }, []); // Run once on component mount

  // --- GAME COMPLETION CHECK ---
  // This is now much simpler. It just checks if the "itemsToSort" list is empty.
  useEffect(() => {
    // Only check if the game has items loaded and isn't already complete
    if (currentLevelItems.length > 0 && !isGameComplete) {
      if (itemsToSort.length === 0) {
        // All items have been sorted!
        setIsGameComplete(true);
        clapSound.current.play();
        confetti({ particleCount: 200, spread: 80, origin: { y: 0.6 } });
      }
    }
  }, [itemsToSort, currentLevelItems, isGameComplete, clapSound]);

  // REMOVED: All spawning logic (spawnNextItem, and related useEffects)

  // --- DRAG & DROP LOGIC ---

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, item: SceneryItem) => {
    e.dataTransfer.setData("itemId", item.id);
    setDraggingItemId(item.id);
  };

  const handleDragEnd = () => {
    setDraggingItemId(null);
    setDragOverEnvironment(null);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, origin: ItemOrigin) => {
    e.preventDefault();
    setDragOverEnvironment(origin);
  };

  const handleDragLeave = () => {
    setDragOverEnvironment(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetOrigin: ItemOrigin) => {
    e.preventDefault();
    setDragOverEnvironment(null);
    const itemId = e.dataTransfer.getData("itemId");
    // Find the item in the *unsorted* list
    const draggedItem = itemsToSort.find(item => item.id === itemId);

    // Removed check for 'activeItem'
    if (draggedItem) { 
      if (draggedItem.origin === targetOrigin) {
        correctSound.current.play();
        // Add to the correct sorted bin
        setSortedItems(prev => ({
          ...prev,
          [targetOrigin]: [...(prev[targetOrigin] || []), draggedItem]
        }));
        // Remove from the unsorted list
        setItemsToSort(prev => prev.filter(item => item.id !== draggedItem.id));
      } else {
        wrongSound.current.play();
      }
    }
    setDraggingItemId(null); // Reset dragging state
  };

  // --- MOBILE TOUCH HANDLERS ---
  const handleTouchStart = (_e: React.TouchEvent<HTMLDivElement>, item: SceneryItem) => {
    setDraggingItemId(item.id);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement | null;
    const envElement = element?.closest("[data-environment-origin]") as HTMLElement | null;

    if (envElement?.dataset?.environmentOrigin) {
      setDragOverEnvironment(envElement.dataset.environmentOrigin as ItemOrigin);
    } else {
      setDragOverEnvironment(null);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>, item: SceneryItem) => {
    const touch = e.changedTouches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement | null;
    const envElement = element?.closest("[data-environment-origin]") as HTMLElement | null;

    // Check if the item is still in the unsorted list
    const isItemUnsorted = itemsToSort.find(i => i.id === item.id);

    if (envElement?.dataset?.environmentOrigin && isItemUnsorted) {
      const targetOrigin = envElement.dataset.environmentOrigin as ItemOrigin;
      if (item.origin === targetOrigin) {
        correctSound.current.play();
        // Add to the correct sorted bin
        setSortedItems(prev => ({
          ...prev,
          [targetOrigin]: [...(prev[targetOrigin] || []), item]
        }));
        // Remove from the unsorted list
        setItemsToSort(prev => prev.filter(i => i.id !== item.id));
      } else {
        wrongSound.current.play();
      }
    }
    setDraggingItemId(null);
    setDragOverEnvironment(null);
  };


  // --- RENDER ---
  if (isGameComplete) {
    return (
      <div className="p-6 text-center flex flex-col items-center justify-center h-full text-white">
        <CheckCircle size={80} className="text-green-400 mb-4" />
        <h2 className="text-3xl font-bold">Amazing!</h2>
        <p className="text-lg mb-6">You're great at knowing what's natural and what's man-made!</p>
        <button
          onClick={onComplete}
          className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Continue Exploring
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 flex flex-col h-full text-white">
      <h3 className="text-2xl font-bold text-center mb-6">Where does it belong?</h3>

      {/* Item to Sort Area - Now displays ALL unsorted items */}
      <div className="flex-1 flex flex-wrap justify-center items-center content-start gap-4 bg-white/10 rounded-lg p-4 mb-6 min-h-[120px]">
        {itemsToSort.map((item) => (
          <div
            key={item.id}
            className={`text-6xl cursor-grab transition-transform duration-300 ${
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
        ))}
      </div>

      {/* Environments / Drop Zones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
        {ENVIRONMENTS.map((env) => (
          <div
            key={env.origin}
            data-environment-origin={env.origin}
            onDragOver={(e) => handleDragOver(e, env.origin)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, env.origin)}
            className={`relative min-h-[180px] rounded-xl p-4 flex flex-col items-center justify-center transition-all duration-200 border-4 border-dashed overflow-hidden
              ${env.color} ${dragOverEnvironment === env.origin ? `${env.highlight} scale-105 shadow-lg` : "border-white/20"}`}
          >
            {/* Background Image / Emoji for visual theme */}
            <span className="absolute inset-0 flex items-center justify-center text-[10rem] opacity-20 pointer-events-none">
                {env.emoji}
            </span>
            <p className="text-2xl font-bold z-10">{env.label}</p>
            <div className="flex flex-wrap justify-center mt-3 gap-1 z-10 text-3xl">
              {sortedItems[env.origin]?.map(item => (
                <span key={item.id}>{item.emoji}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ScenerySortGame;