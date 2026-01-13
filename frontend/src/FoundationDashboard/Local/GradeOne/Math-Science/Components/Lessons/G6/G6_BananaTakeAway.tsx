import React, { useState, useCallback, useMemo, useRef } from 'react';
import { CheckCircle, RefreshCcw } from 'lucide-react';

export interface LessonComponentProps {
  lesson: any; 
  onComplete: () => void;
}

// Question bank for variety - all bananas
const QUESTION_BANK = [
  { start: 5, takeAway: 2, answer: 3, emoji: '🍌' },
  { start: 4, takeAway: 1, answer: 3, emoji: '🍌' },
  { start: 6, takeAway: 3, answer: 3, emoji: '🍌' },
  { start: 7, takeAway: 4, answer: 3, emoji: '🍌' },
  { start: 8, takeAway: 5, answer: 3, emoji: '🍌' },
  { start: 5, takeAway: 3, answer: 2, emoji: '🍌' },
  { start: 6, takeAway: 2, answer: 4, emoji: '🍌' },
  { start: 9, takeAway: 4, answer: 5, emoji: '🍌' },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const createMockAudio = () => ({
  play: () => {},
  pause: () => {},
  currentTime: 0,
});

const G6_BananaTakeAway: React.FC<LessonComponentProps> = ({ onComplete }) => {
  const [selectedQuestions] = useState(() => shuffle(QUESTION_BANK).slice(0, 5));
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [itemsLeft, setItemsLeft] = useState(selectedQuestions[0].start);
  const [hasEaten, setHasEaten] = useState(false);
  const [answerSelected, setAnswerSelected] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [correctAnswers, setCorrectAnswers] = useState(0);

  const correctSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/correct.mp3") : createMockAudio());
  const wrongSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/incorrect.mp3") : createMockAudio());

  const currentQuestion = selectedQuestions[currentQuestionIndex];
  const totalQuestions = selectedQuestions.length;
  const isGameComplete = currentQuestionIndex >= totalQuestions;

  // Game Phases
  const isInitialPhase = !hasEaten && isCorrect === null;
  const isAnsweringPhase = hasEaten && isCorrect === null;
  const isQuestionComplete = isCorrect !== null;

  // Generate answer options (correct answer + 3 distractors)
  const answerOptions = useMemo(() => {
    const correct = currentQuestion.answer;
    const options = new Set([correct]);
    
    while (options.size < 4) {
      const distractor = Math.max(0, correct + Math.floor(Math.random() * 5) - 2);
      if (distractor !== correct && distractor <= currentQuestion.start) {
        options.add(distractor);
      }
    }
    
    return shuffle(Array.from(options));
  }, [currentQuestion]);

  const items = useMemo(() => {
    return Array(currentQuestion.start).fill(null).map((_, index) => {
      if (index < itemsLeft) return 'present';
      if (index >= currentQuestion.answer && index < currentQuestion.start) return 'eaten';
      return 'hidden';
    });
  }, [itemsLeft, currentQuestion]);

  const handleEatItems = useCallback(() => {
    if (isInitialPhase) {
      setItemsLeft(currentQuestion.answer);
      setHasEaten(true);
    }
  }, [isInitialPhase, currentQuestion.answer]);

  const handleAnswerClick = useCallback((answer: number) => {
    if (!isQuestionComplete && isAnsweringPhase) {
      setAnswerSelected(answer);
      
      if (answer === currentQuestion.answer) {
        correctSound.current.play();
        setIsCorrect(true);
        setCorrectAnswers(prev => prev + 1);
        
        setTimeout(() => {
          if (currentQuestionIndex + 1 < totalQuestions) {
            // Move to next question
            const nextIndex = currentQuestionIndex + 1;
            setCurrentQuestionIndex(nextIndex);
            setItemsLeft(selectedQuestions[nextIndex].start);
            setHasEaten(false);
            setAnswerSelected(null);
            setIsCorrect(null);
          } else {
            // Game complete - move to completion screen
            setCurrentQuestionIndex(totalQuestions);
            setHasEaten(false);
            setAnswerSelected(null);
            setIsCorrect(null);
          }
        }, 2000);
      } else {
        wrongSound.current.play();
        setIsCorrect(false);
        setTimeout(() => {
          setIsCorrect(null);
          setAnswerSelected(null);
        }, 1500);
      }
    }
  }, [isQuestionComplete, isAnsweringPhase, currentQuestion.answer, currentQuestionIndex, totalQuestions, selectedQuestions]);

  const handleReset = () => {
    const newQuestions = shuffle(QUESTION_BANK).slice(0, 5);
    setCurrentQuestionIndex(0);
    setItemsLeft(newQuestions[0].start);
    setHasEaten(false);
    setAnswerSelected(null);
    setIsCorrect(null);
    setCorrectAnswers(0);
  };

  const getFeedbackMessage = () => {
    if (isCorrect === true) {
      return `🎉 Awesome! ${currentQuestion.start} - ${currentQuestion.takeAway} = ${currentQuestion.answer}. Great job!`;
    }
    if (isCorrect === false) {
      return `🤔 Not quite! Count the ${currentQuestion.emoji} left and try again.`;
    }
    if (isInitialPhase) {
      return `The monkey has ${currentQuestion.start} ${currentQuestion.emoji}. Click to watch it eat ${currentQuestion.takeAway}!`;
    }
    if (isAnsweringPhase) {
      return `How many ${currentQuestion.emoji} are left? Pick the answer!`;
    }
    return '';
  };

  // Completion Screen
  if (isGameComplete) {
    return (
      <div className="p-6 text-center flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
        <CheckCircle size={80} className="text-green-500 mb-4" />
        <h2 className="text-3xl sm:text-4xl font-bold text-green-800 mb-2">Fantastic Work! 🎊</h2>
        <p className="text-xl sm:text-2xl text-gray-700 mb-4">
          You got {correctAnswers} out of {totalQuestions} questions right!
        </p>
        <p className="text-lg text-gray-600 mb-6">You're a subtraction superstar! ⭐</p>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <button 
            onClick={onComplete} 
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg text-xl transition-colors shadow-lg"
          >
            Continue Adventure 🚀
          </button>
          <button 
            onClick={handleReset} 
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-lg text-xl transition-colors shadow-lg flex items-center gap-2 justify-center"
          >
            <RefreshCcw size={20} />
            Play Again
          </button>
        </div>
      </div>
    );
  }

  const ItemDisplay: React.FC = () => (
    <div className="flex flex-wrap justify-center gap-2 sm:gap-3 p-4 bg-orange-100 rounded-xl shadow-inner border-2 border-orange-400 min-h-[100px] items-center max-w-full">
      {items.map((state, index) => (
        <div key={index} className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-3xl sm:text-4xl">
          <span 
            className={`transition-all duration-700 ${
              state === 'present' ? 'opacity-100 scale-100' : 'opacity-0 scale-50 -translate-y-4'
            }`}
          >
            {currentQuestion.emoji}
          </span>
        </div>
      ))}
    </div>
  );

  const EquationDisplay: React.FC = () => (
    <div className="flex items-center justify-center flex-wrap gap-2 sm:gap-4 text-3xl sm:text-4xl font-extrabold transition-opacity duration-1000">
      <span className="p-2 bg-white rounded-lg shadow-md min-w-[50px] text-center">{currentQuestion.start}</span>
      <span className="text-2xl sm:text-3xl">➖</span>
      <span className="p-2 bg-white rounded-lg shadow-md min-w-[50px] text-center">{currentQuestion.takeAway}</span>
      <span className="text-2xl sm:text-3xl">=</span>
      <span className={`p-2 rounded-lg shadow-lg min-w-[50px] sm:min-w-[60px] text-center transition-all duration-500 
                        ${isQuestionComplete ? (isCorrect ? 'bg-green-500 text-white' : 'bg-red-500 text-white') : 'bg-yellow-300 text-gray-800'}`}>
        {isQuestionComplete ? currentQuestion.answer : '?'}
      </span>
    </div>
  );

  return (
    <div className="p-4 sm:p-8 flex flex-col items-center min-h-screen bg-gradient-to-br from-orange-50 to-yellow-100 font-sans overflow-x-hidden">
      
      {/* Header */}
      <div className="text-center mb-4 sm:mb-6 w-full">
        <h3 className="text-2xl sm:text-4xl font-extrabold text-orange-800 mb-2">
          🐵 Monkey Snack - Subtraction!
        </h3>
        <p className="text-base sm:text-xl text-gray-600 font-medium">
          Question {currentQuestionIndex + 1} of {totalQuestions}
        </p>
        <div className="w-full bg-gray-200 h-2 rounded-full mt-2 max-w-md mx-auto">
          <div 
            className="bg-orange-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${((currentQuestionIndex) / totalQuestions) * 100}%` }}
          />
        </div>
      </div>

      {/* Monkey and Items */}
      <div className="w-full max-w-4xl flex flex-col items-center gap-4 sm:gap-8 mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row items-center justify-center w-full gap-4">
          <div className="text-6xl sm:text-8xl">🐵</div>
          <div className="flex flex-col items-center space-y-3 sm:space-y-4 w-full max-w-2xl">
            <p className="text-xl sm:text-2xl font-bold text-gray-800">Monkey's Snack:</p>
            <ItemDisplay />
          </div>
        </div>

        {/* Action Button */}
        {isInitialPhase && (
          <button
            onClick={handleEatItems}
            className="flex items-center space-x-2 py-3 px-6 sm:px-8 bg-orange-500 hover:bg-orange-600 text-white font-bold text-lg sm:text-xl rounded-full shadow-lg transition duration-300 transform hover:scale-105 active:scale-95"
          >
            <span className="text-xl sm:text-2xl">🍽️</span>
            <span>Eat {currentQuestion.takeAway} {currentQuestion.emoji}!</span>
          </button>
        )}
      </div>

      {/* Equation and Answer Options */}
      <div className="w-full max-w-4xl flex flex-col items-center space-y-4 sm:space-y-6">
        
        {/* Equation */}
        {hasEaten && <EquationDisplay />}

        {/* Feedback */}
        <div className={`p-3 sm:p-4 rounded-xl text-center font-bold text-base sm:text-lg w-full max-w-xl transition-all duration-500 
                        ${isCorrect === true ? 'bg-green-500 text-white shadow-xl scale-105' : 
                          isCorrect === false ? 'bg-red-500 text-white shadow-xl' : 'bg-white text-gray-700 shadow-md'}`}>
          <p className="leading-relaxed">{getFeedbackMessage()}</p>
        </div>

        {/* Answer Buttons */}
        {isAnsweringPhase && (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full max-w-sm">
            {answerOptions.map(option => (
              <button
                key={option}
                onClick={() => handleAnswerClick(option)}
                disabled={isQuestionComplete}
                className={`text-2xl sm:text-3xl font-bold py-4 sm:py-5 px-6 rounded-xl shadow-lg transition duration-200 transform hover:scale-105 active:scale-95 
                            ${answerSelected === option 
                              ? (isCorrect === true ? 'bg-green-500 text-white' : isCorrect === false ? 'bg-red-500 text-white' : 'bg-yellow-500 text-gray-800')
                              : 'bg-indigo-500 text-white hover:bg-indigo-600'
                            } ${isQuestionComplete ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
              >
                {option}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default G6_BananaTakeAway;