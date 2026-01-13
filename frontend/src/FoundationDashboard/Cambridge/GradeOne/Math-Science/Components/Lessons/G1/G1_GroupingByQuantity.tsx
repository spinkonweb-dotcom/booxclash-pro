import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useSpeech } from "../../../SpeechContext"; // adjust path
// We will inject the CSS directly into the component
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

// --- New Data ---
interface LessonProps {
  onComplete: () => void;
}

type QuizObject = {
  id: number;
  top: string;
  left: string;
};

const quizRounds = [
  { id: 'apple', target: 3, emoji: '🍎' },
  { id: 'banana', target: 5, emoji: '🍌' },
  { id: 'strawberry', target: 2, emoji: '🍓' },
  { id: 'orange', target: 4, emoji: '🍊' },
  { id: 'grape', target: 1, emoji: '🍇' }
];

// Mock audio for environments without audio
const createMockAudio = () => ({
  play: () => { /* console.log("Audio play mock") */ },
  pause: () => { /* console.log("Audio pause mock") */ },
  currentTime: 0,
});
// --- End New Data ---

const G1_GroupingByQuantity: React.FC<LessonProps> = ({ onComplete }) => {
  // --- State from new component ---
  const [currentRound, setCurrentRound] = React.useState(0);
  const [objectsOnScreen, setObjectsOnScreen] = React.useState<QuizObject[]>([]);
  const [objectsInBasket, setObjectsInBasket] = React.useState<QuizObject[]>([]);
  const [isTaskComplete, setIsTaskComplete] = React.useState(false);
  const [isQuizComplete, setIsQuizComplete] = React.useState(false);

  // --- State from previous component for interactivity ---
  const [shakeBox, setShakeBox] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [dragOverHome, setDragOverHome] = useState<string | null>(null);

  // --- Merged Data/Logic ---
  const currentChallenge = quizRounds[currentRound];
  const targetNumber = currentChallenge.target;

  // ✅ Sound refs using CDN and mock fallback
  const correctSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/correct.mp3") : createMockAudio());
  const wrongSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/incorrect.mp3") : createMockAudio());
  const clapSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/clap.mp3") : createMockAudio());
    const { speak, stop } = useSpeech();
    const instructions = "Hi, in this lesson you will learn to count objects. Drag the correct number of items into the basket as instructed."
      useEffect(() => {
        speak({ text: instructions });
        return stop; // stop when unmounting
      }, []);// ✅ Core drop logic
  const generateObjects = () => {
    return Array.from({ length: 8 }, (_, i) => ({
      id: i,
      top: `${Math.random() * 70 + 10}%`,
      left: `${Math.random() * 70 + 10}%`,
    }));
  };

  // Reset board on round change
  React.useEffect(() => {
    setObjectsOnScreen(generateObjects());
    setObjectsInBasket([]);
  }, [currentRound]);

  // Check if current task is complete
  React.useEffect(() => {
    if (objectsInBasket.length === targetNumber) {
      setIsTaskComplete(true);
    } else {
      setIsTaskComplete(false);
    }
  }, [objectsInBasket, targetNumber]);

  // Check if entire quiz is complete
  useEffect(() => {
    if (isQuizComplete) {
      clapSound.current.play();
      confetti({ particleCount: 200, spread: 70, origin: { y: 0.6 } });
    }
  }, [isQuizComplete]);


  // ✅ Core Drop Logic (with "wrong" state)
  const processDrop = (objectId: number) => {
    const draggedObject = objectsOnScreen.find(obj => obj.id === objectId);
    if (!draggedObject) return;

    // Check if basket is full
    if (objectsInBasket.length >= targetNumber) {
      // Basket is full, play wrong sound and shake
      wrongSound.current.play();
      setShakeBox('basket');
      setTimeout(() => setShakeBox(null), 500);
    } else {
      // Basket has space, add item
      correctSound.current.play();
      setObjectsInBasket(prev => [...prev, draggedObject]);
      setObjectsOnScreen(prev => prev.filter(obj => obj.id !== objectId));
    }
  };

  // ✅ Desktop Drag Handlers
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, objectId: number) => {
    e.dataTransfer.setData("objectId", objectId.toString());
    setDraggingId(objectId);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDragOverHome(null);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOverHome('basket');
  };

  const handleDragLeave = () => {
    setDragOverHome(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDraggingId(null);
    setDragOverHome(null);
    const objectId = parseInt(e.dataTransfer.getData("objectId"));
    if (objectId || objectId === 0) { // Check for 0
      processDrop(objectId);
    }
  };

  // ✅ Mobile Touch Handlers
  const handleTouchStart = (_e: React.TouchEvent<HTMLDivElement>, objectId: number) => {
    setDraggingId(objectId);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    const dropZone = element?.closest('[data-box]') as HTMLElement | null;

    if (dropZone?.dataset?.box === 'basket') {
      setDragOverHome('basket');
    } else {
      setDragOverHome(null);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>, objectId: number) => {
    setDraggingId(null);
    setDragOverHome(null);

    const touch = e.changedTouches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    const dropZone = element?.closest('[data-box]') as HTMLElement | null;

    if (dropZone?.dataset?.box === 'basket') {
      processDrop(objectId);
    }
  };

  // --- Button Click Handlers ---
  const handleNextRound = () => {
    if (currentRound >= quizRounds.length - 1) {
      setIsQuizComplete(true);
    } else {
      setCurrentRound(prevRound => prevRound + 1);
    }
  };

  const resetCurrentRound = () => {
    setObjectsOnScreen(generateObjects());
    setObjectsInBasket([]);
  };

  // Final success screen
  if (isQuizComplete) {
    return (
      <div className="p-6 text-center flex flex-col items-center justify-center h-full text-white">
        <CheckCircle size={80} className="text-green-400 mb-4" />
        <h2 className="text-3xl font-bold">You're a counting master!</h2>
        <button onClick={onComplete} className="w-full mt-6 bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors">
          Continue Adventure
        </button>
      </div>
    );
  }

  // Main game screen
  return (
    <div className="p-4 flex flex-col h-full text-white">
      <style>{shakeAnimationCss}</style>
      <h3 className="text-3xl font-bold text-center mb-2">
        Put <span className="text-yellow-300">{targetNumber}</span> {currentChallenge.id}s in the basket!
      </h3>

      {/* The Tree/Source Area */}
      <div className="relative w-full h-1/2 bg-green-700/50 rounded-lg flex items-center justify-center mb-4 min-h-[200px]">
        {objectsOnScreen.map(obj => (
          <div
            key={obj.id}
            draggable
            onDragStart={(e) => handleDragStart(e, obj.id)}
            onDragEnd={handleDragEnd}
            onTouchStart={(e) => handleTouchStart(e, obj.id)}
            onTouchMove={handleTouchMove}
            onTouchEnd={(e) => handleTouchEnd(e, obj.id)}
            className={`text-5xl cursor-grab absolute transition-all duration-200 hover:scale-110 ${
              draggingId === obj.id ? 'opacity-30 scale-125' : 'opacity-100'
            }`}
            style={{ top: obj.top, left: obj.left, touchAction: 'none' }}
          >
            {currentChallenge.emoji}
          </div>
        ))}
      </div>

      {/* The Basket */}
      <div
        data-box="basket"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative w-1/2 h-1/3 min-h-[150px] mx-auto bg-yellow-700/50 rounded-t-lg flex justify-center items-start p-4 transition-all duration-200
          ${dragOverHome === 'basket' ? 'scale-105 bg-yellow-700/70' : ''}
          ${shakeBox === 'basket' ? 'shake' : ''}
        `}
      >
        <div className="absolute -bottom-2 w-full h-4 bg-yellow-800/50 rounded-b-md"></div>
        <div className="flex flex-wrap gap-2">
          {objectsInBasket.map((_obj, index) => <div key={index} className="text-4xl pointer-events-none">{currentChallenge.emoji}</div>)}
        </div>
      </div>

      {/* Controls */}
      <div className="text-center mt-4 h-16">
        {isTaskComplete ? (
          <button onClick={handleNextRound} className="bg-green-600 text-white font-bold py-3 px-8 rounded-lg text-xl animate-bounce">
            Done!
          </button>
        ) : (
          <button onClick={resetCurrentRound} className="bg-red-500 text-white font-bold py-2 px-6 rounded-lg">
            Try Again
          </button>
        )}
      </div>
    </div>
  );
};

export default G1_GroupingByQuantity;
