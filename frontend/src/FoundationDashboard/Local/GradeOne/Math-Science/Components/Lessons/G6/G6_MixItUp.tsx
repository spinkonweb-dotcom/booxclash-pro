import React, { useState, useEffect, useRef, useMemo } from 'react';
import { CheckCircle, Beaker, Droplets, Sparkles } from 'lucide-react';

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
  
  .dissolve {
    animation: dissolve 2s ease-in-out forwards;
  }
  @keyframes dissolve {
    0% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(0.8) translateY(10px); }
    100% { opacity: 0; transform: scale(0.3) translateY(20px); }
  }
  
  .settle {
    animation: settle 2s ease-in-out forwards;
  }
  @keyframes settle {
    0% { transform: translateY(0); }
    50% { transform: translateY(15px); }
    100% { transform: translateY(25px); }
  }
  
  .bubble {
    animation: bubble 1.5s ease-in-out infinite;
  }
  @keyframes bubble {
    0%, 100% { transform: translateY(0) scale(1); opacity: 0.6; }
    50% { transform: translateY(-10px) scale(1.2); opacity: 1; }
  }
`;

interface LessonProps {
  onComplete: () => void;
}

type Ingredient = {
  id: string;
  name: string;
  icon: string;
  color: string;
};

type Question = {
  id: number;
  instruction: string;
  ingredients: Ingredient[];
  correctPair: [string, string];
  resultType: 'solution' | 'mixture';
  resultDescription: string;
  funFact: string;
};

const QUESTIONS: Question[] = [
  {
    id: 1,
    instruction: "What happens when we mix sugar and water?",
    ingredients: [
      { id: "sugar", name: "Sugar", icon: "🧂", color: "bg-white" },
      { id: "water", name: "Water", icon: "💧", color: "bg-blue-200" },
      { id: "sand", name: "Sand", icon: "🏖️", color: "bg-yellow-600" },
      { id: "oil", name: "Oil", icon: "🫒", color: "bg-yellow-300" }
    ],
    correctPair: ["sugar", "water"],
    resultType: "solution",
    resultDescription: "The sugar dissolves! It disappears into the water to make a sweet solution.",
    funFact: "Sugar molecules spread out evenly in water - that's why all the water tastes sweet!"
  },
  {
    id: 2,
    instruction: "What happens when we mix sand and water?",
    ingredients: [
      { id: "sand", name: "Sand", icon: "🏖️", color: "bg-yellow-600" },
      { id: "water", name: "Water", icon: "💧", color: "bg-blue-200" },
      { id: "salt", name: "Salt", icon: "🧂", color: "bg-white" },
      { id: "juice", name: "Juice", icon: "🧃", color: "bg-orange-300" }
    ],
    correctPair: ["sand", "water"],
    resultType: "mixture",
    resultDescription: "The sand settles at the bottom! The sand and water stay separate - it's a mixture.",
    funFact: "Sand particles are too heavy to dissolve, so they sink to the bottom!"
  },
  {
    id: 3,
    instruction: "What happens when we mix salt and water?",
    ingredients: [
      { id: "salt", name: "Salt", icon: "🧂", color: "bg-white" },
      { id: "water", name: "Water", icon: "💧", color: "bg-blue-200" },
      { id: "rocks", name: "Pebbles", icon: "🪨", color: "bg-gray-500" },
      { id: "pepper", name: "Pepper", icon: "🌶️", color: "bg-gray-700" }
    ],
    correctPair: ["salt", "water"],
    resultType: "solution",
    resultDescription: "The salt dissolves! It vanishes into the water to make a salty solution.",
    funFact: "Ocean water is salty because it has lots of dissolved salt in it!"
  },
  {
    id: 4,
    instruction: "What happens when we mix oil and water?",
    ingredients: [
      { id: "oil", name: "Oil", icon: "🫒", color: "bg-yellow-300" },
      { id: "water", name: "Water", icon: "💧", color: "bg-blue-200" },
      { id: "sugar", name: "Sugar", icon: "🧂", color: "bg-white" },
      { id: "honey", name: "Honey", icon: "🍯", color: "bg-amber-400" }
    ],
    correctPair: ["oil", "water"],
    resultType: "mixture",
    resultDescription: "The oil floats on top! Oil and water don't mix - they form separate layers.",
    funFact: "Oil is lighter than water, so it always floats on top! That's why oil spills spread on the ocean."
  },
  {
    id: 5,
    instruction: "What happens when we mix cocoa powder and milk?",
    ingredients: [
      { id: "cocoa", name: "Cocoa", icon: "🍫", color: "bg-amber-900" },
      { id: "milk", name: "Milk", icon: "🥛", color: "bg-blue-100" },
      { id: "flour", name: "Flour", icon: "🌾", color: "bg-yellow-100" },
      { id: "beans", name: "Beans", icon: "🫘", color: "bg-red-900" }
    ],
    correctPair: ["cocoa", "milk"],
    resultType: "solution",
    resultDescription: "The cocoa dissolves! It spreads through the milk to make delicious chocolate milk!",
    funFact: "When you stir, you help the cocoa powder mix faster with the milk!"
  }
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

const G6_MixItUp: React.FC<LessonProps> = ({ onComplete }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [shuffledQuestions] = useState(() => shuffle(QUESTIONS));
  const [beakerIngredients, setBeakerIngredients] = useState<string[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [shake, setShake] = useState(false);
  const [message, setMessage] = useState("");
  const [completedCount, setCompletedCount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverBeaker, setDragOverBeaker] = useState(false);

  const correctSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/correct.mp3") : createMockAudio());
  const wrongSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/incorrect.mp3") : createMockAudio());

  const currentQuestion = shuffledQuestions[currentQuestionIndex];

  const checkMixture = () => {
    if (beakerIngredients.length !== 2) return;

    const [first, second] = beakerIngredients;
    const [correct1, correct2] = currentQuestion.correctPair;
    
    const isMatch = (first === correct1 && second === correct2) || (first === correct2 && second === correct1);

    if (isMatch) {
      setIsCorrect(true);
      setAnimating(true);
      correctSound.current.play();
      
      setTimeout(() => {
        setShowResult(true);
        setAnimating(false);
      }, 2000);
    } else {
      setIsCorrect(false);
      wrongSound.current.play();
      setShake(true);
      setMessage("That's not quite right! Try a different combination.");
      setTimeout(() => {
        setShake(false);
        setBeakerIngredients([]);
        setMessage("");
      }, 1500);
    }
  };

  useEffect(() => {
    if (beakerIngredients.length === 2 && !showResult && !animating) {
      checkMixture();
    }
  }, [beakerIngredients]);

  const handleNextQuestion = () => {
    if (currentQuestionIndex < shuffledQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setBeakerIngredients([]);
      setShowResult(false);
      setIsCorrect(false);
      setMessage("");
      setCompletedCount(prev => prev + 1);
    } else {
      setCompletedCount(prev => prev + 1);
      setIsComplete(true);
    }
  };

  const handleDropToBeaker = (ingredientId: string) => {
    if (beakerIngredients.length < 2 && !beakerIngredients.includes(ingredientId) && !showResult) {
      setBeakerIngredients(prev => [...prev, ingredientId]);
    }
  };

  const handleRemoveFromBeaker = (ingredientId: string) => {
    if (!animating && !showResult) {
      setBeakerIngredients(prev => prev.filter(id => id !== ingredientId));
    }
  };

  const onDragStart = (e: React.DragEvent<HTMLDivElement>, ingredientId: string) => {
    e.dataTransfer.setData("text/plain", ingredientId);
    e.dataTransfer.effectAllowed = "move";
    setDraggingId(ingredientId);
  };

  const onDragEnd = () => {
    setDraggingId(null);
    setDragOverBeaker(false);
  };

  const onDragOverBeaker = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverBeaker(true);
  };

  const onDragLeaveBeaker = () => {
    setDragOverBeaker(false);
  };

  const onDropBeaker = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDraggingId(null);
    setDragOverBeaker(false);
    const ingredientId = e.dataTransfer.getData("text/plain");
    if (ingredientId) {
      handleDropToBeaker(ingredientId);
    }
  };

  const onTouchStart = (ingredientId: string) => {
    setDraggingId(ingredientId);
  };

  const onTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    const beakerZone = element?.closest('[data-beaker="true"]');
    setDragOverBeaker(!!beakerZone);
  };

  const onTouchEnd = (e: React.TouchEvent<HTMLDivElement>, ingredientId: string) => {
    setDraggingId(null);
    setDragOverBeaker(false);
    
    const touch = e.changedTouches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    const beakerZone = element?.closest('[data-beaker="true"]');
    
    if (beakerZone) {
      handleDropToBeaker(ingredientId);
    }
  };

  const availableIngredients = useMemo(
    () => currentQuestion.ingredients.filter(ing => !beakerIngredients.includes(ing.id)),
    [currentQuestion, beakerIngredients]
  );

  if (isComplete) {
    return (
      <div className="p-6 text-center flex flex-col items-center justify-center h-screen bg-gradient-to-b from-purple-50 to-blue-50">
        <CheckCircle size={80} className="text-green-500 mb-4" />
        <h2 className="text-3xl font-bold text-green-800 mb-2">Amazing Work, Young Scientist!</h2>
        <p className="text-xl text-gray-700 mb-6">You've discovered how different substances mix together!</p>
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
    <div className="flex flex-col h-screen overflow-hidden bg-gradient-to-b from-purple-50 via-blue-50 to-green-50 p-4">
      <style>{shakeAnimationCss}</style>
      
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold text-purple-800 flex items-center gap-2">
            <Beaker className="text-purple-600" />
            Mix It Up! 🥣
          </h2>
          <div className="text-lg font-bold text-gray-700">
            Question {completedCount + 1} / {shuffledQuestions.length}
          </div>
        </div>
        <p className="text-lg text-gray-700 font-semibold">{currentQuestion.instruction}</p>
        {message && (
          <div className="mt-2 text-red-600 font-semibold bg-red-50 p-2 rounded text-center">
            {message}
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:flex-row gap-4 min-h-0">
        
        {/* Ingredients Panel */}
        <div className="bg-white rounded-lg shadow-lg p-4 md:w-1/2 flex flex-col">
          <h3 className="text-xl font-bold text-center mb-3 text-blue-800">
            Ingredients
          </h3>
          <div className="flex-1 grid grid-cols-2 gap-3 content-start">
            {availableIngredients.map((ingredient) => (
              <div
                key={ingredient.id}
                draggable
                onDragStart={(e) => onDragStart(e, ingredient.id)}
                onDragEnd={onDragEnd}
                onTouchStart={() => onTouchStart(ingredient.id)}
                onTouchMove={onTouchMove}
                onTouchEnd={(e) => onTouchEnd(e, ingredient.id)}
                style={{ touchAction: 'none' }}
                className={`${ingredient.color} p-4 rounded-lg cursor-grab active:cursor-grabbing shadow-md hover:shadow-lg transition-all hover:scale-105 flex flex-col items-center justify-center gap-2 ${
                  draggingId === ingredient.id ? 'opacity-30' : 'opacity-100'
                }`}
              >
                <span className="text-4xl">{ingredient.icon}</span>
                <span className="font-bold text-gray-800 text-center">{ingredient.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Beaker Panel */}
        <div className="bg-white rounded-lg shadow-lg p-4 md:w-1/2 flex flex-col">
          <h3 className="text-xl font-bold text-center mb-3 text-green-800">
            Mix in the Beaker
          </h3>
          
          <div className="flex-1 flex items-center justify-center">
            <div
              data-beaker="true"
              onDragOver={onDragOverBeaker}
              onDragLeave={onDragLeaveBeaker}
              onDrop={onDropBeaker}
              className={`relative w-48 h-64 ${shake ? 'shake' : ''} ${
                dragOverBeaker ? 'scale-110' : 'scale-100'
              } transition-transform`}
            >
              {/* Beaker SVG */}
              <svg viewBox="0 0 100 150" className="w-full h-full">
                {/* Beaker body */}
                <path
                  d="M 20 20 L 20 100 Q 20 130 50 130 Q 80 130 80 100 L 80 20 Z"
                  fill={beakerIngredients.length > 0 ? "#93c5fd" : "#e5e7eb"}
                  stroke="#374151"
                  strokeWidth="2"
                />
                {/* Beaker rim */}
                <rect x="15" y="15" width="70" height="8" fill="#9ca3af" stroke="#374151" strokeWidth="2" rx="2"/>
                
                {/* Measurement lines */}
                <line x1="25" y1="40" x2="30" y2="40" stroke="#6b7280" strokeWidth="1"/>
                <line x1="25" y1="60" x2="30" y2="60" stroke="#6b7280" strokeWidth="1"/>
                <line x1="25" y1="80" x2="30" y2="80" stroke="#6b7280" strokeWidth="1"/>
              </svg>

              {/* Ingredients in beaker */}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4">
                {beakerIngredients.map((ingId, idx) => {
                  const ing = currentQuestion.ingredients.find(i => i.id === ingId);
                  if (!ing) return null;
                  
                  return (
                    <div
                      key={ingId}
                      className={`flex items-center gap-2 ${
                        animating && isCorrect
                          ? currentQuestion.resultType === 'solution'
                            ? 'dissolve'
                            : 'settle'
                          : ''
                      }`}
                    >
                      <span className="text-3xl">{ing.icon}</span>
                      {!animating && !showResult && (
                        <button
                          onClick={() => handleRemoveFromBeaker(ingId)}
                          className="bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold"
                        >
                          ✖
                        </button>
                      )}
                    </div>
                  );
                })}
                
                {beakerIngredients.length === 0 && (
                  <div className="text-gray-400 text-center text-sm font-semibold">
                    Drop 2 ingredients here
                  </div>
                )}
                
                {animating && isCorrect && currentQuestion.resultType === 'solution' && (
                  <div className="bubble text-4xl">✨</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Result Panel */}
      {showResult && (
        <div className="bg-gradient-to-r from-green-100 to-blue-100 rounded-lg shadow-lg p-4 mt-4">
          <div className="flex items-start gap-3">
            <Sparkles className="text-green-600 flex-shrink-0 mt-1" size={32} />
            <div className="flex-1">
              <h4 className="text-xl font-bold text-green-800 mb-2">
                {currentQuestion.resultType === 'solution' ? 'Solution Formed!' : 'Mixture Created!'}
              </h4>
              <p className="text-gray-800 mb-2">{currentQuestion.resultDescription}</p>
              <p className="text-sm text-blue-800 italic">💡 {currentQuestion.funFact}</p>
            </div>
            <button
              onClick={handleNextQuestion}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors flex-shrink-0"
            >
              {currentQuestionIndex < shuffledQuestions.length - 1 ? 'Next Mix →' : 'Finish!'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default G6_MixItUp;