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
  .bounce-in {
    animation: bounceIn 0.5s ease-out;
  }
  @keyframes bounceIn {
    0% {
      transform: scale(0);
      opacity: 0;
    }
    50% {
      transform: scale(1.1);
    }
    100% {
      transform: scale(1);
      opacity: 1;
    }
  }
`;

interface LessonProps {
  onComplete: () => void;
}

type Question = {
  id: number;
  initial: number;
  toAdd: number;
  answer: number;
  emoji: string;
  name: string;
};

const QUESTIONS: Question[] = [
  { id: 1, initial: 3, toAdd: 2, answer: 5, emoji: '🍎', name: 'apples' },
  { id: 2, initial: 2, toAdd: 4, answer: 6, emoji: '🍊', name: 'oranges' },
  { id: 3, initial: 4, toAdd: 3, answer: 7, emoji: '🍇', name: 'grapes' },
  { id: 4, initial: 1, toAdd: 5, answer: 6, emoji: '🍓', name: 'strawberries' },
  { id: 5, initial: 5, toAdd: 2, answer: 7, emoji: '🍌', name: 'bananas' }
];

const createMockAudio = () => ({
  play: () => {},
  pause: () => {},
  currentTime: 0,
});

const G6_AddItTogether: React.FC<LessonProps> = ({ onComplete }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [droppedCount, setDroppedCount] = useState(0);
  const [isQuestionComplete, setIsQuestionComplete] = useState(false);
  const [allComplete, setAllComplete] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [isDragOverDropZone, setIsDragOverDropZone] = useState(false);
  const [shake, setShake] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showAnswerOptions, setShowAnswerOptions] = useState(false);

  const correctSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/correct.mp3") : createMockAudio());
  const wrongSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/incorrect.mp3") : createMockAudio());

  const currentQuestion = QUESTIONS[currentQuestionIndex];
  const totalNeeded = currentQuestion.initial + currentQuestion.toAdd;
  const currentTotal = currentQuestion.initial + droppedCount;

  useEffect(() => {
    if (droppedCount === currentQuestion.toAdd) {
      setShowAnswerOptions(true);
    }
  }, [droppedCount, currentQuestion.toAdd]);

  const handleDrop = () => {
    if (droppedCount < currentQuestion.toAdd) {
      setDroppedCount(prev => prev + 1);
      correctSound.current.play();
    }
  };

  const handleAnswerSelect = (answer: number) => {
    setSelectedAnswer(answer);
    
    if (answer === currentQuestion.answer) {
      correctSound.current.play();
      setMessage("🎉 Correct! Great job!");
      setIsQuestionComplete(true);
      
      setTimeout(() => {
        if (currentQuestionIndex < QUESTIONS.length - 1) {
          setCurrentQuestionIndex(prev => prev + 1);
          setDroppedCount(0);
          setIsQuestionComplete(false);
          setShowAnswerOptions(false);
          setSelectedAnswer(null);
          setMessage("");
        } else {
          setAllComplete(true);
        }
      }, 2000);
    } else {
      wrongSound.current.play();
      setShake(true);
      setMessage("Try again! Count all the " + currentQuestion.name + ".");
      setTimeout(() => {
        setShake(false);
        setSelectedAnswer(null);
        setMessage("");
      }, 1500);
    }
  };

  const onDragStart = (e: React.DragEvent<HTMLDivElement>, id: string) => {
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "copy";
    setDraggingId(id);
  };

  const onDragEnd = () => {
    setDraggingId(null);
    setIsDragOverDropZone(false);
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setIsDragOverDropZone(true);
  };

  const onDragLeave = () => {
    setIsDragOverDropZone(false);
  };

  const onDropHandler = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOverDropZone(false);
    setDraggingId(null);
    const id = e.dataTransfer.getData("text/plain");
    if (id && droppedCount < currentQuestion.toAdd) {
      handleDrop();
    }
  };

  const onTouchStart = (id: string) => {
    setDraggingId(id);
  };

  const onTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    const dropZone = element?.closest('[data-dropzone="true"]');
    setIsDragOverDropZone(!!dropZone);
  };

  const onTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    setDraggingId(null);
    setIsDragOverDropZone(false);
    
    const touch = e.changedTouches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    const dropZone = element?.closest('[data-dropzone="true"]');
    
    if (dropZone && droppedCount < currentQuestion.toAdd) {
      handleDrop();
    }
  };

  const answerOptions = useMemo(() => {
    const correct = currentQuestion.answer;
    const options = [correct];
    
    // Add 2 wrong answers
    let wrong1 = correct + 1;
    let wrong2 = correct - 1;
    
    if (wrong2 < 1) wrong2 = correct + 2;
    
    options.push(wrong1, wrong2);
    
    // Shuffle
    return options.sort(() => Math.random() - 0.5);
  }, [currentQuestion.answer]);

  if (allComplete) {
    return (
      <div className="p-6 text-center flex flex-col items-center justify-center h-full bg-gradient-to-b from-green-50 to-blue-50">
        <CheckCircle size={80} className="text-green-500 mb-4" />
        <h2 className="text-3xl font-bold text-green-800 mb-2">Amazing Work! 🎉</h2>
        <p className="text-xl text-gray-700 mb-6">You've mastered addition! Keep practicing!</p>
        <button 
          onClick={onComplete} 
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg text-xl transition-colors"
        >
          Continue Adventure
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6 bg-gradient-to-b from-yellow-50 to-orange-50 min-h-screen">
      <style>{shakeAnimationCss}</style>
      
      {/* Header */}
      <div className="w-full bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-3xl font-bold text-center text-orange-600 mb-2">
          Add It Together ➕
        </h2>
        <div className="text-center text-lg text-gray-700">
          Question {currentQuestionIndex + 1} of {QUESTIONS.length}
        </div>
      </div>

      {/* Main Game Area */}
      <div className="flex-1 bg-white rounded-lg shadow-lg p-6">
        {/* Problem Statement */}
        <div className="text-center mb-6">
          <div className="text-2xl font-bold text-purple-700 mb-4">
            {currentQuestion.initial} + {currentQuestion.toAdd} = ?
          </div>
          <p className="text-lg text-gray-600">
            Drag {currentQuestion.toAdd} {currentQuestion.name} from the basket to the tree!
          </p>
        </div>

        {/* Drop Zone - Tree */}
        <div
          data-dropzone="true"
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDropHandler}
          className={`relative min-h-[300px] bg-gradient-to-b from-green-100 to-green-200 rounded-lg border-4 transition-all duration-200 p-6 mb-6 ${
            isDragOverDropZone ? 'border-yellow-400 scale-105 shadow-lg' : 'border-green-400'
          }`}
        >
          <div className="text-6xl text-center mb-4">🌳</div>
          <div className="flex flex-wrap justify-center gap-3 min-h-[100px]">
            {/* Initial fruits */}
            {Array.from({ length: currentQuestion.initial }).map((_, i) => (
              <div key={`initial-${i}`} className="text-5xl bounce-in">
                {currentQuestion.emoji}
              </div>
            ))}
            {/* Dropped fruits */}
            {Array.from({ length: droppedCount }).map((_, i) => (
              <div key={`dropped-${i}`} className="text-5xl bounce-in">
                {currentQuestion.emoji}
              </div>
            ))}
          </div>
          <div className="text-center text-2xl font-bold text-green-800 mt-4">
            Total: {currentTotal} {currentQuestion.name}
          </div>
        </div>

        {/* Basket - Draggable Items */}
        {!showAnswerOptions && (
          <div className="bg-gradient-to-b from-amber-100 to-amber-200 rounded-lg border-4 border-amber-400 p-6">
            <div className="text-center text-xl font-bold text-amber-800 mb-4">
              🧺 Basket ({currentQuestion.toAdd - droppedCount} left to add)
            </div>
            <div className="flex flex-wrap justify-center gap-4">
              {Array.from({ length: currentQuestion.toAdd - droppedCount }).map((_, i) => (
                <div
                  key={`fruit-${i}`}
                  draggable
                  onDragStart={(e) => onDragStart(e, `fruit-${i}`)}
                  onDragEnd={onDragEnd}
                  onTouchStart={() => onTouchStart(`fruit-${i}`)}
                  onTouchMove={onTouchMove}
                  onTouchEnd={onTouchEnd}
                  style={{ touchAction: 'none' }}
                  className={`text-6xl cursor-grab active:cursor-grabbing transition-all hover:scale-110 ${
                    draggingId === `fruit-${i}` ? 'opacity-30' : 'opacity-100'
                  }`}
                >
                  {currentQuestion.emoji}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Answer Options */}
        {showAnswerOptions && (
          <div className={`bg-blue-50 rounded-lg border-4 border-blue-400 p-6 ${shake ? 'shake' : ''}`}>
            <div className="text-center text-2xl font-bold text-blue-800 mb-6">
              How many {currentQuestion.name} in total?
            </div>
            <div className="flex justify-center gap-4">
              {answerOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => handleAnswerSelect(option)}
                  disabled={isQuestionComplete}
                  className={`text-4xl font-bold w-20 h-20 rounded-lg transition-all ${
                    selectedAnswer === option
                      ? option === currentQuestion.answer
                        ? 'bg-green-500 text-white scale-110'
                        : 'bg-red-500 text-white'
                      : 'bg-white text-blue-600 hover:bg-blue-100 hover:scale-110'
                  } border-4 border-blue-400 shadow-lg disabled:opacity-50`}
                >
                  {option}
                </button>
              ))}
            </div>
            {message && (
              <div className={`text-center text-xl font-bold mt-4 p-3 rounded ${
                isQuestionComplete ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
              }`}>
                {message}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default G6_AddItTogether;