import React, { useState, useRef, useEffect } from 'react';
import { CheckCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

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

// Define the structure for a single round of the quiz
type QuizRound = {
  id: number;
  groupA: number; // Number of items in the first group
  groupB: number; // Number of items in the second group
  question: 'more' | 'less'; // The type of comparison
  emoji: string;
};

// Data for all the rounds in the quiz.
// Ensures groupA and groupB are never equal.
const quizRounds: QuizRound[] = [
  { id: 1, groupA: 5, groupB: 2, question: 'more', emoji: '🐠' },
  { id: 2, groupA: 3, groupB: 6, question: 'less', emoji: '🦀' },
  { id: 3, groupA: 7, groupB: 4, question: 'more', emoji: '⭐' },
  { id: 4, groupA: 1, groupB: 5, question: 'less', emoji: '🐢' },
  { id: 5, groupA: 8, groupB: 3, question: 'more', emoji: '🐙' },
];

// Mock audio for environments without audio
const createMockAudio = () => ({
  play: () => { /* console.log("Audio play mock") */ },
  pause: () => { /* console.log("Audio pause mock") */ },
  currentTime: 0,
});

const G1_ComparingGroups: React.FC<LessonProps> = ({ onComplete }) => {
  const [currentRound, setCurrentRound] = useState(0);
  // State to manage feedback: null (neutral), 'correct', or 'incorrect'
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [isQuizComplete, setIsQuizComplete] = useState(false);

  // Sound refs
  const correctSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/correct.mp3") : createMockAudio());
  const wrongSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/incorrect.mp3") : createMockAudio());
  const clapSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/clap.mp3") : createMockAudio());

  // Get the details for the current challenge
  const currentChallenge = quizRounds[currentRound];

  // Trigger confetti on completion
  useEffect(() => {
    if (isQuizComplete) {
      clapSound.current.play();
      confetti({ particleCount: 200, spread: 70, origin: { y: 0.6 } });
    }
  }, [isQuizComplete, clapSound]);

  const handleSelection = (selectedGroup: 'A' | 'B') => {
    // Prevent clicking while feedback is being shown
    if (feedback) return;

    const { groupA, groupB, question } = currentChallenge;
    let isCorrect = false;

    // Determine if the selection was correct
    if (question === 'more') {
      isCorrect = (selectedGroup === 'A' && groupA > groupB) || (selectedGroup === 'B' && groupB > groupA);
    } else { // question === 'less'
      isCorrect = (selectedGroup === 'A' && groupA < groupB) || (selectedGroup === 'B' && groupB < groupA);
    }

    if (isCorrect) {
      correctSound.current.play();
      setFeedback('correct');
      // After a short delay, move to the next round or finish the quiz
      setTimeout(() => {
        if (currentRound >= quizRounds.length - 1) {
          setIsQuizComplete(true);
        } else {
          setCurrentRound(prev => prev + 1);
          setFeedback(null);
        }
      }, 1000);
    } else {
      wrongSound.current.play();
      setFeedback('incorrect');
      // After a short delay, reset the feedback to allow another try
      setTimeout(() => {
        setFeedback(null);
      }, 1000);
    }
  };

  // The final success screen
  if (isQuizComplete) {
    return (
      <div className="p-6 text-center flex flex-col items-center justify-center h-full bg-cyan-50">
        <CheckCircle size={80} className="text-green-500 mb-4" />
        <h2 className="text-3xl font-bold">Fantastic!</h2>
        <p className="text-lg text-gray-600 mb-6">You are amazing at comparing numbers.</p>
        <button
          onClick={onComplete}
          className="w-full max-w-xs bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Continue Adventure
        </button>
      </div>
    );
  }

  // Helper to generate the emoji items for a group
  const renderGroupItems = (count: number, emoji: string) => {
    return Array.from({ length: count }).map((_, i) => (
      <span key={i} className="text-4xl sm:text-5xl">{emoji}</span>
    ));
  };

  return (
    <div className="p-4 flex flex-col h-full bg-cyan-50">
      <style>{shakeAnimationCss}</style>
      <h3 className="text-3xl font-bold text-center mb-6 text-cyan-800">
        Which group has <span className="text-red-500">{currentChallenge.question}</span> items?
      </h3>
      
      <div className="flex-grow grid grid-cols-2 gap-4 sm:gap-8">
        {/* Group A */}
        <div
          onClick={() => handleSelection('A')}
          className={`p-4 rounded-xl border-8 flex flex-col items-center justify-center cursor-pointer transition-all duration-300
                        ${feedback === 'correct' ? 'border-green-500 bg-green-100' : ''}
                        ${feedback === 'incorrect' ? 'border-red-500 bg-red-100 shake' : ''}
                        ${!feedback ? 'border-cyan-300 bg-white hover:border-cyan-500 hover:scale-105' : ''}`}
        >
          <div className="flex flex-wrap justify-center gap-2">
            {renderGroupItems(currentChallenge.groupA, currentChallenge.emoji)}
          </div>
        </div>

        {/* Group B */}
        <div
          onClick={() => handleSelection('B')}
          className={`p-4 rounded-xl border-8 flex flex-col items-center justify-center cursor-pointer transition-all duration-300
                        ${feedback === 'correct' ? 'border-green-500 bg-green-100' : ''}
                        ${feedback === 'incorrect' ? 'border-red-500 bg-red-100 shake' : ''}
                        ${!feedback ? 'border-cyan-300 bg-white hover:border-cyan-500 hover:scale-105' : ''}`}
        >
          <div className="flex flex-wrap justify-center gap-2">
            {renderGroupItems(currentChallenge.groupB, currentChallenge.emoji)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default G1_ComparingGroups;

