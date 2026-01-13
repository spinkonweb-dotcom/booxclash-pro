import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useSpeech } from "../../../SpeechContext"; // adjust path
// We will inject the CSS for the shake animation
const shakeAnimationCss = `
  .shake {
    animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
  }
  @keyframes shake {
    10%, 90% {
      transform: translate3d(-1px, 0, 0);
    }
    20%, 80% {
      transform: translate3d(2px, 0, 0);
    }
    30%, 50%, 70% {
      transform: translate3d(-4px, 0, 0);
    }
    40%, 60% {
      transform: translate3d(4px, 0, 0);
    }
  }
`;

// Define the shape of the props this component expects
interface LessonProps {
  onComplete: () => void;
}

// A universal type for all items in this review
type ReviewItem = {
  id: number;
  emoji: string;
  color?: 'red' | 'blue';
  shape?: 'square' | 'circle';
  size?: 'big' | 'small';
};

// --- Data for all 4 rounds of the review quiz ---

// Define specific types for each challenge
type ColorChallenge = {
  id: 'color';
  instruction: string;
  targetKey: 'color';
  targetValue: 'red';
  items: ReviewItem[];
};

type ShapeChallenge = {
  id: 'shape';
  instruction: string;
  targetKey: 'shape';
  targetValue: 'square';
  items: ReviewItem[];
};

type SizeChallenge = {
  id: 'size';
  instruction: string;
  targetKey: 'size';
  targetValue: 'big';
  items: ReviewItem[];
};

type QuantityChallenge = {
  id: 'quantity';
  instruction: string;
  targetKey: 'quantity';
  targetValue: number; // Specifically number
  items: ReviewItem[];
};

// A union type of all possible challenges
type QuizChallenge = ColorChallenge | ShapeChallenge | SizeChallenge | QuantityChallenge;

const quizRounds: QuizChallenge[] = [
  {
    id: 'color',
    instruction: 'Put all the RED items in the box!',
    targetKey: 'color',
    targetValue: 'red' as const,
    items: [
      { id: 1, emoji: '🚗', color: 'red' as const }, { id: 2, emoji: '🦋', color: 'blue' as const },
      { id: 3, emoji: '🍎', color: 'red' as const }, { id: 4, emoji: '❤️', color: 'red' as const },
      { id: 5, emoji: '📘', color: 'blue' as const }, { id: 6, emoji: '🍓', color: 'red' as const },
    ],
  },
  {
    id: 'shape',
    instruction: 'Put all the SQUARE items in the box!',
    targetKey: 'shape',
    targetValue: 'square' as const,
    items: [
      { id: 1, emoji: '📖', shape: 'square' as const }, { id: 2, emoji: '🏀', shape: 'circle' as const },
      { id: 3, emoji: '🖼️', shape: 'square' as const }, { id: 4, emoji: '⏰', shape: 'circle' as const },
      { id: 5, emoji: '🎁', shape: 'square' as const }, { id: 6, emoji: '💿', shape: 'circle' as const },
    ],
  },
  {
    id: 'size',
    instruction: 'Put all the BIG items in the box!',
    targetKey: 'size',
    targetValue: 'big' as const,
    items: [
      { id: 1, emoji: '🐘', size: 'big' as const }, { id: 2, emoji: '🐜', size: 'small' as const },
      { id: 3, emoji: '🐋', size: 'big' as const }, { id: 4, emoji: '🦒', size: 'big' as const },
      { id: 5, emoji: '🐁', size: 'small' as const }, { id: 6, emoji: '🐞', size: 'small' as const },
    ],
  },
  {
    id: 'quantity',
    instruction: 'Put exactly 4 items in the box!',
    targetKey: 'quantity',
    targetValue: 4,
    items: [
      { id: 1, emoji: '⭐' }, { id: 2, emoji: '⭐' }, { id: 3, emoji: '⭐' },
      { id: 4, emoji: '⭐' }, { id: 5, emoji: '⭐' }, { id: 6, emoji: '⭐' },
    ],
  },
];

// Mock audio for environments without audio
const createMockAudio = () => ({
  play: () => { /* console.log("Audio play mock") */ },
  pause: () => { /* console.log("Audio pause mock") */ },
  currentTime: 0,
});

const GroupingReview: React.FC<LessonProps> = ({ onComplete }) => {
  const [currentRound, setCurrentRound] = useState(0);
  const [itemsOnScreen, setItemsOnScreen] = useState<ReviewItem[]>([]);
  const [itemsInBox, setItemsInBox] = useState<ReviewItem[]>([]);
  const [isRoundComplete, setIsRoundComplete] = useState(false);
  const [isQuizComplete, setIsQuizComplete] = useState(false);

  // New state for interactivity, based on the example
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [dragOverHome, setDragOverHome] = useState(false);
  const [shakeBox, setShakeBox] = useState(false);

  const currentChallenge = quizRounds[currentRound];

  // Sound refs, based on the example
  const correctSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/correct.mp3") : createMockAudio());
  const wrongSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/incorrect.mp3") : createMockAudio());
  const clapSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/clap.mp3") : createMockAudio());
    const { speak, stop } = useSpeech();
    const instruction = "Well done! Now let's review what we have learnt!"
      useEffect(() => {
        speak({ text: instruction });
        return stop; // stop when unmounting
      }, []);// ✅ Core drop logic

  // This effect sets up the board for each new round
  useEffect(() => {
    // Ensure data is fresh for the round
    const freshItems = currentChallenge.items.map(item => ({ ...item }));
    setItemsOnScreen(freshItems);
    setItemsInBox([]);
    setIsRoundComplete(false);
  }, [currentRound, currentChallenge.items]); // Depend on currentChallenge.items to reset properly

  // This effect checks if the current round is won
  useEffect(() => {
    if (isRoundComplete) return; // Don't re-check if already complete

    let roundWon = false;
    if (currentChallenge.targetKey === 'quantity') {
      if (itemsInBox.length === currentChallenge.targetValue) {
        roundWon = true;
      }
    } else {
      const remainingCorrectItems = itemsOnScreen.filter(
        (item: any) => item[currentChallenge.targetKey] === currentChallenge.targetValue
      );
      if (remainingCorrectItems.length === 0 && itemsOnScreen.length > 0) {
        // Check if all *target* items are gone
        const allTargetItems = currentChallenge.items.filter(
          (item: any) => item[currentChallenge.targetKey] === currentChallenge.targetValue
        );
        const targetItemsInBox = itemsInBox.filter(
          (item: any) => item[currentChallenge.targetKey] === currentChallenge.targetValue
        );
        if (targetItemsInBox.length === allTargetItems.length) {
          roundWon = true;
        }
      }
    }

    if (roundWon) {
      setIsRoundComplete(true);
      clapSound.current.play(); // Play sound on round win
    }
  }, [itemsOnScreen, itemsInBox, currentChallenge, isRoundComplete, clapSound]);

  // ✅ Unified Drop Logic
  const handleItemDrop = (itemId: number) => {
    const draggedItem = itemsOnScreen.find(item => item.id === itemId);
    if (!draggedItem) return;

    let isCorrectDrop = false;
    if (currentChallenge.targetKey === 'quantity') {
      // For quantity, any item is "correct" as long as the box isn't full
      // TS now knows currentChallenge.targetValue is a number, so this comparison is safe.
      isCorrectDrop = itemsInBox.length < currentChallenge.targetValue;
    } else {
      isCorrectDrop = (draggedItem as any)[currentChallenge.targetKey] === currentChallenge.targetValue;
    }

    if (isCorrectDrop) {
      correctSound.current.play();
      setItemsInBox(prev => [...prev, draggedItem]);
      setItemsOnScreen(prev => prev.filter(item => item.id !== itemId));
    } else {
      wrongSound.current.play();
      setShakeBox(true);
      setTimeout(() => setShakeBox(false), 500);
    }
  };

  // ✅ Desktop Drag Handlers
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, item: ReviewItem) => {
    e.dataTransfer.setData("itemId", item.id.toString());
    setDraggingId(item.id);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDragOverHome(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOverHome(true);
  };

  const handleDragLeave = () => {
    setDragOverHome(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDraggingId(null);
    setDragOverHome(false);
    const itemId = parseInt(e.dataTransfer.getData("itemId"));
    if (itemId) {
      handleItemDrop(itemId);
    }
  };

  // ✅ Mobile Touch Handlers
  const handleTouchStart = (_e: React.TouchEvent<HTMLDivElement>, item: ReviewItem) => {
    setDraggingId(item.id);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    const dropZone = element?.closest('[data-box="home"]');
    setDragOverHome(!!dropZone);
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>, item: ReviewItem) => {
    setDraggingId(null);
    setDragOverHome(false);
    
    const touch = e.changedTouches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    const dropZone = element?.closest('[data-box="home"]');

    if (dropZone) {
      handleItemDrop(item.id);
    }
  };


  const handleNextRound = () => {
    if (currentRound >= quizRounds.length - 1) {
      setIsQuizComplete(true);
      clapSound.current.play();
      confetti({ particleCount: 200, spread: 70, origin: { y: 0.6 } });
    } else {
      setCurrentRound(prev => prev + 1);
    }
  };

  // The final success screen
  if (isQuizComplete) {
    return (
      <div className="p-6 text-center flex flex-col items-center justify-center h-full">
        <CheckCircle size={80} className="text-green-500 mb-4" />
        <h2 className="text-3xl font-bold">You're a Grouping Expert!</h2>
        <button onClick={onComplete} className="w-full mt-6 bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors">
          Continue Adventure
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 flex flex-col h-full">
      <style>{shakeAnimationCss}</style>
      <h3 className="text-3xl font-bold text-center mb-4 text-white">{currentChallenge.instruction}</h3>
      
      {/* Draggable items area */}
      <div className="flex-grow bg-gray-100 rounded-lg p-4 mb-4 flex justify-center items-center flex-wrap gap-4 min-h-[200px]">
        {itemsOnScreen.map(item => (
          <div
            key={item.id}
            draggable
            onDragStart={(e) => handleDragStart(e, item)}
            onDragEnd={handleDragEnd}
            onTouchStart={(e) => handleTouchStart(e, item)}
            onTouchMove={handleTouchMove}
            onTouchEnd={(e) => handleTouchEnd(e, item)}
            style={{ touchAction: 'none' }}
            className={`text-6xl cursor-grab hover:scale-110 transition-all duration-200 ${
              draggingId === item.id ? 'opacity-30 scale-125' : 'opacity-100'
            }`}
          >
            {item.emoji}
          </div>
        ))}
      </div>

      {/* Drop zone box */}
      <div
        data-box="home"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`min-h-[150px] w-full rounded-lg border-4 border-dashed flex justify-center items-center flex-wrap gap-3 p-4 transition-all duration-200 ${
          dragOverHome
            ? 'bg-yellow-300 border-yellow-600 scale-105'
            : 'bg-yellow-200 border-yellow-500'
        } ${
          shakeBox ? 'shake' : ''
        }`}
      >
        {itemsInBox.map(item => (
          <div key={item.id} className="text-5xl pointer-events-none">{item.emoji}</div>
        ))}
      </div>

      {/* Next Round Button */}
      <div className="text-center mt-4 h-14">
        {isRoundComplete && (
          <button onClick={handleNextRound} className="bg-green-600 text-white font-bold py-3 px-8 rounded-lg text-xl animate-bounce hover:animate-none">
            Next!
          </button>
        )}
      </div>
    </div>
  );
};

export default GroupingReview;

