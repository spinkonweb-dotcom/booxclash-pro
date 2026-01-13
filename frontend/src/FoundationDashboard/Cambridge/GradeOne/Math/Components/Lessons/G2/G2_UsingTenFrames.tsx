import React, { useState, useEffect, useRef, useCallback } from "react";
import { CheckCircle, Eye } from "lucide-react";
import confetti from "canvas-confetti";

interface LessonProps {
  onComplete: () => void;
}

// --- DATA STRUCTURES ---

type GameRound = {
  correctNumber: number;
  options: number[]; // Will include the correct number + 2 wrong ones
};

// --- GAME DATA ---
const ALL_NUMBERS = Array.from({ length: 20 }, (_, i) => i + 1); // Numbers from 1 to 20
const TOTAL_ROUNDS = 10;
const FLASH_DURATION_MS = 5000; // 5 seconds

// Helper to shuffle an array
const shuffleArray = <T,>(array: T[]): T[] => {
  return [...array].sort(() => Math.random() - 0.5);
};

// --- HELPER COMPONENT: TenFrame ---
const TenFrame: React.FC<{ dotCount: number }> = ({ dotCount }) => {
  return (
    <div className="grid grid-cols-5 gap-2 p-2 w-full max-w-[200px] h-[88px] bg-white rounded-lg border-4 border-gray-300">
      {Array.from({ length: 10 }, (_, i) => (
        <div
          key={i}
          className="w-full aspect-square rounded-full flex items-center justify-center"
        >
          {i < dotCount && (
            <div className="w-full h-full rounded-full bg-red-600" />
          )}
        </div>
      ))}
    </div>
  );
};


// --- MAIN COMPONENT ---

const TenFrameFlashGame: React.FC<LessonProps> = ({ onComplete }) => {
  // --- STATE ---
  const [gameRounds, setGameRounds] = useState<GameRound[]>([]);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [currentRound, setCurrentRound] = useState<GameRound | null>(null);
  
  // Game flow state: 'ready' (show "get ready"), 'flashing' (show frames), 'answering' (show buttons)
  const [gameState, setGameState] = useState<'ready' | 'flashing' | 'answering'>('ready');
  
  const [isGameComplete, setIsGameComplete] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [wrongSelection, setWrongSelection] = useState<number | null>(null);

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
    const shuffledNumbers = shuffleArray(ALL_NUMBERS);
    const rounds: GameRound[] = [];

    for (let i = 0; i < TOTAL_ROUNDS; i++) {
      const correctNumber = shuffledNumbers[i];
      
      // Get two wrong options, close to the correct number
      const wrongOptionsSet = new Set<number>();
      while (wrongOptionsSet.size < 2) {
        const offset = Math.random() > 0.5 ? Math.ceil(Math.random() * 3) : -Math.ceil(Math.random() * 3);
        let wrongNum = correctNumber + offset;
        // Ensure wrong num is in range (1-20) and not the correct answer
        if (wrongNum !== correctNumber && wrongNum >= 1 && wrongNum <= 20) {
          wrongOptionsSet.add(wrongNum);
        }
      }
      
      const options = shuffleArray([correctNumber, ...Array.from(wrongOptionsSet)]);
      rounds.push({ correctNumber, options });
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
      setGameState('ready'); // Set to ready for the new round
      setFeedback(null);
      setWrongSelection(null);
    }
  }, [gameRounds, currentRoundIndex]);

  // --- GAME FLOW ---
  const startFlash = () => {
    if (gameState !== 'ready') return;
    
    popSound.current.play();
    setGameState('flashing');
    
    setTimeout(() => {
      setGameState('answering');
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

  const handleAnswerClick = (selectedNumber: number) => {
    if (feedback || !currentRound) return; // Don't check if already showing feedback

    if (selectedNumber === currentRound.correctNumber) {
      correctSound.current.play();
      setFeedback('correct');
      setTimeout(handleNextRound, 1200);
    } else {
      wrongSound.current.play();
      setFeedback('wrong');
      setWrongSelection(selectedNumber);
      setTimeout(() => {
        setFeedback(null);
        setWrongSelection(null);
      }, 1000);
    }
  };

  // --- RENDER ---
  if (isGameComplete) {
    return (
      <div className="p-6 text-center flex flex-col items-center justify-center h-full text-white">
        <CheckCircle size={80} className="text-green-400 mb-4" />
        <h2 className="text-3xl font-bold">Amazing!</h2>
        <p className="text-lg mb-6">You've got a super-fast brain!</p>
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
  
  const { correctNumber, options } = currentRound;
  const dotsInFrame1 = Math.min(10, correctNumber);
  const dotsInFrame2 = Math.max(0, correctNumber - 10);

  return (
    <div className="p-4 flex flex-col h-full text-white">
      <h3 className="text-2xl font-bold text-center mb-4">How Many Dots?</h3>
      
      {/* Main Game Area */}
      <div className="flex-grow flex flex-col items-center justify-center bg-white/10 rounded-xl p-6 min-h-[300px]">
        
        {/* State: Ready */}
        {gameState === 'ready' && (
          <button
            onClick={startFlash}
            className="flex flex-col items-center gap-4 text-white bg-blue-600 px-8 py-6 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Eye size={48} />
            <span className="text-2xl font-bold">Get Ready to Look!</span>
          </button>
        )}
        
        {/* State: Flashing */}
        {gameState === 'flashing' && (
          <div className="flex flex-col md:flex-row gap-4 animate-pulse">
            <TenFrame dotCount={dotsInFrame1} />
            {correctNumber > 10 && (
              <TenFrame dotCount={dotsInFrame2} />
            )}
          </div>
        )}

        {/* State: Answering */}
        {gameState === 'answering' && (
          <div className="flex flex-col items-center">
            <h4 className="text-2xl font-semibold mb-6">Which number did you see?</h4>
            <div className="flex gap-4">
              {options.map((num) => (
                <button
                  key={num}
                  onClick={() => handleAnswerClick(num)}
                  disabled={!!feedback}
                  className={`w-24 h-24 bg-indigo-600 text-white font-bold text-4xl rounded-lg
                    hover:bg-indigo-700 transition-all duration-200
                    ${feedback === 'correct' && num === correctNumber ? 'bg-green-600 scale-110' : ''}
                    ${wrongSelection === num ? 'bg-red-600 animate-shake' : ''}
                  `}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        )}
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

export default TenFrameFlashGame;
