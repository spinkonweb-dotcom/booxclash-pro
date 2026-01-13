import React, { useState, useEffect, useRef } from "react";
import { CheckCircle } from "lucide-react";
import confetti from "canvas-confetti";

interface LessonProps {
  onComplete: () => void;
}

// --- DATA STRUCTURES ---

type ProblemItem = {
  id: string;
  name: string;
  problemEmoji: string;
  fixedEmoji: string;
  position: { top: string; left: string; };
  isFixed: boolean;
};

// --- GAME DATA ---
const INITIAL_PROBLEMS: ProblemItem[] = [
  { id: 'lights', name: 'Lights On', problemEmoji: '💡', fixedEmoji: '💡', position: { top: '10%', left: '45%' }, isFixed: false },
  { id: 'faucet', name: 'Dripping Faucet', problemEmoji: '💧', fixedEmoji: '🚰', position: { top: '50%', left: '75%' }, isFixed: false },
  { id: 'paper', name: 'Paper on Floor', problemEmoji: '📄', fixedEmoji: '♻️', position: { top: '80%', left: '30%' }, isFixed: false },
  { id: 'tv', name: 'TV On', problemEmoji: '📺', fixedEmoji: '📺', position: { top: '70%', left: '60%' }, isFixed: false },
  { id: 'trash', name: 'Trash on Floor', problemEmoji: '🗑️', fixedEmoji: '♻️', position: { top: '85%', left: '5%' }, isFixed: false },
];

// --- COMPONENT ---

const TidyUpTheWorldGame: React.FC<LessonProps> = ({ onComplete }) => {
  // --- STATE ---
  const [problems, setProblems] = useState<ProblemItem[]>([]);
  const [problemsFixedCount, setProblemsFixedCount] = useState(0);
  const [isGameComplete, setIsGameComplete] = useState(false);

  // --- SOUNDS ---
  const createMockAudio = () => ({
    play: () => { /* console.log("Audio play mock") */ },
    pause: () => { /* console.log("Audio pause mock") */ },
    currentTime: 0,
  });

  const correctSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/correct.mp3") : createMockAudio());
  const clapSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/clap.mp3") : createMockAudio());

  // --- GAME SETUP ---
  useEffect(() => {
    // Initialize problems, ensuring isFixed is false
    setProblems(INITIAL_PROBLEMS.map(p => ({ ...p, isFixed: false })));
    setProblemsFixedCount(0);
    setIsGameComplete(false);
  }, []);

  // --- GAME COMPLETION CHECK ---
  useEffect(() => {
    // This effect runs whenever the 'problems' state changes
    const fixedCount = problems.filter(p => p.isFixed).length;
    setProblemsFixedCount(fixedCount);

    if (problems.length > 0 && fixedCount === problems.length && !isGameComplete) {
      setIsGameComplete(true);
      clapSound.current.play();
      confetti({ particleCount: 200, spread: 80, origin: { y: 0.6 } });
    }
  }, [problems, isGameComplete, clapSound]);

  // --- INTERACTION HANDLER ---
  const handleProblemClick = (clickedItem: ProblemItem) => {
    if (clickedItem.isFixed || isGameComplete) return;

    correctSound.current.play();

    // Update the state
    setProblems(prevProblems =>
      prevProblems.map(p =>
        p.id === clickedItem.id ? { ...p, isFixed: true } : p
      )
    );
  };

  // --- RENDER ---
  if (isGameComplete) {
    return (
      <div className="p-6 text-center flex flex-col items-center justify-center h-full text-white">
        <CheckCircle size={80} className="text-green-400 mb-4" />
        <h2 className="text-3xl font-bold">Green Hero!</h2>
        <p className="text-lg mb-6">You tidied up the world!</p>
        <button
          onClick={onComplete}
          className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Finish Lesson
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 flex flex-col h-full text-white overflow-hidden">
      <h3 className="text-2xl font-bold text-center mb-2">Tidy Up the World!</h3>
      <p className="text-lg text-center text-cyan-300 mb-4">Tap the problems to fix them!</p>

      {/* Score */}
      <div className="text-center mb-4 text-xl font-bold">
        Fixed: {problemsFixedCount} / {problems.length}
      </div>

      {/* Game Area (The "Room") */}
      <div className="relative flex-grow bg-blue-900/70 rounded-xl overflow-hidden shadow-lg border-4 border-white/20">
        {problems.map(problem => (
          <div
            key={problem.id}
            onClick={() => handleProblemClick(problem)}
            className={`absolute transition-all duration-300
              ${problem.isFixed 
                ? 'scale-90' 
                : 'cursor-pointer hover:scale-110 animate-pulse-problem'}
            `}
            style={problem.position}
            title={problem.name}
          >
            <span className={`text-6xl ${
              problem.isFixed ?
              (problem.id === 'lights' || problem.id === 'tv' ? 'opacity-30' : '')
              : ''
            }`}>
              {problem.isFixed ? problem.fixedEmoji : problem.problemEmoji}
            </span>
          </div>
        ))}
      </div>

      {/* Animations */}
      <style>
        {`
          @keyframes pulse-problem {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
          }
          .animate-pulse-problem {
            animation: pulse-problem 1.5s ease-in-out infinite;
          }
        `}
      </style>
    </div>
  );
};

export default TidyUpTheWorldGame;