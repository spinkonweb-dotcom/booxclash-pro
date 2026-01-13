import React, { useState, useEffect, useRef } from "react";
import { CheckCircle } from "lucide-react";
import confetti from "canvas-confetti";

interface LessonProps {
  onComplete: () => void;
}

// --- GAME DATA ---
const JARS_PART_1 = [0, 1, 3, 5];
const COUNTDOWN_START = 3;

// Helper to shuffle an array
const shuffleArray = <T,>(array: T[]): T[] => {
  return [...array].sort(() => Math.random() - 0.5);
};

// --- COMPONENT ---

const BugJarsGame: React.FC<LessonProps> = ({ onComplete }) => {
  // --- STATE ---
  const [gamePart, setGamePart] = useState<1 | 2>(1);
  const [jarOptions, setJarOptions] = useState<number[]>([]);
  const [bugCount, setBugCount] = useState(COUNTDOWN_START);
  
  const [isGameComplete, setIsGameComplete] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [wrongJar, setWrongJar] = useState<number | null>(null); // The bug count of the wrong jar clicked

  // --- SOUNDS ---
  const createMockAudio = () => ({
    play: () => { /* console.log("Audio play mock") */ },
    pause: () => { /* console.log("Audio pause mock") */ },
    currentTime: 0,
  });

  const correctSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/correct.mp3") : createMockAudio());
  const wrongSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/incorrect.mp3") : createMockAudio());
  const clapSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/clap.mp3") : createMockAudio());
  // Use 'correct' sound as a "pop" for countdown
  const popSound = correctSound; 

  // --- GAME SETUP ---
  useEffect(() => {
    setJarOptions(shuffleArray(JARS_PART_1));
    setBugCount(COUNTDOWN_START);
    setGamePart(1);
    setFeedback(null);
    setIsGameComplete(false);
  }, []); // Run once on mount

  // --- INTERACTION HANDLERS ---

  // Part 1: Clicking a jar
  const handleJarClick = (clickedBugCount: number) => {
    if (feedback) return; // Prevent multiple clicks

    if (clickedBugCount === 0) {
      correctSound.current.play();
      setFeedback('correct');
      setTimeout(() => {
        setGamePart(2);
        setFeedback(null);
      }, 1500);
    } else {
      wrongSound.current.play();
      setWrongJar(clickedBugCount);
      setTimeout(() => setWrongJar(null), 500);
    }
  };

  // Part 2: Clicking the countdown button
  const handleCountdownClick = () => {
    if (bugCount > 0) {
      popSound.current.play();
      setBugCount(prev => prev - 1);
    }

    if (bugCount === 1) { // Will be 0 after this click
      setTimeout(() => {
        setIsGameComplete(true);
        clapSound.current.play();
        confetti({ particleCount: 200, spread: 80, origin: { y: 0.6 } });
      }, 1000);
    }
  };

  // --- RENDER ---

  if (isGameComplete) {
    return (
      <div className="p-6 text-center flex flex-col items-center justify-center h-full text-white">
        <CheckCircle size={80} className="text-green-400 mb-4" />
        <h2 className="text-3xl font-bold">You're a Zero Hero!</h2>
        <p className="text-lg mb-6">You know all about the number zero!</p>
        <button
          onClick={onComplete}
          className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Finish Lesson
        </button>
      </div>
    );
  }

  // Helper to render ladybugs
  const renderBugs = (count: number) => {
    if (count === 0) {
      return <span className="text-2xl text-white/70">Empty</span>;
    }
    return Array.from({ length: count }, (_, i) => <span key={i} className="text-3xl md:text-4xl">🐞</span>);
  };

  return (
    <div className="p-4 flex flex-col h-full text-white overflow-hidden">
      
      {/* --- PART 1: Find Zero --- */}
      {gamePart === 1 && (
        <>
          <h3 className="text-2xl font-bold text-center mb-6">Which jar has <span className="text-yellow-300">zero</span> ladybugs?</h3>
          <div className="flex-grow grid grid-cols-2 gap-4">
            {jarOptions.map(bugNum => (
              <div
                key={bugNum}
                onClick={() => handleJarClick(bugNum)}
                className={`relative bg-white/10 rounded-xl p-4 flex flex-col justify-center items-center min-h-[150px]
                  cursor-pointer transition-all duration-200 border-4 border-transparent
                  ${wrongJar === bugNum ? 'animate-shake border-red-500' : ''}
                  ${feedback === 'correct' && bugNum === 0 ? 'border-green-500 scale-105' : ''}
                `}
              >
                {/* Jar Lid */}
                <div className="absolute -top-4 w-1/2 h-6 bg-gray-500 rounded-t-lg border-2 border-gray-400"></div>
                {/* Bug contents */}
                <div className="flex flex-wrap justify-center items-center gap-2 mt-4">
                  {renderBugs(bugNum)}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* --- PART 2: Countdown to Zero --- */}
      {gamePart === 2 && (
        <>
          <h3 className="text-2xl font-bold text-center mb-6">Let's count down to zero!</h3>
          <div className="flex-grow flex flex-col items-center justify-center gap-6">
            
            {/* Big Jar */}
            <div className="relative w-full max-w-sm h-64 bg-white/10 rounded-xl p-6 flex justify-center items-center border-4 border-white/20">
              {/* Jar Lid */}
              <div className="absolute -top-5 w-1/2 h-8 bg-gray-500 rounded-t-lg border-2 border-gray-400"></div>
              {/* Number Display */}
              <div className="absolute top-4 text-7xl font-bold text-white opacity-40">{bugCount}</div>
              {/* Bug contents */}
              <div className="flex flex-wrap justify-center items-center gap-2">
                {renderBugs(bugCount)}
              </div>
            </div>

            {/* Button */}
            <button
              onClick={handleCountdownClick}
              disabled={bugCount === 0}
              className="w-full max-w-sm bg-blue-600 text-white font-bold py-4 px-6 rounded-lg text-2xl
                hover:bg-blue-700 transition-colors disabled:bg-gray-500 disabled:opacity-70"
            >
              Let one go!
            </button>
          </div>
        </>
      )}

      {/* Custom styles for shake animation */}
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

export default BugJarsGame;
