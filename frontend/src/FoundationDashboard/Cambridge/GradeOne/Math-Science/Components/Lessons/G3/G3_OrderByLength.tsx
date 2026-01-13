import React, { useState, useEffect, useRef, useCallback } from "react";
import { CheckCircle, RotateCcw } from "lucide-react";
import confetti from "canvas-confetti";

interface LessonProps {
  onComplete: () => void;
}

// --- DATA STRUCTURES ---

type Brush = {
  id: number;
  length: number; // Used for logic
  heightClass: string; // Tailwind class for visual
  colorClass: string;
};

type GameRound = {
  level: number;
  items: Brush[];
};

// --- GAME DATA ---
const ALL_ROUNDS: GameRound[] = [
  {
    level: 1,
    items: [
      { id: 1, length: 1, heightClass: "h-24", colorClass: "bg-red-500" },
      { id: 2, length: 2, heightClass: "h-32", colorClass: "bg-blue-500" },
      { id: 3, length: 3, heightClass: "h-40", colorClass: "bg-yellow-500" },
    ],
  },
  {
    level: 2,
    items: [
      { id: 4, length: 2, heightClass: "h-32", colorClass: "bg-blue-500" },
      { id: 5, length: 4, heightClass: "h-48", colorClass: "bg-green-500" },
      { id: 6, length: 1, heightClass: "h-24", colorClass: "bg-red-500" },
      { id: 7, length: 3, heightClass: "h-40", colorClass: "bg-yellow-500" },
    ],
  },
  {
    level: 3,
    items: [
      { id: 8, length: 3, heightClass: "h-40", colorClass: "bg-yellow-500" },
      { id: 9, length: 1, heightClass: "h-24", colorClass: "bg-red-500" },
      { id: 10, length: 5, heightClass: "h-56", colorClass: "bg-purple-500" },
      { id: 11, length: 2, heightClass: "h-32", colorClass: "bg-blue-500" },
      { id: 12, length: 4, heightClass: "h-48", colorClass: "bg-green-500" },
    ],
  },
];

// Helper to shuffle an array
const shuffleArray = <T,>(array: T[]): T[] => {
  return [...array].sort(() => Math.random() - 0.5);
};

// --- COMPONENT ---

const OrderByLengthGame: React.FC<LessonProps> = ({ onComplete }) => {
  // --- STATE ---
  const [gameRounds] = useState<GameRound[]>(ALL_ROUNDS);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [, setCurrentRound] = useState<GameRound>(gameRounds[0]);

  const [unsortedBrushes, setUnsortedBrushes] = useState<Brush[]>([]);
  const [shelfSlots, setShelfSlots] = useState<(Brush | null)[]>([]);
  
  const [isGameComplete, setIsGameComplete] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

  // Drag state
  const [draggingBrush, setDraggingBrush] = useState<Brush | null>(null);
  const [dragSource, setDragSource] = useState<'pile' | 'shelf' | null>(null);
  const [dragSourceIndex, setDragSourceIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [dragOverPile, setDragOverPile] = useState(false); // New state to track dragging over the pile

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
  const loadRound = useCallback((roundIndex: number) => {
    const round = gameRounds[roundIndex];
    setCurrentRound(round);
    setUnsortedBrushes(shuffleArray(round.items));
    setShelfSlots(Array(round.items.length).fill(null));
    setFeedback(null);
  }, [gameRounds]);

  useEffect(() => {
    loadRound(currentRoundIndex);
  }, [currentRoundIndex, loadRound]);

  // --- GAME LOGIC ---
  const handleNextRound = () => {
    if (currentRoundIndex < gameRounds.length - 1) {
      setCurrentRoundIndex(prev => prev + 1);
    } else {
      setIsGameComplete(true);
      clapSound.current.play();
      confetti({ particleCount: 200, spread: 80, origin: { y: 0.6 } });
    }
  };

  const handleCheckAnswer = () => {
    if (feedback) return;

    // Check if shelf is full
    if (shelfSlots.some(slot => slot === null)) {
      wrongSound.current.play();
      setFeedback('wrong'); // Incomplete
      setTimeout(() => setFeedback(null), 1000);
      return;
    }

    // Check order
    let isCorrect = true;
    for (let i = 0; i < shelfSlots.length - 1; i++) {
      if ((shelfSlots[i] as Brush).length > (shelfSlots[i + 1] as Brush).length) {
        isCorrect = false;
        break;
      }
    }

    if (isCorrect) {
      correctSound.current.play();
      setFeedback('correct');
      setTimeout(handleNextRound, 1500);
    } else {
      wrongSound.current.play();
      setFeedback('wrong');
      setTimeout(() => setFeedback(null), 1000);
    }
  };

  const handleClear = () => {
    loadRound(currentRoundIndex);
  };

  // --- DRAG & DROP HANDLERS ---

  // Resets all drag-related state
  const resetDragState = () => {
    setDraggingBrush(null);
    setDragSource(null);
    setDragSourceIndex(null);
    setDragOverIndex(null);
    setDragOverPile(false);
  };

  const onDragStart = (brush: Brush, source: 'pile' | 'shelf', index: number) => {
    setDraggingBrush(brush);
    setDragSource(source);
    setDragSourceIndex(index);
    setFeedback(null);
  };

  const onDragEnd = () => {
    // onDragEnd fires after onDrop.
    // If onDrop was successful, draggingBrush will be null.
    // If it's *not* null, the drop was unsuccessful (e.g., dropped outside).
    if (draggingBrush && dragSource === 'shelf' && dragSourceIndex !== null) {
      // Return item to shelf slot if it was dragged from there and dropped nowhere
      setShelfSlots(prev => {
        const newSlots = [...prev];
        if (newSlots[dragSourceIndex] === null) { // Only put back if slot is still empty
          newSlots[dragSourceIndex] = draggingBrush;
        }
        return newSlots;
      });
    }
    // Always reset state on drag end
    resetDragState();
  };

  // --- Shelf Drop Handlers ---
  const onDragOverShelf = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
    setDragOverPile(false);
  };
  
  const onDragLeaveShelf = () => {
    setDragOverIndex(null);
  };

  const onDropOnShelf = (dropIndex: number) => {
    if (!draggingBrush) return;

    const brushToDrop = draggingBrush;
    const brushInSlot = shelfSlots[dropIndex];

    if (dragSource === 'pile') {
      // Case 1: Pile -> Shelf
      setUnsortedBrushes(prev => prev.filter(b => b.id !== brushToDrop.id));
      setShelfSlots(prev => {
        const newSlots = [...prev];
        newSlots[dropIndex] = brushToDrop;
        return newSlots;
      });
      if (brushInSlot) { // If shelf slot was occupied, return item to pile
        setUnsortedBrushes(prev => [...prev, brushInSlot]);
      }
    } else if (dragSource === 'shelf' && dragSourceIndex !== null) {
      // Case 2: Shelf -> Shelf (Swap)
      setShelfSlots(prev => {
        const newSlots = [...prev];
        newSlots[dropIndex] = brushToDrop;
        newSlots[dragSourceIndex] = brushInSlot; // brushInSlot can be null
        return newSlots;
      });
    }

    resetDragState(); // Drop was successful, reset
  };

  // --- Pile Drop Handlers ---
  const onDragOverPile = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOverPile(true);
    setDragOverIndex(null);
  };

  const onDragLeavePile = () => {
    setDragOverPile(false);
  };

  const onDropOnPile = () => {
    if (!draggingBrush || dragSource === 'pile') {
      // If not dragging, or already in the pile, do nothing
      resetDragState();
      return;
    }

    // Case 3: Shelf -> Pile
    if (dragSource === 'shelf' && dragSourceIndex !== null) {
      setShelfSlots(prev => {
        const newSlots = [...prev];
        newSlots[dragSourceIndex] = null; // Remove from shelf
        return newSlots;
      });
      setUnsortedBrushes(prev => [...prev, draggingBrush]); // Add to pile
    }
    
    resetDragState(); // Drop was successful, reset
  };


  // --- TOUCH HANDLERS ---
  const onTouchStart = (_e: React.TouchEvent<HTMLDivElement>, brush: Brush, source: 'pile' | 'shelf', index: number) => {
    onDragStart(brush, source, index);
  };
  
  const onTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!draggingBrush) return;
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement | null;
    const shelfSlot = element?.closest("[data-slot-index]") as HTMLElement | null;
    const pileElement = element?.closest("[data-pile]") as HTMLElement | null;

    if (shelfSlot?.dataset?.slotIndex) {
      setDragOverIndex(parseInt(shelfSlot.dataset.slotIndex));
      setDragOverPile(false);
    } else if (pileElement) {
      setDragOverIndex(null);
      setDragOverPile(true);
    } else {
      setDragOverIndex(null);
      setDragOverPile(false);
    }
  };
  
  const onTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!draggingBrush) return;
    
    // Find element at touch end
    const touch = e.changedTouches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement | null;
    const shelfSlot = element?.closest("[data-slot-index]") as HTMLElement | null;
    const pileElement = element?.closest("[data-pile]") as HTMLElement | null;

    if (shelfSlot?.dataset?.slotIndex) {
      onDropOnShelf(parseInt(shelfSlot.dataset.slotIndex));
    } else if (pileElement) {
      onDropOnPile();
    } else {
      // Unsuccessful drop (outside), call onDragEnd to return item if needed
      onDragEnd();
    }

    // Ensure state is reset even if onDragEnd doesn't run
    resetDragState();
  };

  // --- RENDER ---
  if (isGameComplete) {
    return (
      <div className="p-6 text-center flex flex-col items-center justify-center h-full text-white">
        <CheckCircle size={80} className="text-green-400 mb-4" />
        <h2 className="text-3xl font-bold">Perfectly Ordered!</h2>
        <p className="text-lg mb-6">You lined them all up correctly!</p>
        <button
          onClick={onComplete}
          className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Finish Lesson
        </button>
      </div>
    );
  }

  // Helper component for a single brush
  const BrushVisual: React.FC<{ brush: Brush, onDragStart: (e: any) => void, onTouchStart: (e: any) => void, isDragging: boolean }> = 
    ({ brush, onDragStart, onTouchStart, isDragging }) => (
    <div
      draggable
      onDragStart={onDragStart}
      onTouchStart={onTouchStart}
      className={`flex flex-col items-center cursor-grab ${isDragging ? 'opacity-30' : ''}`}
    >
      <div className={`w-3 h-4 ${brush.colorClass.replace('bg-', 'bg-opacity-75')} rounded-t-sm`} />
      <div className={`w-6 ${brush.heightClass} ${brush.colorClass} rounded-b-md border-2 border-black/20 shadow-md`} />
    </div>
  );

  return (
    <div
      className="p-4 flex flex-col h-full text-white overflow-hidden"
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <h3 className="text-2xl font-bold text-center mb-2">Line 'Em Up!</h3>
      <p className="text-lg text-center text-cyan-300 mb-4">Drag the paintbrushes to the shelf from shortest to longest.</p>

      {/* Jumbled Pile */}
      <div 
        data-pile="true"
        className={`w-full min-h-[150px] bg-white/10 rounded-lg p-4 flex justify-center items-end flex-wrap gap-4
          ${dragOverPile ? 'bg-white/20' : ''}
        `}
        onDragOver={onDragOverPile}
        onDragLeave={onDragLeavePile}
        onDrop={onDropOnPile}
      >
        {unsortedBrushes.map((brush, index) => (
          <BrushVisual
            key={brush.id}
            brush={brush}
            isDragging={draggingBrush?.id === brush.id}
            onDragStart={(_e) => onDragStart(brush, 'pile', index)}
            onTouchStart={(e) => onTouchStart(e, brush, 'pile', index)}
          />
        ))}
        {unsortedBrushes.length === 0 && (
          <p className="text-white/70">Pile is empty!</p>
        )}
      </div>

      {/* Shelf (Drop Zones) */}
      <div className={`w-full h-56 bg-amber-800/80 rounded-lg p-4 flex justify-around items-end gap-2 mt-6 border-b-8 border-amber-900
        ${feedback === 'correct' ? 'border-green-500' : ''}
        ${feedback === 'wrong' ? 'border-red-500 animate-shake' : ''}
      `}
      >
        {shelfSlots.map((brush, index) => (
          <div
            key={index}
            data-slot-index={index}
            onDragOver={(e) => onDragOverShelf(e, index)}
            onDragLeave={onDragLeaveShelf}
            onDrop={() => onDropOnShelf(index)}
            className={`w-20 h-full flex items-end justify-center rounded-lg transition-colors
              ${dragOverIndex === index ? 'bg-black/30' : 'bg-black/10'}
            `}
          >
            {brush && (
              <BrushVisual
                brush={brush}
                isDragging={draggingBrush?.id === brush.id}
                onDragStart={(_e) => onDragStart(brush, 'shelf', index)}
                onTouchStart={(e) => onTouchStart(e, brush, 'shelf', index)}
              />
            )}
          </div>
        ))}
      </div>
      
      {/* Control Buttons */}
      <div className="grid grid-cols-2 gap-4 mt-4">
        <button
          onClick={handleClear}
          className="flex items-center justify-center gap-2 bg-gray-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-gray-600 transition-colors"
        >
          <RotateCcw size={20} /> Clear
        </button>
        <button
          onClick={handleCheckAnswer}
          disabled={feedback === 'correct'}
          className="bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-500"
        >
          Check Answer
        </button>
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

export default OrderByLengthGame;


