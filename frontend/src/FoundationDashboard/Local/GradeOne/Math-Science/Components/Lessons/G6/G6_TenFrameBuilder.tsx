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
`;

interface LessonProps {
  onComplete: () => void;
}

type Question = {
  id: number;
  filled: number;
  color: string;
  colorName: string;
};

const QUESTIONS: Question[] = [
  { id: 1, filled: 6, color: '#EF4444', colorName: 'red' },
  { id: 2, filled: 3, color: '#F59E0B', colorName: 'orange' },
  { id: 3, filled: 7, color: '#10B981', colorName: 'green' },
  { id: 4, filled: 4, color: '#8B5CF6', colorName: 'purple' },
  { id: 5, filled: 8, color: '#EC4899', colorName: 'pink' },
];

const createMockAudio = () => ({
  play: () => {},
  pause: () => {},
  currentTime: 0,
});

const G6_TenFrameBuilder: React.FC<LessonProps> = ({ onComplete }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [placedDots, setPlacedDots] = useState<number[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [shake, setShake] = useState(false);
  const [completedQuestions, setCompletedQuestions] = useState(0);
  const [draggingDot, setDraggingDot] = useState<number | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<number | null>(null);

  const correctSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/correct.mp3") : createMockAudio());
  const wrongSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/incorrect.mp3") : createMockAudio());

  const currentQuestion = QUESTIONS[currentQuestionIndex];
  const neededDots = 10 - currentQuestion.filled;
  const totalSlots = 10;

  // Pre-filled slots (first N slots based on question)
  const preFilledSlots = Array.from({ length: currentQuestion.filled }, (_, i) => i);
  
  // Available empty slots for dragging
  const emptySlots = Array.from({ length: totalSlots }, (_, i) => i).filter(
    i => !preFilledSlots.includes(i)
  );

  // Available dots to drag (not yet placed)
  const availableDots = useMemo(() => {
    return Array.from({ length: neededDots }, (_, i) => i).filter(
      i => !placedDots.includes(i)
    );
  }, [neededDots, placedDots]);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, dotId: number) => {
    e.dataTransfer.setData("text/plain", dotId.toString());
    e.dataTransfer.effectAllowed = "move";
    setDraggingDot(dotId);
  };

  const handleDragEnd = () => {
    setDraggingDot(null);
    setDragOverSlot(null);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, slotId: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverSlot(slotId);
  };

  const handleDragLeave = () => {
    setDragOverSlot(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, slotId: number) => {
    e.preventDefault();
    setDraggingDot(null);
    setDragOverSlot(null);
    const dotId = parseInt(e.dataTransfer.getData("text/plain"));
    
    if (!isNaN(dotId) && !placedDots.includes(dotId)) {
      setPlacedDots(prev => [...prev, dotId]);
    }
  };

  // Touch handling
  const handleTouchStart = (dotId: number) => {
    setDraggingDot(dotId);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    const slot = element?.closest('[data-slotid]') as HTMLElement | null;
    setDragOverSlot(slot?.dataset.slotid ? parseInt(slot.dataset.slotid) : null);
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>, dotId: number) => {
    setDraggingDot(null);
    setDragOverSlot(null);
    
    const touch = e.changedTouches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    const slotEl = element?.closest('[data-slotid]') as HTMLElement | null;
    
    if (slotEl?.dataset.slotid) {
      const slotId = parseInt(slotEl.dataset.slotid);
      if (!isNaN(slotId) && emptySlots.includes(slotId) && !placedDots.includes(dotId)) {
        setPlacedDots(prev => [...prev, dotId]);
      }
    }
  };

  const handleRemoveDot = (dotId: number) => {
    setPlacedDots(prev => prev.filter(id => id !== dotId));
  };

  const handleNumberSelect = (num: number) => {
    setSelectedAnswer(num);
  };

  const handleSubmit = () => {
    if (selectedAnswer === null) return;

    const correct = selectedAnswer === neededDots && placedDots.length === neededDots;
    setIsCorrect(correct);
    setShowFeedback(true);

    if (correct) {
      correctSound.current.play();
      setCompletedQuestions(prev => prev + 1);
      setTimeout(() => {
        if (currentQuestionIndex < QUESTIONS.length - 1) {
          // Move to next question
          setCurrentQuestionIndex(prev => prev + 1);
          setPlacedDots([]);
          setSelectedAnswer(null);
          setShowFeedback(false);
        }
      }, 2000);
    } else {
      wrongSound.current.play();
      setShake(true);
      setTimeout(() => {
        setShake(false);
        setShowFeedback(false);
      }, 1500);
    }
  };

  if (completedQuestions === QUESTIONS.length) {
    return (
      <div className="p-6 text-center flex flex-col items-center justify-center h-screen bg-gradient-to-b from-blue-50 to-green-50">
        <CheckCircle size={80} className="text-green-500 mb-4" />
        <h2 className="text-3xl font-bold text-green-800 mb-2">Excellent Work!</h2>
        <p className="text-xl text-gray-700 mb-6">You've mastered making 10!</p>
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
    <div className="flex flex-col h-screen bg-gradient-to-b from-purple-50 to-blue-50 overflow-hidden">
      <style>{shakeAnimationCss}</style>
      
      {/* Header */}
      <div className="bg-white shadow-md p-4">
        <div className="flex justify-between items-center max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-purple-800">Ten Frame Builder 🔟</h2>
          <div className="text-lg font-bold text-gray-700">
            Question {currentQuestionIndex + 1} / {QUESTIONS.length}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 gap-4 overflow-hidden">
        
        {/* Question Prompt */}
        <div className="bg-white rounded-lg shadow-lg p-4 md:p-6 max-w-4xl w-full">
          <p className="text-xl md:text-2xl text-center font-semibold text-gray-800">
            There are <span className="text-3xl font-bold" style={{ color: currentQuestion.color }}>
              {currentQuestion.filled}
            </span> {currentQuestion.colorName} dots.
            <br />
            <span className="text-purple-600">How many more do we need to make 10?</span>
          </p>
        </div>

        {/* Ten Frame */}
        <div className="bg-white rounded-lg shadow-xl p-4 md:p-6 max-w-4xl w-full">
          <div className="grid grid-cols-5 gap-2 md:gap-3 max-w-2xl mx-auto">
            {Array.from({ length: totalSlots }, (_, i) => {
              const isPreFilled = preFilledSlots.includes(i);
              const isEmptySlot = emptySlots.includes(i);
              const placedDotId = placedDots.find(() => 
                isEmptySlot && placedDots.length > 0 && 
                emptySlots.indexOf(i) < placedDots.length
              );
              const hasDot = isPreFilled || (isEmptySlot && emptySlots.indexOf(i) < placedDots.length);
              
              return (
                <div
                  key={i}
                  data-slotid={i}
                  onDragOver={(e) => isEmptySlot ? handleDragOver(e, i) : undefined}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => isEmptySlot ? handleDrop(e, i) : undefined}
                  className={`aspect-square border-4 border-gray-800 rounded-lg flex items-center justify-center transition-all ${
                    dragOverSlot === i ? 'bg-yellow-200 scale-110' : 'bg-white'
                  } ${shake ? 'shake' : ''}`}
                >
                  {isPreFilled && (
                    <div 
                      className="w-3/4 h-3/4 rounded-full shadow-lg"
                      style={{ backgroundColor: currentQuestion.color }}
                    />
                  )}
                  {isEmptySlot && emptySlots.indexOf(i) < placedDots.length && (
                    <div 
                      className="w-3/4 h-3/4 rounded-full shadow-lg bg-blue-500 cursor-pointer hover:scale-110 transition-transform"
                      onClick={() => handleRemoveDot(placedDots[emptySlots.indexOf(i)])}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Draggable Dots Area */}
        {availableDots.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-4 max-w-4xl w-full">
            <p className="text-center text-lg font-semibold text-gray-700 mb-3">
              Drag blue dots to fill the frame:
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {availableDots.map((dotId) => (
                <div
                  key={dotId}
                  draggable
                  onDragStart={(e) => handleDragStart(e, dotId)}
                  onDragEnd={handleDragEnd}
                  onTouchStart={() => handleTouchStart(dotId)}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={(e) => handleTouchEnd(e, dotId)}
                  style={{ touchAction: 'none' }}
                  className={`w-12 h-12 md:w-16 md:h-16 rounded-full bg-blue-500 shadow-lg cursor-grab active:cursor-grabbing hover:scale-110 transition-transform ${
                    draggingDot === dotId ? 'opacity-30' : 'opacity-100'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Number Selection */}
        <div className="bg-white rounded-lg shadow-lg p-4 max-w-4xl w-full">
          <p className="text-center text-lg font-semibold text-gray-700 mb-3">
            Select your answer:
          </p>
          <div className="flex flex-wrap justify-center gap-2 md:gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                onClick={() => handleNumberSelect(num)}
                className={`w-12 h-12 md:w-16 md:h-16 rounded-lg font-bold text-xl md:text-2xl transition-all ${
                  selectedAnswer === num
                    ? 'bg-purple-600 text-white scale-110 shadow-lg'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={selectedAnswer === null || placedDots.length !== neededDots}
          className={`py-3 px-8 rounded-lg font-bold text-xl transition-all ${
            selectedAnswer !== null && placedDots.length === neededDots
              ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:scale-105'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Check Answer
        </button>

        {/* Feedback Message */}
        {showFeedback && (
          <div className={`text-center text-xl font-bold p-4 rounded-lg ${
            isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {isCorrect ? '🎉 Correct! Great job!' : '❌ Try again! Count carefully.'}
          </div>
        )}
      </div>
    </div>
  );
};

export default G6_TenFrameBuilder;