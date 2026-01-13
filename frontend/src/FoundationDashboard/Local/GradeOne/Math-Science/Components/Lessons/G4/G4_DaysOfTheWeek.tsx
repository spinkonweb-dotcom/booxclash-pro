import React, { useState, useEffect, useRef, useCallback } from "react";
import { CheckCircle, RotateCcw } from "lucide-react";
import confetti from "canvas-confetti";

interface LessonProps {
  onComplete: () => void;
}

// --- DATA STRUCTURES ---

type DayItem = {
  id: string;
  name: string;
  emoji: string;
  order: number; // 1 = Sunday, 7 = Saturday
};

// --- GAME DATA ---
const DAYS_OF_WEEK: DayItem[] = [
  { id: 'sun', name: 'Sunday', emoji: '1️⃣', order: 1 },
  { id: 'mon', name: 'Monday', emoji: '2️⃣', order: 2 },
  { id: 'tue', name: 'Tuesday', emoji: '3️⃣', order: 3 },
  { id: 'wed', name: 'Wednesday', emoji: '4️⃣', order: 4 },
  { id: 'thu', name: 'Thursday', emoji: '5️⃣', order: 5 },
  { id: 'fri', name: 'Friday', emoji: '6️⃣', order: 6 },
  { id: 'sat', name: 'Saturday', emoji: '7️⃣', order: 7 },
];

const SUNDAY = DAYS_OF_WEEK.find(d => d.order === 1) as DayItem;
const OTHER_DAYS = DAYS_OF_WEEK.filter(d => d.order > 1);

// Helper to shuffle an array
const shuffleArray = <T,>(array: T[]): T[] => {
  return [...array].sort(() => Math.random() - 0.5);
};

// --- COMPONENT ---

const WeekdayTrainGame: React.FC<LessonProps> = ({ onComplete }) => {
  // --- STATE ---
  const [itemPile, setItemPile] = useState<DayItem[]>([]);
  const [trainSlots, setTrainSlots] = useState<(DayItem | null)[]>([]);
  
  const [isGameComplete, setIsGameComplete] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

  // Drag state
  const [draggingItem, setDraggingItem] = useState<DayItem | null>(null);
  const [dragSource, setDragSource] = useState<'pile' | 'slot' | null>(null);
  const [dragSourceIndex, setDragSourceIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

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
  const loadGame = useCallback(() => {
    setItemPile(shuffleArray(OTHER_DAYS));
    setTrainSlots(Array(OTHER_DAYS.length).fill(null)); // 6 empty slots
    setFeedback(null);
  }, []);

  useEffect(() => {
    loadGame();
  }, [loadGame]);

  // --- GAME LOGIC ---
  const handleCheckAnswer = () => {
    if (feedback) return;

    // Check if all slots are full
    if (trainSlots.some(slot => slot === null)) {
      wrongSound.current.play();
      setFeedback('wrong'); // Incomplete
      setTimeout(() => setFeedback(null), 1000);
      return;
    }

    // Check order
    let isCorrect = true;
    for (let i = 0; i < trainSlots.length; i++) {
      // trainSlots[0] is Monday (order 2)
      // trainSlots[1] is Tuesday (order 3)
      if ((trainSlots[i] as DayItem).order !== i + 2) {
        isCorrect = false;
        break;
      }
    }

    if (isCorrect) {
      correctSound.current.play();
      setFeedback('correct');
      setTimeout(() => {
        setIsGameComplete(true);
        clapSound.current.play();
        confetti({ particleCount: 200, spread: 80, origin: { y: 0.6 } });
      }, 1500);
    } else {
      wrongSound.current.play();
      setFeedback('wrong');
      setTimeout(() => setFeedback(null), 1000);
    }
  };

  const handleClear = () => {
    loadGame();
  };

  // --- DRAG & DROP HANDLERS ---
  const onDragStart = (item: DayItem, source: 'pile' | 'slot', index: number) => {
    setDraggingItem(item);
    setDragSource(source);
    setDragSourceIndex(index);
    setFeedback(null);
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    if (trainSlots[index] === null || trainSlots[index]?.id !== draggingItem?.id) {
      setDragOverIndex(index);
    }
  };
  
  const onDragLeave = () => {
    setDragOverIndex(null);
  };

  const onDrop = (dropIndex: number) => {
    if (!draggingItem || dragSourceIndex === null) return;

    const itemToDrop = draggingItem;
    const itemInSlot = trainSlots[dropIndex];

    // 1. Remove from source
    if (dragSource === 'pile') {
      setItemPile(prev => prev.filter(item => item.id !== itemToDrop.id));
    } else if (dragSource === 'slot') {
      setTrainSlots(prev => {
        const newSlots = [...prev];
        newSlots[dragSourceIndex] = null; // Clear old slot
        return newSlots;
      });
    }

    // 2. Add to new slot
    setTrainSlots(prev => {
      const newSlots = [...prev];
      newSlots[dropIndex] = itemToDrop;
      return newSlots;
    });

    // 3. Handle swapped item
    if (itemInSlot) {
      if (dragSource === 'pile') {
        setItemPile(prev => [...prev, itemInSlot]); // Return to pile
      } else if (dragSource === 'slot') {
        setTrainSlots(prev => {
          const newSlots = [...prev];
          newSlots[dragSourceIndex] = itemInSlot; // Put in old slot
          return newSlots;
        });
      }
    }
    
    resetDragState();
  };

  const onDropPile = () => {
    if (dragSource === 'slot' && draggingItem && dragSourceIndex !== null) {
      // Remove from slot
      setTrainSlots(prev => {
        const newSlots = [...prev];
        newSlots[dragSourceIndex] = null;
        return newSlots;
      });
      // Add back to pile
      setItemPile(prev => [...prev, draggingItem]);
    }
    resetDragState();
  };

  
  const resetDragState = () => {
    setDraggingItem(null);
    setDragSource(null);
    setDragSourceIndex(null);
    setDragOverIndex(null);
  };
  
  // --- TOUCH HANDLERS ---
  const onTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!draggingItem) return;
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement | null;
    const slotElement = element?.closest("[data-slot-index]") as HTMLElement | null;
    if (slotElement?.dataset?.slotIndex) {
      const index = parseInt(slotElement.dataset.slotIndex);
      if (trainSlots[index] === null || trainSlots[index]?.id !== draggingItem?.id) {
        setDragOverIndex(index);
      }
    } else {
      setDragOverIndex(null);
    }
  };
  
  const onTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (dragOverIndex !== null) {
      onDrop(dragOverIndex);
    } else {
      // Check if dropped over pile
      const touch = e.changedTouches[0];
      const element = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement | null;
      if (element?.closest("[data-pile]")) {
        onDropPile();
      }
    }
    resetDragState();
  };
  
  // --- RENDER ---
  if (isGameComplete) {
    return (
      <div className="p-6 text-center flex flex-col items-center justify-center h-full text-white">
        <CheckCircle size={80} className="text-green-400 mb-4" />
        <h2 className="text-3xl font-bold">Great Job!</h2>
        <p className="text-lg mb-6">You put the whole week in order!</p>
        <button
          onClick={onComplete}
          className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Finish Lesson
        </button>
      </div>
    );
  }

  // Helper component for a single card
  const CardVisual: React.FC<{ item: DayItem, onDragStart: (e: any) => void, onTouchStart: (e: any) => void, isDragging: boolean }> = 
    ({ item, onDragStart, onTouchStart, isDragging }) => (
    <div
      draggable
      onDragStart={onDragStart}
      onTouchStart={onTouchStart}
      className={`w-28 h-36 bg-blue-500 rounded-lg flex flex-col items-center justify-center p-2 shadow-lg cursor-grab
        ${isDragging ? 'opacity-30 scale-95' : 'opacity-100'}
      `}
    >
      <span className="text-6xl">{item.emoji}</span>
      <span className="text-sm font-bold text-center mt-1">{item.name}</span>
    </div>
  );
  
  // Helper component for the Sunday Engine
  const EngineVisual: React.FC<{ item: DayItem }> = ({ item }) => (
    <div
      className="w-32 h-36 bg-red-600 rounded-lg flex flex-col items-center justify-center p-2 shadow-lg"
    >
      <span className="text-6xl">🚂</span>
      <span className="text-sm font-bold text-center mt-1">{item.name}</span>
    </div>
  );


  return (
    <div 
      className="p-4 flex flex-col h-full text-white overflow-hidden"
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <h3 className="text-2xl font-bold text-center mb-2">Weekday Train!</h3>
      <p className="text-lg text-center text-cyan-300 mb-4">Drag the days of the week in order after Sunday.</p>

      {/* Jumbled Pile */}
      <div 
        data-pile="true"
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDropPile}
        className="w-full min-h-[160px] bg-white/10 rounded-lg p-4 flex justify-center items-center flex-wrap gap-4"
      >
        {itemPile.map((item, index) => (
          <CardVisual
            key={item.id}
            item={item}
            isDragging={draggingItem?.id === item.id}
            onDragStart={(_e) => onDragStart(item, 'pile', index)}
            onTouchStart={(_e) => onDragStart(item, 'pile', index)} // Re-using onDragStart for touch
          />
        ))}
        {itemPile.length === 0 && (
          <p className="text-white/70">Pile is empty!</p>
        )}
      </div>

      {/* Train (Drop Zones) */}
      <div className={`w-full flex-grow flex justify-center items-center gap-2 mt-6 p-4 rounded-lg overflow-x-auto
        ${feedback === 'correct' ? 'bg-green-700' : ''}
        ${feedback === 'wrong' ? 'bg-red-700 animate-shake' : ''}
      `}>
        {/* Sunday Engine */}
        <EngineVisual item={SUNDAY} />
        
        {/* 6 Droppable Slots */}
        {trainSlots.map((item, index) => (
          <div
            key={index}
            data-slot-index={index}
            onDragOver={(e) => onDragOver(e, index)}
            onDragLeave={onDragLeave}
            onDrop={() => onDrop(index)}
            className={`w-28 h-36 flex-shrink-0 flex items-center justify-center rounded-lg transition-colors
              ${dragOverIndex === index ? 'bg-black/30' : 'bg-black/10'}
            `}
          >
            {item && (
              <CardVisual
                item={item}
                isDragging={draggingItem?.id === item.id}
                onDragStart={(_e) => onDragStart(item, 'slot', index)}
                onTouchStart={(_e) => onDragStart(item, 'slot', index)} // Re-using onDragStart for touch
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

export default WeekdayTrainGame;