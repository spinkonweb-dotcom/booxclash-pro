import React, { useState, useEffect, useRef } from "react";
import { CheckCircle, RotateCcw } from "lucide-react";
import confetti from "canvas-confetti";

interface LessonProps {
  onComplete: () => void;
}

// --- DATA STRUCTURES ---

type ItemCategory = 'nature' | 'recycle';
type ItemType = 'ten' | 'one';

type ChallengeItem = {
  id: string;
  name: string;
  emoji: string;
  category: ItemCategory;
};

// --- GAME DATA ---

const CHALLENGE_ITEMS: ChallengeItem[] = [
  { id: "bottle", name: "Bottle", emoji: "🍾", category: "recycle" },
  { id: "flower", name: "Flower", emoji: "🌸", category: "nature" },
  { id: "paper", name: "Newspaper", emoji: "📰", category: "recycle" },
  { id: "rock", name: "Rock", emoji: "🪨", category: "nature" },
  { id: "wrapper", name: "Wrapper", emoji: "🍬", category: "recycle" }, // Note: In RecyclingSortGame this was trash, but for this simple sort, we'll call it recycle.
  { id: "can", name: "Can", emoji: "🥫", category: "recycle" },
  { id: "leaf", name: "Leaf", emoji: "🍁", category: "nature" },
];

const BINS: { category: ItemCategory; emoji: string; label: string; color: string; highlight: string; }[] = [
  { category: "nature", emoji: "🌳", label: "Nature", color: "bg-green-700", highlight: "border-lime-400" },
  { category: "recycle", emoji: "♻️", label: "Recycle", color: "bg-blue-700", highlight: "border-sky-400" },
];

const POINTS_PER_ITEM = 5;

// Helper to shuffle an array
const shuffleArray = <T,>(array: T[]): T[] => {
  return [...array].sort(() => Math.random() - 0.5);
};

// --- COMPONENT ---

const TheBigChallengeGame: React.FC<LessonProps> = ({ onComplete }) => {
  // --- STATE ---
  const [stage, setStage] = useState<1 | 2 | 3>(1);
  const [isGameComplete, setIsGameComplete] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

  // Stage 1: Sorting
  const [unsortedItems, setUnsortedItems] = useState<ChallengeItem[]>([]);
  const [sortedItems, setSortedItems] = useState<{ [key in ItemCategory]: ChallengeItem[] }>({ nature: [], recycle: [] });
  const [draggingItemId, setDraggingItemId] = useState<string | null>(null);
  const [dragOverBin, setDragOverBin] = useState<ItemCategory | null>(null);

  // Stage 2: Counting
  const [recycleCount, setRecycleCount] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [scoreOptions, setScoreOptions] = useState<number[]>([]);
  const [wrongSelection, setWrongSelection] = useState<number | null>(null);

  // Stage 3: Place Value
  const [tensInZone, setTensInZone] = useState(0);
  const [onesInZone, setOnesInZone] = useState(0);
  const [draggingItem, setDraggingItem] = useState<ItemType | null>(null);
  const [dragOverZone, setDragOverZone] = useState(false);
  
  // --- SOUNDS ---
  const createMockAudio = () => ({
    play: () => { /* console.log("Audio play mock") */ },
    pause: () => { /* console.log("Audio pause mock") */ },
    currentTime: 0,
  });

  const correctSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/correct.mp3") : createMockAudio());
  const wrongSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/incorrect.mp3") : createMockAudio());
  const clapSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/clap.mp3") : createMockAudio());
  const popSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/pop.mp3") : createMockAudio());

  // --- GAME SETUP ---
  useEffect(() => {
    const gameItems = shuffleArray(CHALLENGE_ITEMS).slice(0, 5); // Start with 5 items
    setUnsortedItems(gameItems);
    // Reset all states
    setStage(1);
    setSortedItems({ nature: [], recycle: [] });
    setFeedback(null);
    setRecycleCount(0);
    setTotalScore(0);
    setScoreOptions([]);
    setTensInZone(0);
    setOnesInZone(0);
    setIsGameComplete(false);
  }, []);

  // --- STAGE 1: DRAG & DROP LOGIC ---
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, item: ChallengeItem) => {
    e.dataTransfer.setData("itemId", item.id);
    setDraggingItemId(item.id);
  };

  const handleDragEnd = () => {
    setDraggingItemId(null);
    setDragOverBin(null);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, category: ItemCategory) => {
    e.preventDefault();
    setDragOverBin(category);
  };

  const handleDragLeave = () => {
    setDragOverBin(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetCategory: ItemCategory) => {
    e.preventDefault();
    setDragOverBin(null);
    const itemId = e.dataTransfer.getData("itemId");
    const draggedItem = unsortedItems.find(item => item.id === itemId);

    if (draggedItem) {
      if (draggedItem.category === targetCategory) {
        correctSound.current.play();
        setSortedItems(prev => ({
          ...prev,
          [targetCategory]: [...prev[targetCategory], draggedItem]
        }));
        setUnsortedItems(prev => prev.filter(item => item.id !== itemId));
      } else {
        wrongSound.current.play();
      }
    }
    setDraggingItemId(null);
  };
  
  // --- STAGE 1 (TOUCH) ---
  const handleTouchStart = (_e: React.TouchEvent<HTMLDivElement>, item: ChallengeItem) => {
    setDraggingItemId(item.id);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement | null;
    const binElement = element?.closest("[data-bin-category]") as HTMLElement | null;
    setDragOverBin(binElement?.dataset?.binCategory as ItemCategory | null);
  };

  const handleTouchEnd = (_e: React.TouchEvent<HTMLDivElement>, item: ChallengeItem) => {
    if (dragOverBin) {
      if (item.category === dragOverBin) {
        correctSound.current.play();
        setSortedItems(prev => ({
          ...prev,
          [dragOverBin]: [...prev[dragOverBin], item]
        }));
        setUnsortedItems(prev => prev.filter(i => i.id !== item.id));
      } else {
        wrongSound.current.play();
      }
    }
    setDraggingItemId(null);
    setDragOverBin(null);
  };

  // --- STAGE 2: COUNTING LOGIC ---
  // Transition from Stage 1 to 2
  useEffect(() => {
    if (stage === 1 && unsortedItems.length === 0 && (sortedItems.nature.length + sortedItems.recycle.length > 0)) {
      const count = sortedItems.recycle.length;
      const score = count * POINTS_PER_ITEM;
      setRecycleCount(count);
      setTotalScore(score);

      // Create score options
      const wrongOptions = new Set<number>();
      while (wrongOptions.size < 2) {
        const offset = (Math.floor(Math.random() * 3) + 1) * POINTS_PER_ITEM * (Math.random() > 0.5 ? 1 : -1);
        const wrongScore = score + offset;
        if (wrongScore >= 0 && wrongScore !== score) {
          wrongOptions.add(wrongScore);
        }
      }
      setScoreOptions(shuffleArray([score, ...Array.from(wrongOptions)]));

      // Advance to stage 2
      setTimeout(() => setStage(2), 1000);
    }
  }, [stage, unsortedItems, sortedItems]);

  const handleAnswerClick = (selectedScore: number) => {
    if (feedback) return;
    if (selectedScore === totalScore) {
      correctSound.current.play();
      setFeedback('correct');
      setTimeout(() => {
        setStage(3);
        setFeedback(null);
      }, 1500);
    } else {
      wrongSound.current.play();
      setFeedback('wrong');
      setWrongSelection(selectedScore);
      setTimeout(() => {
        setFeedback(null);
        setWrongSelection(null);
      }, 1000);
    }
  };

  // --- STAGE 3: PLACE VALUE LOGIC ---
  const handleCheckAnswer = () => {
    if (feedback) return;
    const { tens, ones } = { tens: Math.floor(totalScore / 10), ones: totalScore % 10 };
    
    if (tensInZone === tens && onesInZone === ones) {
      correctSound.current.play();
      setFeedback('correct');
      setTimeout(() => {
        setIsGameComplete(true);
        clapSound.current.play();
        confetti({ particleCount: 200, spread: 80, origin: { y: 0.6 } });
      }, 1500);
    } else {
      wrongSound.current.play();
      setFeedback('wrong');
      setTimeout(() => setFeedback(null), 1000);
    }
  };

  const handleClear = () => {
    setTensInZone(0);
    setOnesInZone(0);
    setFeedback(null);
  };

  // Drag handlers for Stage 3
  const handleItemDragStart = (e: React.DragEvent<HTMLDivElement>, itemType: ItemType) => {
    e.dataTransfer.setData("itemType", itemType);
    setDraggingItem(itemType);
  };
  const handleItemDragEnd = () => {
    setDraggingItem(null);
    setDragOverZone(false);
  };
  const handleZoneDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOverZone(true);
  };
  const handleZoneDragLeave = () => {
    setDragOverZone(false);
  };
  const handleZoneDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOverZone(false);
    setFeedback(null);
    const itemType = e.dataTransfer.getData("itemType") as ItemType;
    if (itemType === 'ten') setTensInZone(prev => prev + 1);
    else if (itemType === 'one') setOnesInZone(prev => prev + 1);
    popSound.current.play();
    setDraggingItem(null);
  };
  
  // Touch handlers for Stage 3
  const handleItemTouchStart = (_e: React.TouchEvent<HTMLDivElement>, itemType: ItemType) => {
    setDraggingItem(itemType);
  };
  const handleItemTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement | null;
    setDragOverZone(!!element?.closest("[data-dropzone]"));
  };
  const handleItemTouchEnd = () => {
    if (dragOverZone) {
      setFeedback(null);
      if (draggingItem === 'ten') setTensInZone(prev => prev + 1);
      else if (draggingItem === 'one') setOnesInZone(prev => prev + 1);
      popSound.current.play();
    }
    setDraggingItem(null);
    setDragOverZone(false);
  };
  
  const currentTotal = tensInZone * 10 + onesInZone;

  // --- RENDER ---

  if (isGameComplete) {
    return (
      <div className="p-6 text-center flex flex-col items-center justify-center h-full text-white">
        <CheckCircle size={80} className="text-green-400 mb-4" />
        <h2 className="text-3xl font-bold">Challenge Complete!</h2>
        <p className="text-lg mb-6">You're a Numbers and World expert!</p>
        <button
          onClick={onComplete}
          className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Finish Lesson
        </button>
      </div>
    );
  }
  
  const renderStage1 = () => (
    <>
      <h3 className="text-2xl font-bold text-center mb-4">Stage 1: Sort the items!</h3>
      {/* Items to Sort */}
      <div className="h-32 bg-white/10 rounded-lg p-4 mb-4 flex justify-center items-center flex-wrap gap-4">
        {unsortedItems.map(item => (
          <div
            key={item.id}
            className={`text-6xl cursor-grab transition-all ${draggingItemId === item.id ? 'opacity-30 scale-125' : 'opacity-100'}`}
            draggable
            style={{ touchAction: "none" }}
            onDragStart={(e) => handleDragStart(e, item)}
            onDragEnd={handleDragEnd}
            onTouchStart={(e) => handleTouchStart(e, item)}
            onTouchMove={handleTouchMove}
            onTouchEnd={(e) => handleTouchEnd(e, item)}
          >
            {item.emoji}
          </div>
        ))}
        {unsortedItems.length === 0 && <p className="text-xl text-white/70">Good job! Next...</p>}
      </div>
      {/* Drop Bins */}
      <div className="grid grid-cols-2 gap-4">
        {BINS.map(bin => (
          <div
            key={bin.category}
            data-bin-category={bin.category}
            onDragOver={(e) => handleDragOver(e, bin.category)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, bin.category)}
            className={`min-h-[150px] rounded-xl p-4 flex flex-col items-center justify-center transition-all duration-200 border-4 border-dashed ${bin.color} ${dragOverBin === bin.category ? `${bin.highlight} scale-105` : 'border-white/20'}`}
          >
            <span className="text-6xl mb-2">{bin.emoji}</span>
            <p className="text-xl font-bold">{bin.label}</p>
            <div className="flex flex-wrap justify-center mt-2 gap-1 text-2xl">
              {sortedItems[bin.category].map(item => <span key={item.id}>{item.emoji}</span>)}
            </div>
          </div>
        ))}
      </div>
    </>
  );

  const renderStage2 = () => (
    <>
      <h3 className="text-2xl font-bold text-center mb-4">Stage 2: Get your score!</h3>
      <div className="flex-grow flex flex-col items-center justify-center bg-white/10 rounded-xl p-6">
        <p className="text-2xl text-center mb-2">You recycled <span className="text-yellow-300 font-bold">{recycleCount}</span> items.</p>
        <p className="text-3xl text-center font-bold mb-6">That's <span className="text-cyan-300">{POINTS_PER_ITEM}</span> points for each item!</p>
        <h4 className="text-2xl font-semibold mb-6">What's your total score?</h4>
        <div className="flex gap-4">
          {scoreOptions.map(num => (
            <button
              key={num}
              onClick={() => handleAnswerClick(num)}
              disabled={!!feedback}
              className={`w-24 h-24 bg-indigo-600 text-white font-bold text-4xl rounded-lg
                hover:bg-indigo-700 transition-all duration-200
                ${feedback === 'correct' && num === totalScore ? 'bg-green-600 scale-110' : ''}
                ${wrongSelection === num ? 'bg-red-600 animate-shake' : ''}
              `}
            >
              {num}
            </button>
          ))}
        </div>
      </div>
    </>
  );

  const renderStage3 = () => (
    <>
      <h3 className="text-2xl font-bold text-center mb-2">Stage 3: Build your score!</h3>
      <p className="text-3xl font-bold text-center text-yellow-300 mb-4">
        Build this number: {totalScore}
      </p>
      {/* Build Zone */}
      <div
        data-dropzone="true"
        onDragOver={handleZoneDragOver}
        onDragLeave={handleZoneDragLeave}
        onDrop={handleZoneDrop}
        className={`relative flex-grow bg-white/10 rounded-xl p-4 flex flex-wrap content-start gap-1 min-h-[200px]
          transition-all duration-200 border-4 border-dashed
          ${dragOverZone ? 'border-cyan-400' : 'border-white/20'}
          ${feedback === 'correct' ? 'border-green-500' : ''}
          ${feedback === 'wrong' ? 'border-red-500 animate-shake' : ''}
        `}
      >
        {Array.from({ length: tensInZone }, (_, i) => <div key={`t-${i}`} className="w-5 h-20 bg-blue-500 border-2 border-blue-300 rounded m-1" />)}
        {Array.from({ length: onesInZone }, (_, i) => <div key={`o-${i}`} className="w-5 h-5 bg-yellow-400 border-2 border-yellow-300 rounded m-1" />)}
        <div className="absolute bottom-2 right-3 bg-black/50 text-white px-3 py-1 rounded-lg text-xl font-bold">
          Total: {currentTotal}
        </div>
      </div>
      {/* Item Bank */}
      <div className="w-full h-32 bg-stone-700 rounded-lg p-4 flex justify-center items-center gap-6 mt-4">
        <div className="flex flex-col items-center">
          <div
            draggable style={{ touchAction: "none" }}
            onDragStart={(e) => handleItemDragStart(e, 'ten')} onDragEnd={handleItemDragEnd}
            onTouchStart={(e) => handleItemTouchStart(e, 'ten')} onTouchMove={handleItemTouchMove} onTouchEnd={handleItemTouchEnd}
            className={`w-8 h-24 bg-blue-500 border-2 border-blue-300 rounded cursor-grab ${draggingItem === 'ten' ? 'opacity-30' : ''}`}
          />
          <span className="mt-1 font-semibold">Ten</span>
        </div>
        <div className="flex flex-col items-center">
          <div
            draggable style={{ touchAction: "none" }}
            onDragStart={(e) => handleItemDragStart(e, 'one')} onDragEnd={handleItemDragEnd}
            onTouchStart={(e) => handleItemTouchStart(e, 'one')} onTouchMove={handleItemTouchMove} onTouchEnd={handleItemTouchEnd}
            className={`w-8 h-8 bg-yellow-400 border-2 border-yellow-300 rounded cursor-grab ${draggingItem === 'one' ? 'opacity-30' : ''}`}
          />
          <span className="mt-1 font-semibold">One</span>
        </div>
      </div>
      {/* Controls */}
      <div className="grid grid-cols-2 gap-4 mt-4">
        <button onClick={handleClear} className="flex items-center justify-center gap-2 bg-gray-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-gray-600">
          <RotateCcw size={20} /> Clear
        </button>
        <button onClick={handleCheckAnswer} disabled={feedback === 'correct'} className="bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-500">
          Check Answer
        </button>
      </div>
    </>
  );
  
  return (
    <div className="p-4 flex flex-col h-full text-white">
      {stage === 1 && renderStage1()}
      {stage === 2 && renderStage2()}
      {stage === 3 && renderStage3()}

      <style>
        {`
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
          }
          .animate-shake {
            animation: shake 0.3s ease-in-out;
          }
        `}
      </style>
    </div>
  );
};

export default TheBigChallengeGame;
