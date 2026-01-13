import React, { useState, useEffect, useRef } from "react";
import { CheckCircle } from "lucide-react";
import confetti from "canvas-confetti";

interface LessonProps {
  onComplete: () => void;
}

// --- DATA STRUCTURES ---

type Dot = {
  number: number;
  x: number; // percentage
  y: number; // percentage
};

type LevelData = {
  level: number;
  skipBy: number;
  pictureName: string;
  dots: Dot[];
};

// --- GAME DATA ---
// Simple shapes with coordinates (0-100) for the SVG viewBox
const LEVELS_DATA: LevelData[] = [
  {
    level: 1,
    skipBy: 2,
    pictureName: "Star",
    dots: [
      { number: 2, x: 50, y: 5 },
      { number: 4, x: 61, y: 40 },
      { number: 6, x: 98, y: 40 },
      { number: 8, x: 68, y: 62 },
      { number: 10, x: 79, y: 95 },
      { number: 12, x: 50, y: 75 },
      { number: 14, x: 21, y: 95 },
      { number: 16, x: 32, y: 62 },
      { number: 18, x: 2, y: 40 },
      { number: 20, x: 39, y: 40 },
    ],
  },
  {
    level: 2,
    skipBy: 5,
    pictureName: "House",
    dots: [
      { number: 5, x: 10, y: 80 },
      { number: 10, x: 10, y: 40 },
      { number: 15, x: 50, y: 10 },
      { number: 20, x: 90, y: 40 },
      { number: 25, x: 90, y: 80 },
      { number: 30, x: 10, y: 80 }, // Connects back to start
    ],
  },
  {
    level: 3,
    skipBy: 10,
    pictureName: "Fish",
    dots: [
      { number: 10, x: 10, y: 50 },
      { number: 20, x: 30, y: 30 },
      { number: 30, x: 70, y: 40 },
      { number: 40, x: 90, y: 20 },
      { number: 50, x: 90, y: 80 },
      { number: 60, x: 70, y: 60 },
      { number: 70, x: 30, y: 70 },
      { number: 80, x: 10, y: 50 }, // Connects back to start
    ],
  },
];

// --- COMPONENT ---

const SkipCountingConnectTheDots: React.FC<LessonProps> = ({ onComplete }) => {
  // --- STATE ---
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const [currentLevelData, setCurrentLevelData] = useState(LEVELS_DATA[0]);
  const [connectedDots, setConnectedDots] = useState<number[]>([]); // Array of numbers clicked in order
  const [lastCorrectNumber, setLastCorrectNumber] = useState<number | null>(null);
  const [isLevelComplete, setIsLevelComplete] = useState(false);
  const [isGameComplete, setIsGameComplete] = useState(false);
  const [wrongClickNumber, setWrongClickNumber] = useState<number | null>(null);

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
    const level = LEVELS_DATA[currentLevelIndex];
    setCurrentLevelData(level);
    setConnectedDots([]);
    setLastCorrectNumber(null);
    setIsLevelComplete(false);
  }, [currentLevelIndex]);

  // --- LEVEL/GAME COMPLETION ---
  useEffect(() => {
    if (connectedDots.length === currentLevelData.dots.length) {
      setIsLevelComplete(true);
      clapSound.current.play();
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    }
  }, [connectedDots, currentLevelData]);

  // --- INTERACTION HANDLERS ---
  const handleDotClick = (clickedDot: Dot) => {
    if (isLevelComplete) return;

    const expectedNumber = lastCorrectNumber === null
      ? currentLevelData.dots[0].number // Expecting the first dot
      : lastCorrectNumber + currentLevelData.skipBy;

    if (clickedDot.number === expectedNumber) {
      correctSound.current.play();
      setConnectedDots(prev => [...prev, clickedDot.number]);
      setLastCorrectNumber(clickedDot.number);
      setWrongClickNumber(null);
    } else {
      wrongSound.current.play();
      setWrongClickNumber(clickedDot.number);
      // Simple visual feedback: reset after a short delay
      setTimeout(() => setWrongClickNumber(null), 500);
    }
  };

  const handleNextLevel = () => {
    if (currentLevelIndex < LEVELS_DATA.length - 1) {
      setCurrentLevelIndex(prev => prev + 1);
    } else {
      setIsGameComplete(true);
      clapSound.current.play();
      confetti({ particleCount: 200, spread: 80, origin: { y: 0.6 } });
    }
  };

  // --- RENDER ---
  if (isGameComplete) {
    return (
      <div className="p-6 text-center flex flex-col items-center justify-center h-full text-white">
        <CheckCircle size={80} className="text-green-400 mb-4" />
        <h2 className="text-3xl font-bold">You're a Skip Counting Star!</h2>
        <p className="text-lg mb-6">You've connected all the dots!</p>
        <button
          onClick={onComplete}
          className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Finish Lesson
        </button>
      </div>
    );
  }

  // Helper to get dot coordinates by number
  const getDotCoords = (num: number) => {
    return currentLevelData.dots.find(d => d.number === num);
  };

  return (
    <div className="p-4 flex flex-col h-full text-white">
      <h3 className="text-2xl font-bold text-center mb-2">Connect the Dots!</h3>
      <p className="text-lg text-center text-cyan-300 font-semibold mb-4">
        Count by {currentLevelData.skipBy}s to draw the {currentLevelData.pictureName}!
      </p>

      {/* SVG Drawing Area */}
      <div className="w-full flex-grow bg-white/10 rounded-lg p-3 aspect-square max-h-[70vh]">
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full"
          style={{ touchAction: "none" }}
        >
          {/* Draw connecting lines */}
          {connectedDots.length > 1 && connectedDots.slice(0, -1).map((num, index) => {
            const dotA = getDotCoords(num);
            const dotB = getDotCoords(connectedDots[index + 1]);
            if (!dotA || !dotB) return null;
            return (
              <line
                key={index}
                x1={dotA.x}
                y1={dotA.y}
                x2={dotB.x}
                y2={dotB.y}
                stroke="#06b6d4" // cyan-500
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            );
          })}

          {/* Draw dots and numbers */}
          {currentLevelData.dots.map((dot) => {
            const isConnected = connectedDots.includes(dot.number);
            const isNextDot = lastCorrectNumber === null
              ? dot.number === currentLevelData.dots[0].number
              : dot.number === lastCorrectNumber + currentLevelData.skipBy;
            const isWrong = wrongClickNumber === dot.number;

            return (
              <g
                key={dot.number}
                onClick={() => handleDotClick(dot)}
                onTouchStart={() => handleDotClick(dot)}
                className="cursor-pointer"
              >
                {/* Dot Circle */}
                <circle
                  cx={dot.x}
                  cy={dot.y}
                  r={isNextDot ? 4 : 3} // Make the next dot slightly bigger
                  fill={isConnected ? "#06b6d4" : "#f1f5f9"} // cyan-500 or slate-100
                  stroke={isWrong ? "#f43f5e" : (isNextDot ? "#a5f3fc" : "none")} // red-500 or cyan-100
                  strokeWidth={isWrong || isNextDot ? 1.5 : 0}
                  className={`transition-all duration-150 ${isWrong ? 'animate-shake' : ''}`}
                />
                {/* Number Text */}
                <text
                  x={dot.x + 4}
                  y={dot.y + 1.5}
                  fill={isConnected ? "#06b6d4" : "#f1f5f9"}
                  fontSize="4"
                  fontWeight="bold"
                  className="pointer-events-none"
                >
                  {dot.number}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Level Complete / Next Button */}
      {isLevelComplete && (
        <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center">
          <h2 className="text-4xl font-bold text-yellow-300 mb-4">
            It's a {currentLevelData.pictureName}!
          </h2>
          <button
            onClick={handleNextLevel}
            className="w-1/2 bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            {currentLevelIndex < LEVELS_DATA.length - 1 ? "Next Level" : "All Done!"}
          </button>
        </div>
      )}

      {/* Custom styles for shake animation */}
      <style>
        {`
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-3px); }
            75% { transform: translateX(3px); }
          }
          .animate-shake {
            animation: shake 0.3s ease-in-out;
          }
        `}
      </style>
    </div>
  );
};

export default SkipCountingConnectTheDots;
