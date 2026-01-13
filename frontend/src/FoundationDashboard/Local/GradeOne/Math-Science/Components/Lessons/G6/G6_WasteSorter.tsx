import React, { useState, useEffect, useRef, useMemo } from 'react';
import { CheckCircle, Trash2, Leaf, Recycle } from 'lucide-react';

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

type WasteItem = {
  id: string;
  name: string;
  emoji: string;
  correctBin: 'compost' | 'recycle' | 'landfill';
};

type Bin = {
  id: 'compost' | 'recycle' | 'landfill';
  name: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
};

// Expanded item pool - each question will use 5 unique items
const QUESTION_SETS: WasteItem[][] = [
  // Set 1: School Lunch
  [
    { id: "apple-core", name: "Apple Core", emoji: "🍎", correctBin: "compost" },
    { id: "yogurt-cup", name: "Yogurt Cup", emoji: "🥤", correctBin: "recycle" },
    { id: "juice-box", name: "Juice Box", emoji: "🧃", correctBin: "recycle" },
    { id: "plastic-wrapper", name: "Plastic Wrapper", emoji: "🎁", correctBin: "landfill" },
    { id: "banana-peel", name: "Banana Peel", emoji: "🍌", correctBin: "compost" },
  ],
  // Set 2: Picnic Day
  [
    { id: "soda-can", name: "Soda Can", emoji: "🥫", correctBin: "recycle" },
    { id: "napkin", name: "Used Napkin", emoji: "🧻", correctBin: "landfill" },
    { id: "orange-peel", name: "Orange Peel", emoji: "🍊", correctBin: "compost" },
    { id: "cardboard", name: "Pizza Box", emoji: "📦", correctBin: "recycle" },
    { id: "straw", name: "Plastic Straw", emoji: "🥤", correctBin: "landfill" },
  ],
  // Set 3: Snack Time
  [
    { id: "newspaper", name: "Newspaper", emoji: "📰", correctBin: "recycle" },
    { id: "chip-bag", name: "Chip Bag", emoji: "🍿", correctBin: "landfill" },
    { id: "carrot-top", name: "Carrot Scraps", emoji: "🥕", correctBin: "compost" },
    { id: "glass-bottle", name: "Glass Bottle", emoji: "🍾", correctBin: "recycle" },
    { id: "eggshell", name: "Eggshells", emoji: "🥚", correctBin: "compost" },
  ],
  // Set 4: Party Cleanup
  [
    { id: "watermelon", name: "Watermelon Rind", emoji: "🍉", correctBin: "compost" },
    { id: "paper-plate", name: "Paper Plate", emoji: "🍽️", correctBin: "compost" },
    { id: "aluminum-foil", name: "Aluminum Foil", emoji: "🧊", correctBin: "recycle" },
    { id: "balloon", name: "Popped Balloon", emoji: "🎈", correctBin: "landfill" },
    { id: "water-bottle", name: "Water Bottle", emoji: "💧", correctBin: "recycle" },
  ],
  // Set 5: Kitchen Cleanup
  [
    { id: "coffee-grounds", name: "Coffee Grounds", emoji: "☕", correctBin: "compost" },
    { id: "tin-can", name: "Tin Can", emoji: "🥫", correctBin: "recycle" },
    { id: "styrofoam", name: "Styrofoam Cup", emoji: "🥡", correctBin: "landfill" },
    { id: "bread-crust", name: "Bread Crusts", emoji: "🍞", correctBin: "compost" },
    { id: "cereal-box", name: "Cereal Box", emoji: "📦", correctBin: "recycle" },
  ],
  // Set 6: Garden Waste
  [
    { id: "leaves", name: "Fallen Leaves", emoji: "🍂", correctBin: "compost" },
    { id: "plastic-bag", name: "Plastic Bag", emoji: "🛍️", correctBin: "landfill" },
    { id: "milk-carton", name: "Milk Carton", emoji: "🥛", correctBin: "recycle" },
    { id: "grass-clippings", name: "Grass Clippings", emoji: "🌿", correctBin: "compost" },
    { id: "soda-bottle", name: "Plastic Bottle", emoji: "🧴", correctBin: "recycle" },
  ],
  // Set 7: Breakfast Time
  [
    { id: "tea-bag", name: "Used Tea Bag", emoji: "🍵", correctBin: "compost" },
    { id: "foil-wrapper", name: "Candy Wrapper", emoji: "🍬", correctBin: "landfill" },
    { id: "paper-bag", name: "Paper Bag", emoji: "📄", correctBin: "recycle" },
    { id: "fruit-scraps", name: "Fruit Peels", emoji: "🍇", correctBin: "compost" },
    { id: "metal-lid", name: "Metal Lid", emoji: "🔘", correctBin: "recycle" },
  ],
  // Set 8: Office Cleanup
  [
    { id: "shredded-paper", name: "Shredded Paper", emoji: "📃", correctBin: "recycle" },
    { id: "sticky-notes", name: "Sticky Notes", emoji: "📝", correctBin: "landfill" },
    { id: "lunch-leftovers", name: "Food Leftovers", emoji: "🍱", correctBin: "compost" },
    { id: "empty-pen", name: "Empty Pen", emoji: "🖊️", correctBin: "landfill" },
    { id: "cardboard-tube", name: "Paper Tube", emoji: "🧻", correctBin: "recycle" },
  ],
  // Set 9: Beach Day
  [
    { id: "coconut-shell", name: "Coconut Shell", emoji: "🥥", correctBin: "compost" },
    { id: "flip-flop", name: "Broken Sandal", emoji: "🩴", correctBin: "landfill" },
    { id: "beer-can", name: "Aluminum Can", emoji: "🍺", correctBin: "recycle" },
    { id: "seaweed", name: "Seaweed", emoji: "🌊", correctBin: "compost" },
    { id: "magazine", name: "Magazine", emoji: "📖", correctBin: "recycle" },
  ],
  // Set 10: Craft Time
  [
    { id: "pumpkin-guts", name: "Pumpkin Insides", emoji: "🎃", correctBin: "compost" },
    { id: "glitter-glue", name: "Glitter Tube", emoji: "✨", correctBin: "landfill" },
    { id: "cardboard-box", name: "Cardboard Box", emoji: "📦", correctBin: "recycle" },
    { id: "potato-peels", name: "Potato Peels", emoji: "🥔", correctBin: "compost" },
    { id: "jar", name: "Glass Jar", emoji: "🫙", correctBin: "recycle" },
  ],
];

const createMockAudio = () => ({
  play: () => {},
  pause: () => {},
  currentTime: 0,
});

const G6_WasteSorter: React.FC<LessonProps> = ({ onComplete }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentItems, setCurrentItems] = useState<WasteItem[]>([]);
  const [placed, setPlaced] = useState<Record<string, string[]>>({
    compost: [],
    recycle: [],
    landfill: [],
  });
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverBin, setDragOverBin] = useState<string | null>(null);
  const [shakeBin, setShakeBin] = useState<string | null>(null);
  const [message, setMessage] = useState<string>("");

  const correctSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/correct.mp3") : createMockAudio());
  const wrongSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/incorrect.mp3") : createMockAudio());

  // Initialize first question
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * QUESTION_SETS.length);
    setCurrentItems(QUESTION_SETS[randomIndex]);
  }, []);

  const BINS: Bin[] = [
    { 
      id: 'compost', 
      name: 'Compost', 
      icon: <Leaf size={32} />, 
      color: 'text-green-700',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-500'
    },
    { 
      id: 'recycle', 
      name: 'Recycle', 
      icon: <Recycle size={32} />, 
      color: 'text-blue-700',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-500'
    },
    { 
      id: 'landfill', 
      name: 'Landfill', 
      icon: <Trash2 size={32} />, 
      color: 'text-gray-700',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-500'
    },
  ];

  const allItemsPlaced = useMemo(() => {
    const totalPlaced = Object.values(placed).reduce((sum, arr) => sum + arr.length, 0);
    return totalPlaced === currentItems.length;
  }, [placed, currentItems]);

  const allCorrect = useMemo(() => {
    return currentItems.every(item => {
      return placed[item.correctBin]?.includes(item.id);
    });
  }, [placed, currentItems]);

  const handleDropLogic = (itemId: string, binId: string) => {
    const item = currentItems.find(i => i.id === itemId);
    if (!item) return;

    if (binId === item.correctBin) {
      correctSound.current.play();
      setPlaced(prev => {
        const updated = { ...prev };
        // Remove item from any other bin
        for (const b of Object.keys(updated)) {
          updated[b] = updated[b].filter(id => id !== itemId);
        }
        // Add to correct bin
        if (!updated[binId].includes(itemId)) {
          updated[binId] = [...updated[binId], itemId];
        }
        return updated;
      });
      setMessage("Great job! ✓");
      setTimeout(() => setMessage(""), 1500);
    } else {
      wrongSound.current.play();
      setShakeBin(binId);
      setMessage("Not quite! Try another bin.");
      setTimeout(() => {
        setShakeBin(null);
        setMessage("");
      }, 1500);
    }
  };

  const handleRemovePlaced = (binId: string, itemId: string) => {
    setPlaced(p => ({
      ...p,
      [binId]: p[binId].filter(id => id !== itemId)
    }));
    setMessage("");
  };

  const handleNextQuestion = () => {
    if (allCorrect) {
      const newCorrectCount = correctAnswers + 1;
      setCorrectAnswers(newCorrectCount);
      
      if (newCorrectCount >= 5) {
        setIsComplete(true);
      } else {
        // Load next random question
        let newIndex;
        do {
          newIndex = Math.floor(Math.random() * QUESTION_SETS.length);
        } while (newIndex === currentQuestionIndex && QUESTION_SETS.length > 1);
        
        setCurrentQuestionIndex(newIndex);
        setCurrentItems(QUESTION_SETS[newIndex]);
        setPlaced({ compost: [], recycle: [], landfill: [] });
        setMessage("");
      }
    }
  };

  const onDragStart = (e: React.DragEvent<HTMLDivElement>, item: WasteItem) => {
    e.dataTransfer.setData("text/plain", item.id);
    e.dataTransfer.effectAllowed = "move";
    setDraggingId(item.id);
  };

  const onDragEnd = () => {
    setDraggingId(null);
    setDragOverBin(null);
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>, binId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverBin(binId);
  };

  const onDragLeave = () => {
    setDragOverBin(null);
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>, binId: string) => {
    e.preventDefault();
    setDraggingId(null);
    setDragOverBin(null);
    const itemId = e.dataTransfer.getData("text/plain");
    if (itemId) {
      handleDropLogic(itemId, binId);
    }
  };

  const onTouchStart = (item: WasteItem) => {
    setDraggingId(item.id);
  };

  const onTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    const dropBin = element?.closest('[data-binid]') as HTMLElement | null;
    setDragOverBin(dropBin?.dataset.binid || null);
  };

  const onTouchEnd = (e: React.TouchEvent<HTMLDivElement>, item: WasteItem) => {
    setDraggingId(null);
    setDragOverBin(null);
    
    const touch = e.changedTouches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    const dropBinEl = element?.closest('[data-binid]') as HTMLElement | null;
    
    if (dropBinEl?.dataset.binid) {
      handleDropLogic(item.id, dropBinEl.dataset.binid);
    }
  };

  const remainingItems = useMemo(
    () => {
      const allPlacedIds = Object.values(placed).flat();
      return currentItems.filter((it) => !allPlacedIds.includes(it.id));
    },
    [currentItems, placed]
  );

  if (isComplete) {
    return (
      <div className="p-6 text-center flex flex-col items-center justify-center h-screen bg-gradient-to-b from-green-50 to-blue-50">
        <CheckCircle size={80} className="text-green-500 mb-4" />
        <h2 className="text-3xl font-bold text-green-800 mb-2">Excellent Work!</h2>
        <p className="text-xl text-gray-700 mb-6">You're now a recycling expert! 🌍♻️</p>
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
    <div className="flex flex-col h-screen overflow-hidden bg-gradient-to-b from-green-50 to-blue-50">
      <style>{shakeAnimationCss}</style>
      
      {/* Fixed height container */}
      <div className="flex flex-col h-full p-4 gap-3">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-3">
          <h2 className="text-xl md:text-2xl font-bold text-center text-green-800 mb-2">
            🗑️ Waste Sorter Challenge
          </h2>
          <div className="flex justify-between items-center text-sm md:text-base">
            <div className="font-bold text-gray-700">
              Question: {correctAnswers + 1} / 5
            </div>
            {message && (
              <div className={`font-semibold px-3 py-1 rounded ${
                message.includes('Great') ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'
              }`}>
                {message}
              </div>
            )}
          </div>
        </div>

        {/* Draggable Items Area */}
        <div className="bg-white rounded-lg shadow-lg p-3 min-h-0">
          <h3 className="text-base md:text-lg font-bold text-center mb-2 text-purple-800">
            Sort These Items:
          </h3>
          <div className="flex flex-wrap justify-center gap-2 min-h-[60px]">
            {remainingItems.map((item) => (
              <div
                key={item.id}
                draggable
                onDragStart={(e) => onDragStart(e, item)}
                onDragEnd={onDragEnd}
                onTouchStart={(e) => {
                  e.preventDefault();
                  onTouchStart(item);
                }}
                onTouchMove={(e) => {
                  e.preventDefault();
                  onTouchMove(e);
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  onTouchEnd(e, item);
                }}
                style={{ touchAction: 'none' }}
                className={`bg-gradient-to-r from-purple-400 to-pink-400 text-white p-2 px-4 rounded-lg cursor-grab active:cursor-grabbing shadow-md hover:shadow-lg transition-all hover:scale-105 font-semibold text-center text-sm md:text-base ${
                  draggingId === item.id ? 'opacity-30' : 'opacity-100'
                }`}
              >
                <div className="text-2xl mb-1">{item.emoji}</div>
                <div className="text-xs">{item.name}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Bins Area - Flexible height */}
        <div className="flex-1 bg-white rounded-lg shadow-lg p-3 min-h-0 overflow-hidden">
          <h3 className="text-base md:text-lg font-bold text-center mb-2 text-blue-800">
            Drop Into Correct Bins:
          </h3>
          
          <div className="grid grid-cols-3 gap-2 h-[calc(100%-2rem)]">
            {BINS.map((bin) => {
              const placedItemIds = placed[bin.id] || [];
              const placedItems = placedItemIds.map(id => currentItems.find(it => it.id === id)).filter(Boolean) as WasteItem[];
              
              return (
                <div
                  key={bin.id}
                  data-binid={bin.id}
                  onDragOver={(e) => onDragOver(e, bin.id)}
                  onDragLeave={onDragLeave}
                  onDrop={(e) => onDrop(e, bin.id)}
                  className={`relative p-2 rounded-lg border-4 transition-all duration-200 flex flex-col items-center ${
                    shakeBin === bin.id ? 'shake' : ''
                  } ${
                    placedItems.length > 0
                      ? `${bin.bgColor} ${bin.borderColor}` 
                      : dragOverBin === bin.id 
                        ? 'bg-yellow-100 border-yellow-400 scale-105' 
                        : 'bg-gray-50 border-dashed border-gray-300'
                  }`}
                >
                  <div className={`${bin.color} mb-1`}>{bin.icon}</div>
                  <div className={`font-bold text-xs md:text-sm ${bin.color}`}>{bin.name}</div>
                  
                  {placedItems.length > 0 ? (
                    <div className="mt-2 flex flex-col gap-1 w-full overflow-y-auto">
                      {placedItems.map(item => (
                        <div key={item.id} className="bg-white rounded p-1 text-center relative">
                          <div className="text-2xl">{item.emoji}</div>
                          <div className="text-xs font-semibold">{item.name}</div>
                          <button
                            onClick={() => handleRemovePlaced(bin.id, item.id)}
                            className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shadow-lg"
                            aria-label={`Remove ${item.name}`}
                          >
                            ✖
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-2 text-gray-400 text-xs text-center">
                      Drop here
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Next Button */}
        {allItemsPlaced && (
          <div className="text-center">
            <button
              onClick={handleNextQuestion}
              disabled={!allCorrect}
              className={`font-bold py-2 px-6 rounded-lg text-base md:text-lg transition-all ${
                allCorrect
                  ? 'bg-green-600 hover:bg-green-700 text-white cursor-pointer'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {allCorrect ? '✓ Next Question' : '❌ Fix Mistakes First'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default G6_WasteSorter;