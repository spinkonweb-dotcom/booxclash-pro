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

type Item = {
  id: string;
  label: string;
  isMixture: boolean;
  emoji: string;
};

// Pool of items - more than needed so we can randomize
const ALL_ITEMS: Item[] = [
  // Mixtures
  { id: "trail-mix", label: "Trail Mix", isMixture: true, emoji: "🥜" },
  { id: "fruit-salad", label: "Fruit Salad", isMixture: true, emoji: "🥗" },
  { id: "cereal-bowl", label: "Bowl of Cereal", isMixture: true, emoji: "🥣" },
  { id: "sandy-water", label: "Sandy Water", isMixture: true, emoji: "💧" },
  { id: "smoothie", label: "Smoothie", isMixture: true, emoji: "🥤" },
  { id: "pizza", label: "Pizza", isMixture: true, emoji: "🍕" },
  { id: "soup", label: "Vegetable Soup", isMixture: true, emoji: "🍲" },
  { id: "trail-mix-2", label: "Mixed Nuts", isMixture: true, emoji: "🌰" },
  { id: "taco", label: "Taco", isMixture: true, emoji: "🌮" },
  { id: "salad", label: "Garden Salad", isMixture: true, emoji: "🥙" },
  
  // Not Mixtures
  { id: "apple", label: "An Apple", isMixture: false, emoji: "🍎" },
  { id: "water", label: "Glass of Water", isMixture: false, emoji: "💧" },
  { id: "rock", label: "A Rock", isMixture: false, emoji: "🪨" },
  { id: "banana", label: "A Banana", isMixture: false, emoji: "🍌" },
  { id: "orange", label: "An Orange", isMixture: false, emoji: "🍊" },
  { id: "pencil", label: "A Pencil", isMixture: false, emoji: "✏️" },
  { id: "coin", label: "A Coin", isMixture: false, emoji: "🪙" },
  { id: "milk", label: "Glass of Milk", isMixture: false, emoji: "🥛" },
  { id: "ice", label: "Ice Cube", isMixture: false, emoji: "🧊" },
  { id: "salt", label: "Salt", isMixture: false, emoji: "🧂" },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Select random items ensuring balanced mixture/non-mixture distribution
function selectRandomItems(count: number = 8): Item[] {
  const mixtures = ALL_ITEMS.filter(item => item.isMixture);
  const nonMixtures = ALL_ITEMS.filter(item => !item.isMixture);
  
  const halfCount = Math.floor(count / 2);
  const shuffledMixtures = shuffle(mixtures).slice(0, halfCount);
  const shuffledNonMixtures = shuffle(nonMixtures).slice(0, count - halfCount);
  
  return shuffle([...shuffledMixtures, ...shuffledNonMixtures]);
}

const createMockAudio = () => ({
  play: () => {},
  pause: () => {},
  currentTime: 0,
});

const G6_MixtureSorter: React.FC<LessonProps> = ({ onComplete }) => {
  const [items] = useState<Item[]>(() => selectRandomItems(8));
  const [placed, setPlaced] = useState<Record<string, 'mixture' | 'not-mixture' | null>>(() =>
    items.reduce((acc, item) => ({ ...acc, [item.id]: null }), {} as Record<string, 'mixture' | 'not-mixture' | null>)
  );
  const [isComplete, setIsComplete] = useState(false);
  
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverBin, setDragOverBin] = useState<'mixture' | 'not-mixture' | null>(null);
  const [shakeBin, setShakeBin] = useState<'mixture' | 'not-mixture' | null>(null);
  const [message, setMessage] = useState<string>("");

  const correctSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/correct.mp3") : createMockAudio());
  const wrongSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/incorrect.mp3") : createMockAudio());

  const correctCount = useMemo(() => {
    return items.reduce((count, item) => {
      const placedBin = placed[item.id];
      if (!placedBin) return count;
      const isCorrect = (item.isMixture && placedBin === 'mixture') || (!item.isMixture && placedBin === 'not-mixture');
      return isCorrect ? count + 1 : count;
    }, 0);
  }, [placed, items]);

  useEffect(() => {
    if (correctCount === items.length && !isComplete) {
      setIsComplete(true);
    }
  }, [correctCount, isComplete, items.length]);

  const handleDropLogic = (itemId: string, bin: 'mixture' | 'not-mixture') => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    const isCorrect = (item.isMixture && bin === 'mixture') || (!item.isMixture && bin === 'not-mixture');

    if (isCorrect) {
      correctSound.current.play();
      setPlaced(prev => ({ ...prev, [itemId]: bin }));
      setMessage("Correct! Great job! 🎉");
      setTimeout(() => setMessage(""), 2000);
    } else {
      wrongSound.current.play();
      setShakeBin(bin);
      setMessage("Try again! Think about whether it has different things mixed together.");
      setTimeout(() => {
        setShakeBin(null);
        setMessage("");
      }, 1500);
    }
  };

  const handleRemovePlaced = (itemId: string) => {
    setPlaced(p => ({ ...p, [itemId]: null }));
    setMessage("");
  };

  const onDragStart = (e: React.DragEvent<HTMLDivElement>, item: Item) => {
    e.dataTransfer.setData("text/plain", item.id);
    e.dataTransfer.effectAllowed = "move";
    setDraggingId(item.id);
  };

  const onDragEnd = () => {
    setDraggingId(null);
    setDragOverBin(null);
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>, bin: 'mixture' | 'not-mixture') => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverBin(bin);
  };

  const onDragLeave = () => {
    setDragOverBin(null);
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>, bin: 'mixture' | 'not-mixture') => {
    e.preventDefault();
    setDraggingId(null);
    setDragOverBin(null);
    const itemId = e.dataTransfer.getData("text/plain");
    if (itemId) {
      handleDropLogic(itemId, bin);
    }
  };

  const onTouchStart = (item: Item) => {
    setDraggingId(item.id);
  };

  const onTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    const dropBin = element?.closest('[data-bin]') as HTMLElement | null;
    setDragOverBin((dropBin?.dataset.bin as 'mixture' | 'not-mixture') || null);
  };

  const onTouchEnd = (e: React.TouchEvent<HTMLDivElement>, item: Item) => {
    setDraggingId(null);
    setDragOverBin(null);
    
    const touch = e.changedTouches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    const dropBinEl = element?.closest('[data-bin]') as HTMLElement | null;
    
    if (dropBinEl?.dataset.bin) {
      const bin = dropBinEl.dataset.bin as 'mixture' | 'not-mixture';
      handleDropLogic(item.id, bin);
    }
  };

  const remainingItems = useMemo(
    () => items.filter((item) => !placed[item.id]),
    [items, placed]
  );

  const mixtureItems = useMemo(
    () => items.filter((item) => placed[item.id] === 'mixture'),
    [items, placed]
  );

  const notMixtureItems = useMemo(
    () => items.filter((item) => placed[item.id] === 'not-mixture'),
    [items, placed]
  );

  if (isComplete) {
    return (
      <div className="p-6 text-center flex flex-col items-center justify-center h-screen bg-gradient-to-b from-green-50 to-blue-50">
        <CheckCircle size={80} className="text-green-500 mb-4" />
        <h2 className="text-3xl font-bold text-green-800 mb-2">Excellent Work!</h2>
        <p className="text-xl text-gray-700 mb-6">You've sorted all the mixtures correctly!</p>
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
    <div className="flex flex-col h-screen bg-gradient-to-b from-purple-50 to-pink-50 overflow-hidden">
      <style>{shakeAnimationCss}</style>
      
      {/* Header with Instructions and Progress */}
      <div className="bg-white shadow-lg p-4">
        <h2 className="text-2xl md:text-3xl font-bold text-center text-purple-800 mb-2">
          Mixture Sorter 🥗
        </h2>
        <p className="text-center text-gray-700 mb-3 text-sm md:text-base">
          Drag each item to the correct bin. A mixture has different things mixed together!
        </p>
        
        <div className="flex justify-between items-center max-w-4xl mx-auto">
          <div className="text-base md:text-lg font-bold text-gray-700">
            Progress: {correctCount} / {items.length}
          </div>
          {message && (
            <div className={`font-semibold p-2 rounded text-sm md:text-base ${
              message.includes("Correct") ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"
            }`}>
              {message}
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:flex-row gap-4 p-4 overflow-hidden">
        
        {/* Items to Sort Panel */}
        <div className="bg-white rounded-lg shadow-lg p-3 md:p-4 flex-shrink-0 md:w-64">
          <h3 className="text-lg md:text-xl font-bold text-center mb-3 text-blue-800">
            Items to Sort
          </h3>
          <div className="flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-y-auto max-h-[120px] md:max-h-full">
            {remainingItems.map((item) => (
              <div
                key={item.id}
                draggable
                onDragStart={(e) => onDragStart(e, item)}
                onDragEnd={onDragEnd}
                onTouchStart={() => onTouchStart(item)}
                onTouchMove={onTouchMove}
                onTouchEnd={(e) => onTouchEnd(e, item)}
                style={{ touchAction: 'none' }}
                className={`bg-gradient-to-r from-blue-400 to-purple-400 text-white p-2 md:p-3 rounded-lg cursor-grab active:cursor-grabbing shadow-md hover:shadow-lg transition-all hover:scale-105 font-semibold text-center flex-shrink-0 ${
                  draggingId === item.id ? 'opacity-30' : 'opacity-100'
                }`}
              >
                <div className="text-2xl mb-1">{item.emoji}</div>
                <div className="text-xs md:text-sm">{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Sorting Bins */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 min-h-0">
          
          {/* Mixture Bin */}
          <div
            data-bin="mixture"
            onDragOver={(e) => onDragOver(e, 'mixture')}
            onDragLeave={onDragLeave}
            onDrop={(e) => onDrop(e, 'mixture')}
            className={`bg-white rounded-lg shadow-lg p-4 border-4 transition-all duration-200 flex flex-col ${
              shakeBin === 'mixture' ? 'shake' : ''
            } ${
              dragOverBin === 'mixture' 
                ? 'border-yellow-400 bg-yellow-50 scale-105' 
                : 'border-green-500'
            }`}
          >
            <div className="text-center mb-3">
              <h3 className="text-xl md:text-2xl font-bold text-green-800 mb-1">
                🥗 Mixture Bin
              </h3>
              <p className="text-xs md:text-sm text-gray-600">
                Things with different parts mixed together
              </p>
            </div>
            
            <div className="flex-1 border-2 border-dashed border-green-300 rounded-lg p-2 bg-green-50 overflow-y-auto">
              <div className="grid grid-cols-2 gap-2">
                {mixtureItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-green-200 p-2 rounded-lg relative"
                  >
                    <button
                      onClick={() => handleRemovePlaced(item.id)}
                      className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shadow-lg"
                      aria-label={`Remove ${item.label}`}
                    >
                      ✖
                    </button>
                    <div className="text-2xl text-center mb-1">{item.emoji}</div>
                    <div className="text-xs text-center font-semibold">{item.label}</div>
                  </div>
                ))}
              </div>
              {mixtureItems.length === 0 && (
                <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                  Drop mixtures here
                </div>
              )}
            </div>
          </div>

          {/* Not Mixture Bin */}
          <div
            data-bin="not-mixture"
            onDragOver={(e) => onDragOver(e, 'not-mixture')}
            onDragLeave={onDragLeave}
            onDrop={(e) => onDrop(e, 'not-mixture')}
            className={`bg-white rounded-lg shadow-lg p-4 border-4 transition-all duration-200 flex flex-col ${
              shakeBin === 'not-mixture' ? 'shake' : ''
            } ${
              dragOverBin === 'not-mixture' 
                ? 'border-yellow-400 bg-yellow-50 scale-105' 
                : 'border-blue-500'
            }`}
          >
            <div className="text-center mb-3">
              <h3 className="text-xl md:text-2xl font-bold text-blue-800 mb-1">
                🍎 Not a Mixture Bin
              </h3>
              <p className="text-xs md:text-sm text-gray-600">
                Single things, not mixed
              </p>
            </div>
            
            <div className="flex-1 border-2 border-dashed border-blue-300 rounded-lg p-2 bg-blue-50 overflow-y-auto">
              <div className="grid grid-cols-2 gap-2">
                {notMixtureItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-blue-200 p-2 rounded-lg relative"
                  >
                    <button
                      onClick={() => handleRemovePlaced(item.id)}
                      className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shadow-lg"
                      aria-label={`Remove ${item.label}`}
                    >
                      ✖
                    </button>
                    <div className="text-2xl text-center mb-1">{item.emoji}</div>
                    <div className="text-xs text-center font-semibold">{item.label}</div>
                  </div>
                ))}
              </div>
              {notMixtureItems.length === 0 && (
                <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                  Drop non-mixtures here
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default G6_MixtureSorter;