import React, { useState, useEffect, useRef } from "react";
import { CheckCircle } from "lucide-react";
import confetti from "canvas-confetti";
import { useSpeech } from "../../../SpeechContext"; // adjust path
interface LessonProps {
  onComplete: () => void;
}

// --- DATA STRUCTURES ---

// Re-using the GameObject type from the previous component
type GameObject = {
  id: number;
  name: string;
  emoji: string;
  color: 'red' | 'blue' | 'yellow' | 'green' | 'other';
  shape: 'circle' | 'square' | 'triangle' | 'other';
  size: 'small' | 'medium' | 'large';
};

// --- MASTER DATA (Re-using from previous component) ---
const A: Record<string, GameObject> = { // Shorter alias
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


// --- NEW DATA STRUCTURES FOR THIS GAME ---

// A draggable item instance
type Draggable = {
  uid: number;
  item: GameObject;
};

// A drop target instance
type Target = {
  uid: number;
  acceptsName: string; // e.g., "Apple"
};

// Defines a single level set
type LevelSet = {
  id: number;
  title: string;
  targetEmoji: string; // The emoji for the empty target (e.g., 🧺)
  draggables: Draggable[];
  targets: Target[];
};

// State for a draggable item in the game
type DraggableState = Draggable & {
  isMatched: boolean;
};

// State for a target in the game
type TargetState = Target & {
  matchedBy: number | null; // Stores the uid of the matched draggable
};

// --- LEVEL SETS FOR THIS GAME ---
const LEVEL_SETS: LevelSet[] = [
  {
    id: 1,
    title: "Match the apples to the baskets!",
    targetEmoji: "🧺",
    draggables: [
      { uid: 101, item: A.apple },
      { uid: 102, item: A.apple },
      { uid: 103, item: A.apple },
    ],
    targets: [
      { uid: 201, acceptsName: "Apple" },
      { uid: 202, acceptsName: "Apple" },
      { uid: 203, acceptsName: "Apple" },
    ],
  },
  {
    id: 2,
    title: "Put the books in the boxes.",
    targetEmoji: "📦",
    draggables: [
      { uid: 104, item: A.book },
      { uid: 105, item: A.book },
      { uid: 106, item: A.book },
      { uid: 107, item: A.book },
    ],
    targets: [
      { uid: 204, acceptsName: "Book" },
      { uid: 205, acceptsName: "Book" },
      { uid: 206, acceptsName: "Book" },
      { uid: 207, acceptsName: "Book" },
    ],
  },
  {
    id: 3,
    title: "Help the frogs find their leaves!",
    targetEmoji: "🍃",
    draggables: [
      { uid: 108, item: A.frog },
      { uid: 109, item: A.frog },
      { uid: 110, item: A.frog },
      { uid: 111, item: A.frog },
      { uid: 112, item: A.frog },
    ],
    targets: [
      { uid: 208, acceptsName: "Frog" },
      { uid: 209, acceptsName: "Frog" },
      { uid: 210, acceptsName: "Frog" },
      { uid: 211, acceptsName: "Frog" },
      { uid: 212, acceptsName: "Frog" },
    ],
  },
];


// --- NEW COMPONENT ---

const MatchItOneToOneGame: React.FC<LessonProps> = ({ onComplete }) => {
  // --- STATE ---
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const [isGameComplete, setIsGameComplete] = useState(false);
  const [isLevelComplete, setIsLevelComplete] = useState(false);

  // State for the items and targets in the current level
  const [levelDraggables, setLevelDraggables] = useState<DraggableState[]>([]);
  const [levelTargets, setLevelTargets] = useState<TargetState[]>([]);

  // State for drag interactions
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [dragOverId, setDragOverId] = useState<number | null>(null);

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
    const instructions = "Welcome to Matching items to their baskets! Drag each object into its matching basket."
      useEffect(() => {
        speak({ text: instructions });
        return stop; // stop when unmounting
      }, []);// ✅ Core drop logic
  // --- LEVEL SETUP ---
  useEffect(() => {
    const levelData = LEVEL_SETS[currentLevelIndex];
    
    // Initialize draggables with isMatched: false
    setLevelDraggables(levelData.draggables.map(d => ({ ...d, isMatched: false })));
    
    // Initialize targets with matchedBy: null
    setLevelTargets(levelData.targets.map(t => ({ ...t, matchedBy: null })));

    setIsLevelComplete(false);
  }, [currentLevelIndex]);

  // --- GAME COMPLETION LOGIC ---
  useEffect(() => {
    // Check for level completion
    if (levelTargets.length === 0 || isLevelComplete) return;

    const allMatched = levelTargets.every(t => t.matchedBy !== null);

    if (allMatched) {
      setIsLevelComplete(true);
      correctSound.current.play();
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });

      // Wait, then advance level or end game
      setTimeout(() => {
        const nextLevelIndex = currentLevelIndex + 1;
        if (nextLevelIndex < LEVEL_SETS.length) {
          // Move to next level
          setCurrentLevelIndex(nextLevelIndex);
          // The useEffect[currentLevelIndex] will handle resetting state
        } else {
          // Game complete
          setIsGameComplete(true);
          clapSound.current.play();
        }
      }, 2000);
    }
  }, [levelTargets, currentLevelIndex, isLevelComplete]);


  // --- CORE DROP LOGIC ---
  const processDropLogic = (draggable: DraggableState, target: TargetState) => {
    if (target.matchedBy) {
      // Target is already full
      wrongSound.current.play();
      return;
    }

    if (draggable.item.name === target.acceptsName) {
      // Correct Match
      correctSound.current.play();
      
      // Update draggables
      setLevelDraggables(prev =>
        prev.map(d => (d.uid === draggable.uid ? { ...d, isMatched: true } : d))
      );
      
      // Update targets
      setLevelTargets(prev =>
        prev.map(t => (t.uid === target.uid ? { ...t, matchedBy: draggable.uid } : t))
      );
    } else {
      // Wrong Match
      wrongSound.current.play();
    }
  };

  // --- DESKTOP DRAG HANDLERS ---
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, draggable: DraggableState) => {
    e.dataTransfer.setData("draggableUid", draggable.uid.toString());
    setDraggingId(draggable.uid);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDragOverId(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, target: TargetState) => {
    e.preventDefault();
    setDragOverId(null);
    setDraggingId(null);

    const draggableUid = parseInt(e.dataTransfer.getData("draggableUid"));
    const draggable = levelDraggables.find(d => d.uid === draggableUid);

    if (draggable) {
      processDropLogic(draggable, target);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, target: TargetState) => {
    e.preventDefault();
    if (!target.matchedBy) {
      setDragOverId(target.uid);
    }
  };

  const handleDragLeave = () => {
    setDragOverId(null);
  };

  // --- MOBILE TOUCH HANDLERS ---
  const handleTouchStart = (_e: React.TouchEvent<HTMLDivElement>, draggable: DraggableState) => {
    setDraggingId(draggable.uid);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement | null;
    const targetElement = element?.closest("[data-target-uid]") as HTMLElement | null;

    if (targetElement?.dataset?.targetUid) {
      const targetUid = parseInt(targetElement.dataset.targetUid);
      const target = levelTargets.find(t => t.uid === targetUid);
      if (target && !target.matchedBy) {
        setDragOverId(target.uid);
      } else {
        setDragOverId(null);
      }
    } else {
      setDragOverId(null);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>, draggable: DraggableState) => {
    setDraggingId(null);
    setDragOverId(null);

    const touch = e.changedTouches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement | null;
    const targetElement = element?.closest("[data-target-uid]") as HTMLElement | null;

    if (targetElement?.dataset?.targetUid) {
      const targetUid = parseInt(targetElement.dataset.targetUid);
      const target = levelTargets.find(t => t.uid === targetUid);
      if (target) {
        processDropLogic(draggable, target);
      }
    }
  };

  // --- RENDER ---
  const currentLevel = LEVEL_SETS[currentLevelIndex];

  // Handle Game Completion Screen
  if (isGameComplete) {
    return (
      <div className="p-6 text-center flex flex-col items-center justify-center h-full text-white">
        <CheckCircle size={80} className="text-green-400 mb-4" />
        <h2 className="text-3xl font-bold">You Matched Everything!</h2>
        <p className="text-lg mb-6">Amazing work!</p>
        <button
          onClick={onComplete}
          className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Continue Adventure
        </button>
      </div>
    );
  }

  // Helper function to get target style
  const getTargetClass = (target: TargetState) => {
    if (target.matchedBy) {
      return "bg-green-500/30 border-green-400"; // Matched
    }
    if (dragOverId === target.uid) {
      return "bg-blue-500/50 border-blue-300 scale-105"; // Dragging over
    }
    return "bg-white/10 border-white/20"; // Default
  };

  // Main Game Screen
  return (
    <div className="p-4 flex flex-col h-full text-white">
      <h3 className="text-2xl font-bold text-center mb-4">{currentLevel.title}</h3>

      <div className="flex-grow flex flex-col md:flex-row gap-6 justify-around items-center">
        
        {/* Column 1: Draggable Items */}
        <div className="flex flex-wrap justify-center items-center gap-4 p-4 min-h-[150px] w-full md:w-1/2">
          {levelDraggables.map((d) => (
            !d.isMatched && ( // Only show if not matched
              <div
                key={d.uid}
                className={`text-7xl cursor-grab transition-all duration-200 ${
                  draggingId === d.uid ? "opacity-30 scale-125" : "opacity-100"
                }`}
                draggable
                style={{ touchAction: "none" }}
                onDragStart={(e) => handleDragStart(e, d)}
                onDragEnd={handleDragEnd}
                onTouchStart={(e) => handleTouchStart(e, d)}
                onTouchMove={handleTouchMove}
                onTouchEnd={(e) => handleTouchEnd(e, d)}
              >
                {d.item.emoji}
              </div>
            )
          ))}
        </div>
        
        {/* Divider */}
        <div className="w-1 h-20 md:w-px md:h-4/5 bg-white/20 rounded-full"></div>

        {/* Column 2: Drop Targets */}
        <div className="flex flex-wrap justify-center items-center gap-4 p-4 min-h-[150px] w-full md:w-1/2">
          {levelTargets.map((t) => {
            const matchedDraggable = levelDraggables.find(d => d.uid === t.matchedBy);
            return (
              <div
                key={t.uid}
                data-target-uid={t.uid}
                onDragOver={(e) => handleDragOver(e, t)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, t)}
                className={`w-24 h-24 rounded-lg border-2 border-dashed flex justify-center items-center text-6xl transition-all duration-200 ${getTargetClass(t)}`}
              >
                {matchedDraggable ? matchedDraggable.item.emoji : currentLevel.targetEmoji}
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};

export default MatchItOneToOneGame;
