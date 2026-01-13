import React, { useState, useEffect, useRef, useMemo } from 'react';
import { CheckCircle, ShoppingCart, Trash2 } from 'lucide-react';

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

type ShoppingItem = {
  id: string;
  emoji: string;
  name: string;
};

type Question = {
  id: number;
  item1: ShoppingItem;
  count1: number;
  item2: ShoppingItem;
  count2: number;
  correctAnswer: number;
  question: string;
};

const ITEMS: ShoppingItem[] = [
  { id: "apple", emoji: "🍎", name: "apple" },
  { id: "banana", emoji: "🍌", name: "banana" },
  { id: "orange", emoji: "🍊", name: "orange" },
  { id: "carrot", emoji: "🥕", name: "carrot" },
  { id: "bread", emoji: "🍞", name: "bread" },
  { id: "milk", emoji: "🥛", name: "milk" },
  { id: "egg", emoji: "🥚", name: "egg" },
  { id: "cheese", emoji: "🧀", name: "cheese" },
  { id: "tomato", emoji: "🍅", name: "tomato" },
  { id: "grapes", emoji: "🍇", name: "grapes" }
];

function generateQuestions(): Question[] {
  const questions: Question[] = [];
  const usedPairs = new Set<string>();
  
  for (let i = 0; i < 5; i++) {
    let item1: ShoppingItem, item2: ShoppingItem, count1: number, count2: number;
    let pairKey: string;
    
    do {
      item1 = ITEMS[Math.floor(Math.random() * ITEMS.length)];
      do {
        item2 = ITEMS[Math.floor(Math.random() * ITEMS.length)];
      } while (item2.id === item1.id);
      
      count1 = Math.floor(Math.random() * 5) + 2; // 2-6
      count2 = Math.floor(Math.random() * 5) + 2; // 2-6
      
      pairKey = [item1.id, item2.id, count1, count2].sort().join('-');
    } while (usedPairs.has(pairKey));
    
    usedPairs.add(pairKey);
    
    const plural1 = count1 > 1 ? `${item1.name}s` : item1.name;
    const plural2 = count2 > 1 ? `${item2.name}s` : item2.name;
    
    questions.push({
      id: i + 1,
      item1,
      count1,
      item2,
      count2,
      correctAnswer: count1 + count2,
      question: `You need ${count1} ${plural1} and ${count2} ${plural2}. How many items in total?`
    });
  }
  
  return questions;
}

const createMockAudio = () => ({
  play: () => {},
  pause: () => {},
  currentTime: 0,
});

const G6_ShoppingCartAddUp: React.FC<LessonProps> = ({ onComplete }) => {
  const [questions] = useState<Question[]>(() => generateQuestions());
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [cart, setCart] = useState<string[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [message, setMessage] = useState<string>("");
  const [shakeCart, setShakeCart] = useState(false);
  const [completedQuestions, setCompletedQuestions] = useState(0);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [isOverCart, setIsOverCart] = useState(false);

  const correctSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/correct.mp3") : createMockAudio());
  const wrongSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/incorrect.mp3") : createMockAudio());

  const currentQuestion = questions[currentQuestionIndex];
  const isComplete = completedQuestions === questions.length;

  // Generate available items based on current question
  const availableItems = useMemo(() => {
    const items: Array<{ id: string; emoji: string; type: string }> = [];
    for (let i = 0; i < currentQuestion.count1; i++) {
      items.push({ 
        id: `${currentQuestion.item1.id}-${i}`, 
        emoji: currentQuestion.item1.emoji,
        type: currentQuestion.item1.id
      });
    }
    for (let i = 0; i < currentQuestion.count2; i++) {
      items.push({ 
        id: `${currentQuestion.item2.id}-${i}`, 
        emoji: currentQuestion.item2.emoji,
        type: currentQuestion.item2.id
      });
    }
    return items;
  }, [currentQuestion]);

  const remainingItems = useMemo(
    () => availableItems.filter(item => !cart.includes(item.id)),
    [availableItems, cart]
  );

  const allItemsInCart = remainingItems.length === 0;

  // Generate answer options
  const answerOptions = useMemo(() => {
    const correct = currentQuestion.correctAnswer;
    const options = [correct];
    
    while (options.length < 4) {
      const offset = Math.floor(Math.random() * 5) - 2;
      const option = correct + offset;
      if (option > 0 && option !== correct && !options.includes(option)) {
        options.push(option);
      }
    }
    
    return options.sort((a, b) => a - b);
  }, [currentQuestion]);

  const handleCheckAnswer = () => {
    if (selectedAnswer === null) {
      setMessage("Please select an answer!");
      return;
    }

    if (selectedAnswer === currentQuestion.correctAnswer) {
      correctSound.current.play();
      setMessage("🎉 Correct! Great job!");
      
      setTimeout(() => {
        if (currentQuestionIndex < questions.length - 1) {
          setCurrentQuestionIndex(prev => prev + 1);
          setCart([]);
          setSelectedAnswer(null);
          setMessage("");
          setCompletedQuestions(prev => prev + 1);
        } else {
          setCompletedQuestions(prev => prev + 1);
        }
      }, 1500);
    } else {
      wrongSound.current.play();
      setShakeCart(true);
      setMessage("❌ Try again! Count the items in your cart.");
      setTimeout(() => {
        setShakeCart(false);
        setMessage("");
      }, 1500);
    }
  };

  // Drag handlers for items
  const onDragStart = (e: React.DragEvent<HTMLDivElement>, itemId: string) => {
    e.dataTransfer.setData("text/plain", itemId);
    e.dataTransfer.effectAllowed = "move";
    setDraggingId(itemId);
  };

  const onDragEnd = () => {
    setDraggingId(null);
    setIsOverCart(false);
  };

  const onDragOverCart = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setIsOverCart(true);
  };

  const onDragLeaveCart = () => {
    setIsOverCart(false);
  };

  const onDropCart = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDraggingId(null);
    setIsOverCart(false);
    const itemId = e.dataTransfer.getData("text/plain");
    if (itemId && !cart.includes(itemId)) {
      setCart(prev => [...prev, itemId]);
    }
  };

  // Touch handlers
  const onTouchStart = (itemId: string) => {
    setDraggingId(itemId);
  };

  const onTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    const cartZone = element?.closest('[data-cart="true"]');
    setIsOverCart(!!cartZone);
  };

  const onTouchEnd = (e: React.TouchEvent<HTMLDivElement>, itemId: string) => {
    setDraggingId(null);
    setIsOverCart(false);
    
    const touch = e.changedTouches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    const cartZone = element?.closest('[data-cart="true"]');
    
    if (cartZone && !cart.includes(itemId)) {
      setCart(prev => [...prev, itemId]);
    }
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(id => id !== itemId));
  };

  const clearCart = () => {
    setCart([]);
  };

  if (isComplete) {
    return (
      <div className="p-6 text-center flex flex-col items-center justify-center h-screen bg-gradient-to-b from-green-50 to-blue-50">
        <CheckCircle size={80} className="text-green-500 mb-4" />
        <h2 className="text-3xl font-bold text-green-800 mb-2">Excellent Work!</h2>
        <p className="text-xl text-gray-700 mb-6">You've completed all the shopping problems!</p>
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
    <div className="flex flex-col h-screen overflow-hidden bg-gradient-to-b from-yellow-50 to-orange-50">
      <style>{shakeAnimationCss}</style>
      
      {/* Header */}
      <div className="bg-white shadow-md p-4">
        <div className="flex justify-between items-center max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-orange-800 flex items-center gap-2">
            <ShoppingCart size={32} />
            Shopping Cart Add-Up
          </h2>
          <div className="text-lg font-bold text-gray-700">
            Question {currentQuestionIndex + 1} / {questions.length}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden p-4">
        <div className="max-w-6xl mx-auto h-full flex flex-col gap-4">
          
          {/* Question Panel */}
          <div className="bg-white rounded-lg shadow-lg p-4">
            <p className="text-xl font-semibold text-center text-gray-800">
              {currentQuestion.question}
            </p>
            {message && (
              <div className={`mt-3 text-center font-bold text-lg ${
                message.includes("Correct") ? "text-green-600" : "text-red-600"
              }`}>
                {message}
              </div>
            )}
          </div>

          {/* Items and Cart Row */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 min-h-0">
            
            {/* Available Items */}
            <div className="bg-white rounded-lg shadow-lg p-4 flex flex-col overflow-hidden">
              <h3 className="text-xl font-bold text-center mb-3 text-purple-800">
                Available Items
              </h3>
              <div className="flex-1 overflow-y-auto">
                <div className="flex flex-wrap justify-center gap-3 p-2">
                  {remainingItems.map((item) => (
                    <div
                      key={item.id}
                      draggable
                      onDragStart={(e) => onDragStart(e, item.id)}
                      onDragEnd={onDragEnd}
                      onTouchStart={() => onTouchStart(item.id)}
                      onTouchMove={onTouchMove}
                      onTouchEnd={(e) => onTouchEnd(e, item.id)}
                      style={{ touchAction: 'none' }}
                      className={`text-6xl cursor-grab active:cursor-grabbing transition-all hover:scale-110 ${
                        draggingId === item.id ? 'opacity-30' : 'opacity-100'
                      }`}
                    >
                      {item.emoji}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Shopping Cart */}
            <div className="bg-white rounded-lg shadow-lg p-4 flex flex-col overflow-hidden">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xl font-bold text-green-800 flex items-center gap-2">
                  <ShoppingCart size={24} />
                  Cart ({cart.length})
                </h3>
                {cart.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-sm flex items-center gap-1"
                  >
                    <Trash2 size={16} />
                    Clear
                  </button>
                )}
              </div>
              <div
                data-cart="true"
                onDragOver={onDragOverCart}
                onDragLeave={onDragLeaveCart}
                onDrop={onDropCart}
                className={`flex-1 border-4 border-dashed rounded-lg transition-all overflow-y-auto ${
                  shakeCart ? 'shake' : ''
                } ${
                  isOverCart
                    ? 'bg-yellow-100 border-yellow-400'
                    : cart.length > 0
                    ? 'bg-green-50 border-green-400'
                    : 'bg-gray-50 border-gray-300'
                }`}
              >
                {cart.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-400 text-lg">
                    Drag items here
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-3 p-4">
                    {cart.map((itemId) => {
                      const item = availableItems.find(i => i.id === itemId);
                      return (
                        <div key={itemId} className="relative group">
                          <div className="text-5xl">{item?.emoji}</div>
                          <button
                            onClick={() => removeFromCart(itemId)}
                            className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ✖
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Answer Section */}
          {allItemsInCart && (
            <div className="bg-white rounded-lg shadow-lg p-4">
              <h3 className="text-lg font-bold text-center mb-3 text-blue-800">
                Select the total number of items:
              </h3>
              <div className="flex justify-center gap-4 mb-4">
                {answerOptions.map(option => (
                  <button
                    key={option}
                    onClick={() => setSelectedAnswer(option)}
                    className={`text-2xl font-bold py-3 px-6 rounded-lg transition-all ${
                      selectedAnswer === option
                        ? 'bg-blue-600 text-white scale-110'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
              <div className="flex justify-center">
                <button
                  onClick={handleCheckAnswer}
                  disabled={selectedAnswer === null}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-3 px-8 rounded-lg text-xl transition-colors"
                >
                  Check Answer
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default G6_ShoppingCartAddUp;