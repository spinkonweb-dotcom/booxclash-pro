import React, { useState, useRef, useEffect } from 'react';
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

// Helper to get the correct suffix for a number (1st, 2nd, 3rd, 4th)
const getOrdinalSuffix = (n: number) => {
  if (n % 10 === 1 && n % 100 !== 11) return 'st';
  if (n % 10 === 2 && n % 100 !== 12) return 'nd';
  if (n % 10 === 3 && n % 100 !== 13) return 'rd';
  return 'th';
};

// --- Data for all 5 rounds of the quiz ---
const quizRounds = [
  { id: 1, targetPosition: 3 }, // 3rd
  { id: 2, targetPosition: 1 }, // 1st
  { id: 3, targetPosition: 5 }, // 5th
  { id: 4, targetPosition: 2 }, // 2nd
  { id: 5, targetPosition: 4 }, // 4th
];

// Emojis for the cars to make it visually interesting
const carEmojis = ['🚗', '🚙', '🚕', '🏎️', '🚓'];

// Mock audio for environments without audio
const createMockAudio = () => ({
  play: () => { /* console.log("Audio play mock") */ },
  pause: () => { /* console.log("Audio pause mock") */ },
  currentTime: 0,
});

const G1_OrdinalNumbers: React.FC<LessonProps> = ({ onComplete }) => {
  const [currentRound, setCurrentRound] = useState(0);
  // State to manage feedback: null, 'correct', or the index of the incorrect car
  const [feedback, setFeedback] = useState<number | 'correct' | null>(null);
  const [isQuizComplete, setIsQuizComplete] = useState(false);

  // --- Sound Refs ---
  const correctSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/correct.mp3") : createMockAudio());
  const wrongSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/incorrect.mp3") : createMockAudio());
  const clapSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/clap.mp3") : createMockAudio());

  const currentChallenge = quizRounds[currentRound];
  const targetIndex = currentChallenge.targetPosition - 1; // Convert 1st to index 0, 2nd to 1, etc.
    const { speak, stop } = useSpeech();
    const instructions = "Hi, in this lesson you will learn positions in a sequence. Tap the object that is in the position you are asked for."
      useEffect(() => {
        speak({ text: instructions });
        return stop; // stop when unmounting
      }, []);// ✅ Core drop logic
  // Effect for quiz completion
  useEffect(() => {
    if (isQuizComplete) {
      clapSound.current.play();
      confetti({ particleCount: 200, spread: 70, origin: { y: 0.6 } });
    }
  }, [isQuizComplete, clapSound]);

  const handleCarClick = (clickedIndex: number) => {
    // Prevent clicking while feedback is being shown
    if (feedback !== null) return;

    if (clickedIndex === targetIndex) {
      correctSound.current.play();
      setFeedback('correct');
      // After a short delay, advance to the next round or complete the quiz
      setTimeout(() => {
        if (currentRound >= quizRounds.length - 1) {
          setIsQuizComplete(true);
        } else {
          setCurrentRound(prev => prev + 1);
          setFeedback(null);
        }
      }, 1200);
    } else {
      wrongSound.current.play();
      setFeedback(clickedIndex); // Store the index of the incorrectly clicked car
      // Reset the feedback after a moment to allow another try
      setTimeout(() => {
        setFeedback(null);
      }, 1000);
    }
  };

  // The final success screen
  if (isQuizComplete) {
    return (
      <div className="p-6 text-center flex flex-col items-center justify-center h-full bg-gray-100">
        <CheckCircle size={80} className="text-green-500 mb-4" />
        <h2 className="text-3xl font-bold">You're a winner!</h2>
        <p className="text-lg text-gray-600 mb-6">You know your ordinal numbers perfectly.</p>
        <button
          onClick={onComplete}
          className="w-full max-w-xs bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Continue Adventure
        </button>
      </div>
    );
  }
  
  const targetPositionText = `${currentChallenge.targetPosition}${getOrdinalSuffix(currentChallenge.targetPosition)}`;

  return (
    <div className="p-4 flex flex-col h-full bg-gray-100">
      <style>{shakeAnimationCss}</style>
      <h3 className="text-3xl font-bold text-center mb-6 text-gray-800">
        Click on the <span className="text-blue-600">{targetPositionText}</span> car!
      </h3>
      
      <div className="flex-grow flex flex-col justify-center items-center">
        {/* The line of cars */}
        <div className="flex justify-center items-end gap-2 sm:gap-4">
          {carEmojis.map((emoji, index) => {
            const isCorrect = feedback === 'correct' && index === targetIndex;
            const isIncorrect = feedback === index;

            return (
              <div
                key={index}
                onClick={() => handleCarClick(index)}
                className={`text-5xl sm:text-6xl md:text-7xl cursor-pointer transition-all duration-300
                              ${isCorrect ? 'transform -translate-y-8 scale-125' : ''}
                              ${isIncorrect ? 'shake' : ''}
                              ${feedback === null ? 'hover:scale-110' : ''}`}
              >
                {emoji}
              </div>
            );
          })}
        </div>

        {/* The finish line */}
        <div className="w-full h-4 mt-2 bg-black-and-white-checkered" />
        <div className="w-full h-8 bg-gray-600" />
      </div>

      {/* A simple animation for the 'shake' effect on incorrect answers */}
      <style>{`
        .bg-black-and-white-checkered {
          background-image:
            linear-gradient(45deg, #000 25%, transparent 25%),
            linear-gradient(-45deg, #000 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, #000 75%),
            linear-gradient(-45deg, transparent 75%, #000 75%);
          background-size: 20px 20px;
          background-color: #fff;
        }
      `}</style>
    </div>
  );
};

export default G1_OrdinalNumbers;

