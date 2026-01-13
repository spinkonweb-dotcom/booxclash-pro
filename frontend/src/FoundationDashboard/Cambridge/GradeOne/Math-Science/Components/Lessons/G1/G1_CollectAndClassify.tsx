import React, { useState, useEffect, useRef } from "react";
import { CheckCircle } from "lucide-react";
import confetti from "canvas-confetti";
import { useSpeech } from "../../../SpeechContext"; // adjust path
interface LessonProps {
  onComplete: () => void;
}

// --- NEW DATA STRUCTURES ---
type GameObject = {
  id: number;
  name: string;
  emoji: string;
  // Criteria for sorting
  color: 'red' | 'blue' | 'yellow' | 'green' | 'other';
  shape: 'circle' | 'square' | 'triangle' | 'other';
  size: 'small' | 'medium' | 'large';
};

// Represents a drop zone "basket"
type Basket = {
  id: string; // e.g., 'red-basket'
  label: string; // e.g., 'Red Things'
  // Defines what this basket accepts
  acceptsProperty: 'color' | 'shape' | 'size';
  acceptsValue: string; // e.g., 'red'
  // Items currently in the basket
  items: GameObject[];
};

// Defines a single level
type LevelConfig = {
  level: number;
  title: string;
  objects: GameObject[];
  baskets: Omit<Basket, 'items'>[]; // Baskets for this level
};

// --- MASTER DATA FOR THE GAME ---

const ALL_GAME_OBJECTS: Record<string, GameObject> = {
  apple: { id: 1, name: "Apple", emoji: "🍎", color: "red", shape: "circle", size: "small" },
  ball: { id: 2, name: "Ball", emoji: "🏀", color: "red", shape: "circle", size: "small" },
  book: { id: 3, name: "Book", emoji: "📖", color: "blue", shape: "square", size: "medium" },
  jeans: { id: 4, name: "Jeans", emoji: "👖", color: "blue", shape: "other", size: "large" },
  pizza: { id: 5, name: "Pizza", emoji: "🍕", color: "yellow", shape: "triangle", size: "medium" },
  cheese: { id: 6, name: "Cheese", emoji: "🧀", color: "yellow", shape: "triangle", size: "small" },
  window: { id: 7, name: "Window", emoji: "🖼️", color: "other", shape: "square", size: "medium" },
  box: { id: 8, name: "Box", emoji: "📦", color: "other", shape: "square", size: "medium" },
  leaf: { id: 9, name: "Leaf", emoji: "🍃", color: "green", shape: "other", size: "small" },
  frog: { id: 10, name: "Frog", emoji: "🐸", color: "green", shape: "other", size: "small" },
  car: { id: 11, name: "Car", emoji: "🚗", color: "red", shape: "other", size: "large" },
  whale: { id: 12, name: "Whale", emoji: "🐋", color: "blue", shape: "other", size: "large" },
  sun: { id: 13, name: "Sun", emoji: "☀️", color: "yellow", shape: "circle", size: "large" },
  moon: { id: 14, name: "Moon", emoji: "🌙", color: "yellow", shape: "circle", size: "large" },
  elephant: { id: 15, name: "Elephant", emoji: "🐘", color: "other", shape: "other", size: "large" },
  mouse: { id: 16, name: "Mouse", emoji: "🐁", color: "other", shape: "other", size: "small" },
  stopSign: { id: 17, name: "Stop Sign", emoji: "🛑", color: "red", shape: "other", size: "small" },
  clock: { id: 18, name: "Clock", emoji: "⏰", color: "other", shape: "circle", size: "medium" },
};

// Definition of the levels
const LEVEL_CONFIGS: LevelConfig[] = [
  {
    level: 1,
    title: "Level 1: Sort by Color (6 items)",
    objects: [
      ALL_GAME_OBJECTS.apple,
      ALL_GAME_OBJECTS.book,
      ALL_GAME_OBJECTS.car,
      ALL_GAME_OBJECTS.jeans,
      ALL_GAME_OBJECTS.stopSign,
      ALL_GAME_OBJECTS.whale,
    ],
    baskets: [
      { id: 'red', label: 'Red', acceptsProperty: 'color', acceptsValue: 'red' },
      { id: 'blue', label: 'Blue', acceptsProperty: 'color', acceptsValue: 'blue' },
    ],
  },
  {
    level: 2,
    title: "Level 2: Sort by Shape (9 items)",
    objects: [
      ALL_GAME_OBJECTS.ball,
      ALL_GAME_OBJECTS.book,
      ALL_GAME_OBJECTS.pizza,
      ALL_GAME_OBJECTS.cheese,
      ALL_GAME_OBJECTS.window,
      ALL_GAME_OBJECTS.box,
      ALL_GAME_OBJECTS.sun,
      ALL_GAME_OBJECTS.moon,
      ALL_GAME_OBJECTS.clock,
    ],
    baskets: [
      { id: 'circle', label: 'Circles', acceptsProperty: 'shape', acceptsValue: 'circle' },
      { id: 'square', label: 'Squares', acceptsProperty: 'shape', acceptsValue: 'square' },
      { id: 'triangle', label: 'Triangles', acceptsProperty: 'shape', acceptsValue: 'triangle' },
    ],
  },
  {
    level: 3,
    title: "Level 3: Sort by Size (12 items)",
    objects: [
      ALL_GAME_OBJECTS.apple,
      ALL_GAME_OBJECTS.jeans,
      ALL_GAME_OBJECTS.cheese,
      ALL_GAME_OBJECTS.leaf,
      ALL_GAME_OBJECTS.frog,
      ALL_GAME_OBJECTS.mouse,
      ALL_GAME_OBJECTS.car,
      ALL_GAME_OBJECTS.whale,
      ALL_GAME_OBJECTS.sun,
      ALL_GAME_OBJECTS.moon,
      ALL_GAME_OBJECTS.elephant,
      ALL_GAME_OBJECTS.stopSign,
    ],
    baskets: [
      { id: 'small', label: 'Small', acceptsProperty: 'size', acceptsValue: 'small' },
      { id: 'large', label: 'Large', acceptsProperty: 'size', acceptsValue: 'large' },
    ],
  },
];

// --- NEW COMPONENT ---

const CollectAndClassifyGame: React.FC<LessonProps> = ({ onComplete }) => {
  // --- STATE ---
  const [level, setLevel] = useState(1);
  const [currentConfig, setCurrentConfig] = useState<LevelConfig>(LEVEL_CONFIGS[0]);
  const [unsortedObjects, setUnsortedObjects] = useState<GameObject[]>([]);
  const [baskets, setBaskets] = useState<Basket[]>([]);

  const [dragOverHome, setDragOverHome] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [isLevelComplete, setIsLevelComplete] = useState(false);

  // --- SOUNDS (identical to original) ---
  const createMockAudio = () => ({
    play: () => { /* console.log("Audio play mock") */ },
    pause: () => { /* console.log("Audio pause mock") */ },
    currentTime: 0,
  });

  const correctSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/correct.mp3") : createMockAudio());
  const wrongSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/incorrect.mp3") : createMockAudio());
  const clapSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/clap.mp3") : createMockAudio());
    const { speak, stop } = useSpeech();
    const instructions = "Hi in this lesson we will Collect and Classify different objects! So lets start by sorting by Color."
      useEffect(() => {
        speak({ text: instructions });
        return stop; // stop when unmounting
      }, []);// ✅ Core drop logic
  // --- LEVEL SETUP ---
  useEffect(() => {
    const config = LEVEL_CONFIGS.find(l => l.level === level);
    if (config) {
      setCurrentConfig(config);
      // Shuffle objects for variety each time
      setUnsortedObjects(config.objects.sort(() => 0.5 - Math.random()));
      // Initialize empty baskets based on config
      setBaskets(config.baskets.map(b => ({ ...b, items: [] })));
      setIsLevelComplete(false);
    }
  }, [level]);

  // --- GAME COMPLETION LOGIC ---
  useEffect(() => {
    // Check for level completion
    // We add `baskets.length > 0` as a guard to ensure this effect
    // doesn't run on the initial render before the level is set up.
    if (baskets.length > 0 && unsortedObjects.length === 0 && !isLevelComplete) {
      setIsLevelComplete(true);
      clapSound.current.play();
      confetti({ particleCount: 200, spread: 80, origin: { y: 0.6 } });
    }
  }, [unsortedObjects, isLevelComplete, baskets]); // Add baskets dependency

  // --- CORE DROP LOGIC (Adapted) ---
  const processDropLogic = (object: GameObject, basketId: string) => {
    const basket = baskets.find(b => b.id === basketId);
    if (!basket) return;

    // Check if the object's property matches the basket's requirement
    const criteria = basket.acceptsProperty;
    const value = basket.acceptsValue;

    // @ts-ignore - Accessing property dynamically
    if (object[criteria] === value) {
      // CORRECT
      correctSound.current.play();
      setUnsortedObjects((prev) => prev.filter((obj) => obj.id !== object.id));
      // Add item to the correct basket
      setBaskets((prevBaskets) =>
        prevBaskets.map((b) =>
          b.id === basketId ? { ...b, items: [...b.items, object] } : b
        )
      );
    } else {
      // WRONG
      wrongSound.current.play();
    }
  };

  // --- DRAG & DROP HANDLERS (Adapted) ---
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, obj: GameObject) => {
    e.dataTransfer.setData("objectId", obj.id.toString());
    setDraggingId(obj.id);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDragOverHome(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, basketId: string) => {
    e.preventDefault();
    setDragOverHome(null);
    setDraggingId(null);

    const objectId = parseInt(e.dataTransfer.getData("objectId"));
    const object = unsortedObjects.find((o) => o.id === objectId);

    if (object) {
      processDropLogic(object, basketId);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, basketId: string) => {
    e.preventDefault();
    setDragOverHome(basketId);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOverHome(null);
  };

  // --- TOUCH HANDLERS (Adapted) ---
  const handleTouchStart = (_e: React.TouchEvent<HTMLDivElement>, obj: GameObject) => {
    setDraggingId(obj.id);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement | null;
    // Find the closest basket
    const dropZone = element?.closest("[data-basket-id]") as HTMLElement | null;

    if (dropZone?.dataset?.basketId) {
      setDragOverHome(dropZone.dataset.basketId);
    } else {
      setDragOverHome(null);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>, obj: GameObject) => {
    setDraggingId(null);
    setDragOverHome(null);

    const touch = e.changedTouches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement | null;
    const dropZone = element?.closest("[data-basket-id]") as HTMLElement | null;

    if (dropZone?.dataset?.basketId) {
      processDropLogic(obj, dropZone.dataset.basketId);
    }
  };

  // --- LEVEL NAVIGATION ---
  const handleNextLevelOrComplete = () => {
    const maxLevel = LEVEL_CONFIGS.length;
    if (level < maxLevel) {
      setLevel(prev => prev + 1);
    } else {
      onComplete(); // Call the prop for final completion
    }
  };

  // --- RENDER ---

  // Handle Level Completion Screen
  if (isLevelComplete) {
    const isFinalLevel = level === LEVEL_CONFIGS.length;
    return (
      <div className="p-6 text-center flex flex-col items-center justify-center h-full text-white">
        <CheckCircle size={80} className="text-green-400 mb-4" />
        <h2 className="text-3xl font-bold">Level {level} Complete!</h2>
        <p className="text-lg mb-6">You sorted all the objects correctly!</p>
        <button
          onClick={handleNextLevelOrComplete}
          className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
        >
          {isFinalLevel ? "Continue Adventure" : "Next Level"}
        </button>
      </div>
    );
  }

  // Helper for dynamic grid columns
  const gridColsClass = baskets.length === 3 ? "grid-cols-3" : "grid-cols-2";

  // Main Game Screen
  return (
    <div className="p-4 flex flex-col h-full text-white">
      <h3 className="text-2xl font-bold text-center mb-4">{currentConfig.title}</h3>

      {/* Objects to drag */}
      <div className="flex-grow bg-white/10 rounded-lg p-4 mb-4 flex justify-center items-center flex-wrap gap-4 min-h-[150px]">
        {unsortedObjects.map((obj) => (
          <div
            key={obj.id}
            className={`text-6xl cursor-grab transition-all duration-200 ${
              draggingId === obj.id ? "opacity-30 scale-125" : "opacity-100"
            }`}
            draggable
            style={{ touchAction: "none" }}
            onDragStart={(e) => handleDragStart(e, obj)}
            onDragEnd={handleDragEnd}
            onTouchStart={(e) => handleTouchStart(e, obj)}
            onTouchMove={handleTouchMove}
            onTouchEnd={(e) => handleTouchEnd(e, obj)}
          >
            {obj.emoji}
          </div>
        ))}
      </div>

      {/* Drop Zones (Baskets) */}
      <div className={`grid ${gridColsClass} gap-4`}>
        {baskets.map((basket) => (
          <div
            key={basket.id}
            data-basket-id={basket.id}
            onDragOver={(e) => handleDragOver(e, basket.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, basket.id)}
            className={`min-h-[120px] rounded-lg p-2 border-2 border-dashed relative flex flex-col justify-start items-center transition-all duration-200 bg-black/30 ${
              dragOverHome === basket.id
                ? `bg-white/30 scale-105 shadow-lg border-blue-300`
                : "border-white/20"
            }`}
          >
            {/* Label for the basket */}
            <span className="text-xl font-bold opacity-50 absolute top-2 pointer-events-none">
              {basket.label}
            </span>
            {/* Container for dropped items */}
            <div className="flex flex-wrap justify-center items-center gap-2 pt-10">
              {basket.items.map((obj) => (
                <div key={obj.id} className="text-3xl z-10 pointer-events-none">
                  {obj.emoji}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CollectAndClassifyGame;
