import React, { useState, useEffect, useRef, useCallback } from "react";
import { CheckCircle } from "lucide-react";
import confetti from "canvas-confetti";

interface LessonProps {
  onComplete: () => void;
}

// --- DATA STRUCTURES ---

type ShapeType = 'circle' | 'square' | 'triangle' | 'rectangle';

type SceneObject = {
  id: number;
  label: string;
  shape: ShapeType;
  // CSS styles for positioning and drawing the shape
  style: React.CSSProperties; 
  // Custom classes for shape-drawing (e.g., triangle)
  className?: string; 
};

type GameRound = {
  shapeToFind: ShapeType;
  prompt: string;
  scene: SceneObject[];
};

// --- GAME DATA ---

const ALL_ROUNDS: GameRound[] = [
  {
    shapeToFind: 'triangle',
    prompt: 'Find all the triangles!',
    scene: [
      // A "slide"
      { id: 1, label: 'Slide', shape: 'triangle', style: { top: '50%', left: '30%', borderBottom: '100px solid #a855f7', borderLeft: '50px solid transparent', borderRight: '50px solid transparent' }, className: 'css-triangle' },
      // A "flag"
      { id: 2, label: 'Flag', shape: 'triangle', style: { top: '20%', left: '70%', borderLeft: '60px solid #ec4899', borderTop: '40px solid transparent', borderBottom: '40px solid transparent' }, className: 'css-triangle' },
      // A "sun" (distractor)
      { id: 3, label: 'Sun', shape: 'circle', style: { top: '10%', left: '10%', width: 80, height: 80, backgroundColor: '#facc15', borderRadius: '50%' } },
      // A "window" (distractor)
      { id: 4, label: 'Window', shape: 'square', style: { top: '60%', left: '70%', width: 60, height: 60, backgroundColor: '#3b82f6' } },
    ]
  },
  {
    shapeToFind: 'circle',
    prompt: 'Find all the circles!',
    scene: [
      // A "ball"
      { id: 5, label: 'Ball', shape: 'circle', style: { top: '70%', left: '20%', width: 70, height: 70, backgroundColor: '#ef4444', borderRadius: '50%' } },
      // A "sun"
      { id: 6, label: 'Sun', shape: 'circle', style: { top: '15%', left: '75%', width: 90, height: 90, backgroundColor: '#facc15', borderRadius: '50%' } },
      // A "block" (distractor)
      { id: 7, label: 'Block', shape: 'square', style: { top: '40%', left: '40%', width: 60, height: 60, backgroundColor: '#22c55e' } },
      // A "sign" (distractor)
      { id: 8, label: 'Sign', shape: 'rectangle', style: { top: '70%', left: '60%', width: 100, height: 50, backgroundColor: '#a855f7' } },
    ]
  },
  {
    shapeToFind: 'square',
    prompt: 'Find all the squares!',
    scene: [
      // A "window"
      { id: 9, label: 'Window', shape: 'square', style: { top: '30%', left: '20%', width: 70, height: 70, backgroundColor: '#3b82f6' } },
      // A "block"
      { id: 10, label: 'Block', shape: 'square', style: { top: '60%', left: '60%', width: 90, height: 90, backgroundColor: '#22c55e' } },
      // A "ball" (distractor)
      { id: 11, label: 'Ball', shape: 'circle', style: { top: '10%', left: '50%', width: 50, height: 50, backgroundColor: '#ef4444', borderRadius: '50%' } },
      // A "door" (distractor)
      { id: 12, label: 'Door', shape: 'rectangle', style: { top: '55%', left: '15%', width: 50, height: 100, backgroundColor: '#a16207' } },
    ]
  },
  {
    shapeToFind: 'rectangle',
    prompt: 'Find all the rectangles!',
    scene: [
      // A "door"
      { id: 13, label: 'Door', shape: 'rectangle', style: { top: '40%', left: '25%', width: 60, height: 120, backgroundColor: '#a16207' } },
      // A "bench"
      { id: 14, label: 'Bench', shape: 'rectangle', style: { top: '70%', left: '55%', width: 130, height: 50, backgroundColor: '#a855f7' } },
      // A "sun" (distractor)
      { id: 15, label: 'Sun', shape: 'circle', style: { top: '10%', left: '10%', width: 70, height: 70, backgroundColor: '#facc15', borderRadius: '50%' } },
      // A "flag" (distractor)
      { id: 16, label: 'Flag', shape: 'triangle', style: { top: '20%', left: '70%', borderLeft: '60px solid #ec4899', borderTop: '40px solid transparent', borderBottom: '40px solid transparent' }, className: 'css-triangle' },
    ]
  }
];

// Helper to shuffle an array
const shuffleArray = <T,>(array: T[]): T[] => {
  return [...array].sort(() => Math.random() - 0.5);
};

// --- COMPONENT ---

const ShapeHuntGame: React.FC<LessonProps> = ({ onComplete }) => {
  // --- STATE ---
  const [gameRounds, setGameRounds] = useState<GameRound[]>([]);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [currentRound, setCurrentRound] = useState<GameRound | null>(null);
  
  const [foundObjects, setFoundObjects] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<{ type: 'correct' | 'wrong', id: number } | null>(null);
  const [isGameComplete, setIsGameComplete] = useState(false);

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
  const generateGameRounds = useCallback(() => {
    const rounds = shuffleArray(ALL_ROUNDS); // Use all rounds in a random order
    setGameRounds(rounds);
    setCurrentRoundIndex(0);
    setIsGameComplete(false);
  }, []);

  useEffect(() => {
    generateGameRounds();
  }, [generateGameRounds]);

  // Load current round
  useEffect(() => {
    if (gameRounds.length > 0 && currentRoundIndex < gameRounds.length) {
      setFoundObjects([]); // Reset found objects for the new round
      setFeedback(null);
      setCurrentRound(gameRounds[currentRoundIndex]);
    }
  }, [gameRounds, currentRoundIndex]);

  // --- GAME LOGIC ---

  // Check for round completion
  useEffect(() => {
    if (!currentRound) return;

    const targetObjects = currentRound.scene.filter(obj => obj.shape === currentRound.shapeToFind);
    const allFound = targetObjects.every(obj => foundObjects.includes(obj.id));

    if (allFound && targetObjects.length > 0) {
      // All items for this round found
      setTimeout(handleNextRound, 1200); // Wait for feedback anim
    }
  }, [foundObjects, currentRound]);

  const handleNextRound = () => {
    if (currentRoundIndex < gameRounds.length - 1) {
      setCurrentRoundIndex(prev => prev + 1);
    } else {
      setIsGameComplete(true);
      clapSound.current.play();
      confetti({ particleCount: 200, spread: 80, origin: { y: 0.6 } });
    }
  };

  const handleObjectClick = (clickedObject: SceneObject) => {
    if (feedback || foundObjects.includes(clickedObject.id)) return;

    if (clickedObject.shape === currentRound?.shapeToFind) {
      // --- CORRECT ---
      correctSound.current.play();
      setFoundObjects(prev => [...prev, clickedObject.id]);
      setFeedback({ type: 'correct', id: clickedObject.id });
      setTimeout(() => setFeedback(null), 1000);
    } else {
      // --- WRONG ---
      wrongSound.current.play();
      setFeedback({ type: 'wrong', id: clickedObject.id });
      setTimeout(() => setFeedback(null), 1000);
    }
  };

  // --- RENDER ---
  if (isGameComplete) {
    return (
      <div className="p-6 text-center flex flex-col items-center justify-center h-full text-white">
        <CheckCircle size={80} className="text-green-400 mb-4" />
        <h2 className="text-3xl font-bold">Shape Expert!</h2>
        <p className="text-lg mb-6">You found all the shapes!</p>
        <button
          onClick={onComplete}
          className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Finish Lesson
        </button>
      </div>
    );
  }

  if (!currentRound) {
    return <div className="p-6 text-center text-white">Loading...</div>;
  }

  return (
    <div className="p-4 flex flex-col h-full text-white overflow-hidden">
      <h3 className="text-2xl font-bold text-center mb-2">Shape Hunt</h3>
      <p className="text-lg text-center text-cyan-300 mb-4 h-12">{currentRound.prompt}</p>

      {/* Scene Area */}
      <div className="relative flex-grow bg-gray-800 rounded-lg overflow-hidden border-2 border-gray-600 min-h-[300px]">
        {currentRound.scene.map((obj) => {
          const isFound = foundObjects.includes(obj.id);
          const isCorrect = feedback?.type === 'correct' && feedback.id === obj.id;
          const isWrong = feedback?.type === 'wrong' && feedback.id === obj.id;

          // Base style for all objects
          const baseStyle: React.CSSProperties = {
            position: 'absolute',
            cursor: 'pointer',
            transition: 'all 0.2s ease-in-out',
            ...obj.style,
          };

          return (
            <button
              key={obj.id}
              onClick={() => handleObjectClick(obj)}
              disabled={isFound}
              style={baseStyle}
              className={`
                ${obj.className || ''}
                ${isFound ? 'opacity-100 ring-4 ring-green-500' : 'opacity-80 hover:opacity-100'}
                ${isCorrect ? 'scale-110' : ''}
                ${isWrong ? 'animate-shake' : ''}
                disabled:cursor-default disabled:opacity-100
              `}
            >
              {isFound && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <CheckCircle size={32} className="text-white bg-green-500 rounded-full" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Animations & Styles */}
      <style>
        {`
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
          }
          .animate-shake { animation: shake 0.3s ease-in-out; }

          /* Special class to make CSS triangles clickable */
          .css-triangle {
            width: 0;
            height: 0;
            background-color: transparent !important; /* Override inline style */
          }
        `}
      </style>
    </div>
  );
};

export default ShapeHuntGame;