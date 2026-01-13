import React, { useState, useEffect, useRef, useCallback } from "react";
import { CheckCircle, Eye } from "lucide-react";
import confetti from "canvas-confetti";

interface LessonProps {
  onComplete: () => void;
}

// --- DATA STRUCTURES ---

type GameRound = {
  actualCount: number;
  options: number[];
  closestOption: number;
};

// --- GAME DATA ---
const TOTAL_ROUNDS = 8;
const MIN_COUNT = 5;
const MAX_COUNT = 20;
const ESTIMATE_OPTIONS = [5, 10, 15, 20];
const FLASH_DURATION_MS = 3000; // 3 seconds

// Helper to find the closest estimate option
const findClosestOption = (count: number, options: number[]): number => {
  return options.reduce((prev, curr) => {
    return (Math.abs(curr - count) < Math.abs(prev - count) ? curr : prev);
  });
};

// --- HELPER COMPONENT: GumballJar ---
const GumballJar: React.FC<{ count: number }> = ({ count }) => {
  // Simple random positions for gumballs
  const gumballs = useRef(Array.from({ length: count }, () => ({
    top: `${Math.random() * 60 + 20}%`,
    left: `${Math.random() * 70 + 15}%`,
    color: ['bg-red-500', 'bg-blue-500', 'bg-yellow-400', 'bg-green-500', 'bg-purple-500'][Math.floor(Math.random() * 5)],
  }))).current;

  return (
    <div className="relative w-48 h-64">
      {/* Jar Lid */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-gray-400 rounded-t-md border-2 border-gray-500 z-10" />
      {/* Jar Glass */}
      <div className="absolute bottom-0 left-0 w-48 h-60 bg-cyan-200/20 rounded-b-full rounded-t-lg border-4 border-white/30 overflow-hidden">
        {/* Gumballs */}
        {gumballs.map((style, i) => (
          <div
            key={i}
            className={`absolute w-5 h-5 rounded-full ${style.color} opacity-90 shadow-inner`}
            style={{ top: style.top, left: style.left }}
          />
        ))}
      </div>
    </div>
  );
};


// --- MAIN COMPONENT ---

const GumballGuessGame: React.FC<LessonProps> = ({ onComplete }) => {
  // --- STATE ---
  const [gameRounds, setGameRounds] = useState<GameRound[]>([]);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [currentRound, setCurrentRound] = useState<GameRound | null>(null);
  
  const [gameState, setGameState] = useState<'ready' | 'flashing' | 'estimating' | 'checking'>('ready');
  
  const [isGameComplete, setIsGameComplete] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [selectedEstimate, setSelectedEstimate] = useState<number | null>(null);

  // --- SOUNDS ---
  const createMockAudio = () => ({
    play: () => { /* console.log("Audio play mock") */ },
    pause: () => { /* console.log("Audio pause mock") */ },
    currentTime: 0,
  });

  const correctSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/correct.mp3") : createMockAudio());
  const wrongSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/incorrect.mp3") : createMockAudio());
  const clapSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/clap.mp3") : createMockAudio());
  const popSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/pop.mp3") : createMockAudio()); // Sound for the flash

  // --- GAME SETUP ---
  const generateGameRounds = useCallback(() => {
    const rounds: GameRound[] = [];
    for (let i = 0; i < TOTAL_ROUNDS; i++) {
      const actualCount = Math.floor(Math.random() * (MAX_COUNT - MIN_COUNT + 1)) + MIN_COUNT;
      const closestOption = findClosestOption(actualCount, ESTIMATE_OPTIONS);
      rounds.push({ actualCount, options: ESTIMATE_OPTIONS, closestOption });
    }
    setGameRounds(rounds);
    setCurrentRoundIndex(0);
  }, []);

  useEffect(() => {
    generateGameRounds();
  }, [generateGameRounds]);

  // Load current round
  useEffect(() => {
    if (gameRounds.length > 0 && currentRoundIndex < gameRounds.length) {
      setCurrentRound(gameRounds[currentRoundIndex]);
      setGameState('ready');
      setFeedback(null);
      setSelectedEstimate(null);
    }
  }, [gameRounds, currentRoundIndex]);

  // --- GAME FLOW ---
  const startFlash = () => {
    if (gameState !== 'ready') return;
    
    popSound.current.play();
    setGameState('flashing');
    
    setTimeout(() => {
      setGameState('estimating');
    }, FLASH_DURATION_MS);
  };

  const handleNextRound = () => {
    if (currentRoundIndex < TOTAL_ROUNDS - 1) {
      setCurrentRoundIndex(prev => prev + 1);
    } else {
      setIsGameComplete(true);
      clapSound.current.play();
      confetti({ particleCount: 200, spread: 80, origin: { y: 0.6 } });
    }
  };

  const handleEstimateClick = (selectedNumber: number) => {
    if (feedback || !currentRound) return;

    setSelectedEstimate(selectedNumber);
    setGameState('checking');

    if (selectedNumber === currentRound.closestOption) {
      correctSound.current.play();
      setFeedback('correct');
    } else {
      wrongSound.current.play();
      setFeedback('wrong');
    }
    setTimeout(handleNextRound, 2500); // Give time to see the result
  };

  // --- RENDER ---
  if (isGameComplete) {
    return (
      <div className="p-6 text-center flex flex-col items-center justify-center h-full text-white">
        <CheckCircle size={80} className="text-green-400 mb-4" />
        <h2 className="text-3xl font-bold">Great Estimating!</h2>
        <p className="text-lg mb-6">You've got a great eye for numbers!</p>
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
    <div className="p-4 flex flex-col h-full text-white">
      <h3 className="text-2xl font-bold text-center mb-4">Gumball Guess!</h3>
      
      {/* Main Game Area */}
      <div className="flex-grow flex flex-col items-center justify-center bg-white/10 rounded-xl p-6 min-h-[350px]">
        
        {/* State: Ready */}
        {gameState === 'ready' && (
          <button
            onClick={startFlash}
            className="flex flex-col items-center gap-4 text-white bg-blue-600 px-8 py-6 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Eye size={48} />
            <span className="text-2xl font-bold">Ready to Guess?</span>
          </button>
        )}
        
        {/* State: Flashing */}
        {gameState === 'flashing' && (
          <div className="flex flex-col items-center animate-pulse">
            <GumballJar count={currentRound.actualCount} />
            <p className="text-xl font-semibold mt-4">Look fast!</p>
          </div>
        )}

        {/* State: Estimating */}
        {gameState === 'estimating' && (
          <div className="flex flex-col items-center">
            <h4 className="text-2xl font-semibold mb-6">About how many did you see?</h4>
            <div className="flex flex-wrap justify-center gap-4">
              {currentRound.options.map((num) => (
                <button
                  key={num}
                  onClick={() => handleEstimateClick(num)}
                  className={`w-20 h-20 bg-indigo-600 text-white font-bold text-3xl rounded-full
                    hover:bg-indigo-700 transition-all duration-200
                  `}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* State: Checking */}
        {gameState === 'checking' && (
          <div className="flex flex-col items-center">
            <p className="text-xl">Your guess: <span className="text-yellow-300 font-bold text-3xl">{selectedEstimate}</span></p>
            <p className="text-xl mt-2">Actual count: <span className="text-cyan-300 font-bold text-3xl">{currentRound.actualCount}</span></p>
            
            {feedback === 'correct' && (
              <p className="text-2xl text-green-400 font-bold mt-6">Great guess! That was the closest!</p>
            )}
            {feedback === 'wrong' && (
              <p className="text-2xl text-red-400 font-bold mt-6">Not quite! The closest was {currentRound.closestOption}.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GumballGuessGame;
