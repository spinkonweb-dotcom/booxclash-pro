import React, { useState, useEffect, useRef, useMemo } from 'react';
import { CheckCircle } from 'lucide-react';

// Shake animation CSS
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
  .pulse-correct {
    animation: pulseCorrect 0.6s ease-out;
  }
  @keyframes pulseCorrect {
    0% { transform: scale(1); }
    50% { transform: scale(1.1); }
    100% { transform: scale(1); }
  }
`;

interface LessonProps {
  onComplete: () => void;
}

type Question = {
  id: number;
  equation: string;
  correctAnswer: number;
  operationType: 'addition' | 'subtraction';
  position: 'start' | 'middle' | 'end';
};

const createMockAudio = () => ({
  play: () => {},
  pause: () => {},
  currentTime: 0,
});

// Generate diverse questions
const generateQuestions = (): Question[] => {
  return [
    // Addition - missing end number
    { id: 1, equation: "3 + 2 = __", correctAnswer: 5, operationType: 'addition', position: 'end' },
    // Addition - missing middle number
    { id: 2, equation: "4 + __ = 7", correctAnswer: 3, operationType: 'addition', position: 'middle' },
    // Subtraction - missing end number
    { id: 3, equation: "8 - 3 = __", correctAnswer: 5, operationType: 'subtraction', position: 'end' },
    // Subtraction - missing middle number
    { id: 4, equation: "9 - __ = 4", correctAnswer: 5, operationType: 'subtraction', position: 'middle' },
    // Addition - missing start number
    { id: 5, equation: "__ + 3 = 8", correctAnswer: 5, operationType: 'addition', position: 'start' },
    // Subtraction - missing start number
    { id: 6, equation: "__ - 2 = 5", correctAnswer: 7, operationType: 'subtraction', position: 'start' },
    // Larger numbers addition
    { id: 7, equation: "6 + __ = 10", correctAnswer: 4, operationType: 'addition', position: 'middle' },
    // Larger numbers subtraction
    { id: 8, equation: "10 - __ = 3", correctAnswer: 7, operationType: 'subtraction', position: 'middle' },
  ];
};

// Generate answer options for a question (correct + wrong answers)
const generateOptions = (correctAnswer: number): number[] => {
  const options = new Set<number>([correctAnswer]);
  
  // Add nearby numbers as distractors
  const nearby = [correctAnswer - 2, correctAnswer - 1, correctAnswer + 1, correctAnswer + 2];
  nearby.forEach(n => {
    if (n >= 0 && n <= 10 && options.size < 4) {
      options.add(n);
    }
  });
  
  // Fill with random numbers if needed
  while (options.size < 4) {
    const random = Math.floor(Math.random() * 11);
    if (random !== correctAnswer) {
      options.add(random);
    }
  }
  
  return Array.from(options).sort(() => Math.random() - 0.5);
};

const G6_FindTheMissingNumber: React.FC<LessonProps> = ({ onComplete }) => {
  const allQuestions = useMemo(() => generateQuestions(), []);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [draggingNumber, setDraggingNumber] = useState<number | null>(null);
  const [isDropZoneActive, setIsDropZoneActive] = useState(false);
  const [shake, setShake] = useState(false);
  const [message, setMessage] = useState("");
  const [isComplete, setIsComplete] = useState(false);

  const correctSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/correct.mp3") : createMockAudio());
  const wrongSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/incorrect.mp3") : createMockAudio());

  const currentQuestion = allQuestions[currentQuestionIndex];
  const answerOptions = useMemo(() => generateOptions(currentQuestion.correctAnswer), [currentQuestion]);

  const checkAnswer = (answer: number) => {
    if (answer === currentQuestion.correctAnswer) {
      correctSound.current.play();
      setIsCorrect(true);
      setSelectedAnswer(answer);
      setMessage("Perfect! That's correct! 🎉");
      
      setTimeout(() => {
        const nextIndex = currentQuestionIndex + 1;
        setAnsweredCount(prev => prev + 1);
        
        if (nextIndex >= allQuestions.length) {
          setIsComplete(true);
        } else {
          setCurrentQuestionIndex(nextIndex);
          setSelectedAnswer(null);
          setIsCorrect(null);
          setMessage("");
        }
      }, 2000);
    } else {
      wrongSound.current.play();
      setIsCorrect(false);
      setShake(true);
      setMessage("Not quite! Try again! 💪");
      
      setTimeout(() => {
        setShake(false);
        setIsCorrect(null);
        setMessage("");
      }, 1500);
    }
  };

  const handleDropLogic = (answer: number) => {
    checkAnswer(answer);
  };

  // Desktop drag handlers
  const onDragStart = (e: React.DragEvent<HTMLDivElement>, answer: number) => {
    e.dataTransfer.setData("text/plain", answer.toString());
    e.dataTransfer.effectAllowed = "move";
    setDraggingNumber(answer);
  };

  const onDragEnd = () => {
    setDraggingNumber(null);
    setIsDropZoneActive(false);
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setIsDropZoneActive(true);
  };

  const onDragLeave = () => {
    setIsDropZoneActive(false);
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDraggingNumber(null);
    setIsDropZoneActive(false);
    const answer = parseInt(e.dataTransfer.getData("text/plain"));
    if (!isNaN(answer)) {
      handleDropLogic(answer);
    }
  };

  // Touch handlers
  const onTouchStart = (answer: number) => {
    setDraggingNumber(answer);
  };

  const onTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    const dropZone = element?.closest('[data-dropzone]') as HTMLElement | null;
    setIsDropZoneActive(!!dropZone);
  };

  const onTouchEnd = (e: React.TouchEvent<HTMLDivElement>, answer: number) => {
    setDraggingNumber(null);
    setIsDropZoneActive(false);
    
    const touch = e.changedTouches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    const dropZoneEl = element?.closest('[data-dropzone]') as HTMLElement | null;
    
    if (dropZoneEl) {
      handleDropLogic(answer);
    }
  };

  // Parse equation to display with gap
  const renderEquation = () => {
    const parts = currentQuestion.equation.split('__');
    return (
      <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
        <span className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-800">
          {parts[0]}
        </span>
        <div
          data-dropzone="true"
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={`w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 border-4 border-dashed rounded-xl flex items-center justify-center transition-all duration-200 ${
            shake ? 'shake' : ''
          } ${
            selectedAnswer !== null && isCorrect
              ? 'bg-green-200 border-green-500 pulse-correct'
              : isDropZoneActive
              ? 'bg-yellow-100 border-yellow-400 scale-110'
              : 'bg-blue-50 border-blue-300'
          }`}
        >
          {selectedAnswer !== null ? (
            <span className={`text-3xl sm:text-4xl md:text-5xl font-bold ${
              isCorrect ? 'text-green-700' : 'text-red-600'
            }`}>
              {selectedAnswer}
            </span>
          ) : (
            <span className="text-xl sm:text-2xl text-gray-400">?</span>
          )}
        </div>
        <span className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-800">
          {parts[1]}
        </span>
      </div>
    );
  };

  if (isComplete) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-green-50 p-4">
        <CheckCircle size={64} className="text-green-500 mb-4 sm:mb-6" />
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-green-800 mb-2 text-center">
          Excellent Work!
        </h2>
        <p className="text-lg sm:text-xl text-gray-700 mb-6 text-center px-4">
          You've mastered finding missing numbers!
        </p>
        <button 
          onClick={onComplete} 
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 sm:py-4 sm:px-8 rounded-lg text-lg sm:text-xl transition-colors"
        >
          Continue Adventure
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-gradient-to-b from-purple-50 to-blue-50 overflow-hidden">
      <style>{shakeAnimationCss}</style>
      
      {/* Header */}
      <div className="bg-white shadow-md p-3 sm:p-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-center text-purple-800 mb-2">
            Find the Missing Number
          </h2>
          <div className="flex justify-between items-center text-sm sm:text-base">
            <div className="font-bold text-gray-700">
              Question {currentQuestionIndex + 1} / {allQuestions.length}
            </div>
            <div className="font-bold text-gray-700">
              Solved: {answeredCount} 🎯
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area - Equation */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 overflow-hidden">
        <div className="w-full max-w-4xl">
          {/* Bridge/Equation Display */}
          <div className="bg-white rounded-2xl shadow-2xl p-4 sm:p-6 md:p-8 mb-4 sm:mb-6">
            <div className="mb-4 sm:mb-6">
              {renderEquation()}
            </div>
            
            {/* Feedback Message */}
            {message && (
              <div className={`text-center text-base sm:text-lg md:text-xl font-bold p-2 sm:p-3 rounded-lg ${
                isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {message}
              </div>
            )}
          </div>

          {/* Answer Options */}
          <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6">
            <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-center mb-3 sm:mb-4 text-blue-800">
              Drag the Correct Number
            </h3>
            <div className="grid grid-cols-4 gap-2 sm:gap-3 md:gap-4 max-w-2xl mx-auto">
              {answerOptions.map((answer) => (
                <div
                  key={answer}
                  draggable
                  onDragStart={(e) => onDragStart(e, answer)}
                  onDragEnd={onDragEnd}
                  onTouchStart={() => onTouchStart(answer)}
                  onTouchMove={onTouchMove}
                  onTouchEnd={(e) => onTouchEnd(e, answer)}
                  style={{ touchAction: 'none' }}
                  className={`aspect-square bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl shadow-lg flex items-center justify-center cursor-grab active:cursor-grabbing transition-all hover:scale-105 hover:shadow-xl ${
                    draggingNumber === answer ? 'opacity-30 scale-95' : 'opacity-100'
                  }`}
                >
                  <span className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white">
                    {answer}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default G6_FindTheMissingNumber;