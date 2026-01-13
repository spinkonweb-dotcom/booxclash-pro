import React, { useState, useEffect, useRef } from "react";
import { CheckCircle } from "lucide-react";
import confetti from "canvas-confetti";
import { useSpeech } from "../../../SpeechContext"; // adjust path
interface LessonProps {
  onComplete: () => void;
}

// --- DATA STRUCTURES FOR THIS GAME ---

// Represents a group of items to be counted
type ItemGroup = {
  uid: string; // e.g., "g1"
  itemEmoji: string;
  count: number;
};

// Represents a draggable number card
type NumberCard = {
  uid: string; // e.g., "n3"
  number: number;
};

// Defines a single level set
type LevelSet = {
  id: number;
  title: string;
  groups: ItemGroup[];
  numberCards: NumberCard[];
};

// State for a group in the game
type GroupState = ItemGroup & {
  matchedBy: number | null; // Stores the matched number (e.g., 3)
};

// State for a number card in the game
type NumberCardState = NumberCard & {
  isMatched: boolean;
};

// --- LEVEL SETS FOR THIS GAME ---
const LEVEL_SETS: LevelSet[] = [
  {
    id: 1,
    title: "Drag the number to the matching group (0-6)",
    groups: [
      { uid: "g1", itemEmoji: "🍎", count: 3 },
      { uid: "g2", itemEmoji: "🚗", count: 1 },
      { uid: "g3", itemEmoji: "🐸", count: 5 },
      { uid: "g4", itemEmoji: "📦", count: 0 },
    ],
    numberCards: [
      { uid: "n0", number: 0 },
      { uid: "n1", number: 1 },
      { uid: "n2", number: 2 },
      { uid: "n3", number: 3 },
      { uid: "n4", number: 4 },
      { uid: "n5", number: 5 },
      { uid: "n6", number: 6 },
    ],
  },
  {
    id: 2,
    title: "Drag the number to the matching group (0-10)",
    groups: [
      { uid: "g5", itemEmoji: "🏀", count: 7 },
      { uid: "g6", itemEmoji: "🍕", count: 4 },
      { uid: "g7", itemEmoji: "🐘", count: 2 },
      { uid: "g8", itemEmoji: "☀️", count: 9 },
    ],
    numberCards: [
      { uid: "n0", number: 0 },
      { uid: "n1", number: 1 },
      { uid: "n2", number: 2 },
      { uid: "n3", number: 3 },
      { uid: "n4", number: 4 },
      { uid: "n5", number: 5 },
      { uid: "n6", number: 6 },
      { uid: "n7", number: 7 },
      { uid: "n8", number: 8 },
      { uid: "n9", number: 9 },
      { uid: "n10", number: 10 },
    ],
  },
];


// --- NEW COMPONENT ---

const AssignNumeralsGame: React.FC<LessonProps> = ({ onComplete }) => {
  // --- STATE ---
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const [isGameComplete, setIsGameComplete] = useState(false);
  const [isLevelComplete, setIsLevelComplete] = useState(false);

  // State for the items and targets in the current level
  const [levelGroups, setLevelGroups] = useState<GroupState[]>([]);
  const [levelNumbers, setLevelNumbers] = useState<NumberCardState[]>([]);

  // State for drag interactions
  const [draggingNumber, setDraggingNumber] = useState<number | null>(null);
  const [dragOverGroupId, setDragOverGroupId] = useState<string | null>(null);

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
    const instructions = "Hi, in this lesson you will learn to match numbers to groups. Connect or drag the correct numeral to the group that shows that quantity."
      useEffect(() => {
        speak({ text: instructions });
        return stop; // stop when unmounting
      }, []);// ✅ Core drop logic

  // --- LEVEL SETUP ---
  useEffect(() => {
    const levelData = LEVEL_SETS[currentLevelIndex];
    
    // Initialize groups with matchedBy: null
    setLevelGroups(levelData.groups.map(g => ({ ...g, matchedBy: null })));
    
    // Initialize numbers with isMatched: false
    setLevelNumbers(levelData.numberCards.map(n => ({ ...n, isMatched: false })));

    setIsLevelComplete(false);
  }, [currentLevelIndex]);

  // --- GAME COMPLETION LOGIC ---
  useEffect(() => {
    // Check for level completion
    if (levelGroups.length === 0 || isLevelComplete) return;

    const allMatched = levelGroups.every(g => g.matchedBy !== null);

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
        } else {
          // Game complete
          setIsGameComplete(true);
          clapSound.current.play();
        }
      }, 2000);
    }
  }, [levelGroups, currentLevelIndex, isLevelComplete]);


  // --- CORE DROP LOGIC ---
  const processDropLogic = (draggedNumber: number, targetGroup: GroupState) => {
    if (targetGroup.matchedBy !== null) {
      // Target is already full
      wrongSound.current.play();
      return;
    }

    if (draggedNumber === targetGroup.count) {
      // Correct Match
      correctSound.current.play();
      
      // Find the card that was dragged
      const draggedCard = levelNumbers.find(n => n.number === draggedNumber);
      if (!draggedCard || draggedCard.isMatched) {
        // Card already used or not found (shouldn't happen)
        wrongSound.current.play();
        return;
      }
      
      // Update numbers
      setLevelNumbers(prev =>
        prev.map(n => (n.number === draggedNumber ? { ...n, isMatched: true } : n))
      );
      
      // Update groups
      setLevelGroups(prev =>
        prev.map(g => (g.uid === targetGroup.uid ? { ...g, matchedBy: draggedNumber } : g))
      );
    } else {
      // Wrong Match
      wrongSound.current.play();
    }
  };

  // --- DESKTOP DRAG HANDLERS ---
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, card: NumberCardState) => {
    e.dataTransfer.setData("draggedNumber", card.number.toString());
    setDraggingNumber(card.number);
  };

  const handleDragEnd = () => {
    setDraggingNumber(null);
    setDragOverGroupId(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, group: GroupState) => {
    e.preventDefault();
    setDragOverGroupId(null);
    setDraggingNumber(null);

    const draggedNumber = parseInt(e.dataTransfer.getData("draggedNumber"));
    
    if (!isNaN(draggedNumber)) {
      processDropLogic(draggedNumber, group);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, group: GroupState) => {
    e.preventDefault();
    if (group.matchedBy === null) {
      setDragOverGroupId(group.uid);
    }
  };

  const handleDragLeave = () => {
    setDragOverGroupId(null);
  };

  // --- MOBILE TOUCH HANDLERS ---
  const handleTouchStart = (_e: React.TouchEvent<HTMLDivElement>, card: NumberCardState) => {
    setDraggingNumber(card.number);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement | null;
    const targetElement = element?.closest("[data-group-uid]") as HTMLElement | null;

    if (targetElement?.dataset?.groupUid) {
      const groupUid = targetElement.dataset.groupUid;
      const group = levelGroups.find(g => g.uid === groupUid);
      if (group && group.matchedBy === null) {
        setDragOverGroupId(group.uid);
      } else {
        setDragOverGroupId(null);
      }
    } else {
      setDragOverGroupId(null);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>, card: NumberCardState) => {
    setDraggingNumber(null);
    setDragOverGroupId(null);

    const touch = e.changedTouches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement | null;
    const targetElement = element?.closest("[data-group-uid]") as HTMLElement | null;

    if (targetElement?.dataset?.groupUid) {
      const groupUid = targetElement.dataset.groupUid;
      const group = levelGroups.find(g => g.uid === groupUid);
      if (group) {
        processDropLogic(card.number, group);
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
        <h2 className="text-3xl font-bold">You Can Count!</h2>
        <p className="text-lg mb-6">Great job matching the numbers!</p>
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
  const getGroupClass = (group: GroupState) => {
    if (group.matchedBy !== null) {
      return "bg-green-500/30 border-green-400"; // Matched
    }
    if (dragOverGroupId === group.uid) {
      return "bg-blue-500/50 border-blue-300 scale-105"; // Dragging over
    }
    return "bg-white/10 border-white/20"; // Default
  };

  // Main Game Screen
  return (
    <div className="p-4 flex flex-col h-full text-white">
      <h3 className="text-2xl font-bold text-center mb-4">{currentLevel.title}</h3>

      {/* Row 1: Drop Targets (Groups) */}
      <div className="flex flex-wrap justify-center items-center gap-4 p-4 min-h-[150px] w-full bg-white/5 rounded-lg mb-4">
        {levelGroups.map((g) => (
          <div
            key={g.uid}
            data-group-uid={g.uid}
            onDragOver={(e) => handleDragOver(e, g)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, g)}
            className={`min-w-[100px] min-h-[100px] rounded-lg border-2 border-dashed flex flex-wrap justify-center items-center p-3 text-4xl transition-all duration-200 ${getGroupClass(g)}`}
          >
            {g.matchedBy !== null
              ? ( // Matched: Show the number
                <span className="font-bold text-6xl">{g.matchedBy}</span>
              ) : ( // Not matched: Show the items
                g.count > 0 
                  ? Array.from({ length: g.count }, (_, i) => <span key={i}>{g.itemEmoji}</span>)
                  : <span className="text-2xl opacity-50">(Empty)</span>
              )
            }
          </div>
        ))}
      </div>
      
      {/* Divider */}
      <div className="w-4/5 h-px bg-white/20 rounded-full mx-auto my-2"></div>

      {/* Row 2: Draggable Items (Numbers) */}
      <div className="flex flex-wrap justify-center items-center gap-3 p-4 min-h-[100px] w-full">
        {levelNumbers.map((n) => (
          !n.isMatched && ( // Only show if not matched
            <div
              key={n.uid}
              className={`w-16 h-16 bg-blue-600 rounded-lg flex justify-center items-center text-3xl font-bold cursor-grab transition-all duration-200 ${
                draggingNumber === n.number ? "opacity-30 scale-125" : "opacity-100 hover:bg-blue-700"
              }`}
              draggable
              style={{ touchAction: "none" }}
              onDragStart={(e) => handleDragStart(e, n)}
              onDragEnd={handleDragEnd}
              onTouchStart={(e) => handleTouchStart(e, n)}
              onTouchMove={handleTouchMove}
              onTouchEnd={(e) => handleTouchEnd(e, n)}
            >
              {n.number}
            </div>
          )
        ))}
      </div>

    </div>
  );
};

export default AssignNumeralsGame;
