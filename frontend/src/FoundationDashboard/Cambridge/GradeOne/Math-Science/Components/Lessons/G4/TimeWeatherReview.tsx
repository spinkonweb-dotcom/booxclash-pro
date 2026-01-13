import React, { useState, useEffect, useRef, useCallback } from "react";
import { CheckCircle } from "lucide-react";
import confetti from "canvas-confetti";

interface LessonProps {
  onComplete: () => void;
}

// --- DATA STRUCTURES ---

type WeatherCategory = 'hot' | 'cold';
type DayID = 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat';

type ClothingItem = {
  id: string;
  name: string;
  emoji: string;
  category: WeatherCategory;
};

type Day = {
  id: DayID;
  name: string;
  short: string;
};

type GameRound = {
  id: number;
  prompt: string;
  weather: WeatherCategory;
  weatherEmoji: string;
  dayId: DayID;
  dayName: string;
  closetItemIds: string[]; // All items available
  correctItemIds: string[]; // Required items
};

// --- MASTER DATA ---
const ALL_CLOTHING_ITEMS: Record<string, ClothingItem> = {
  // Hot
  sunglasses: { id: "sunglasses", name: "Sunglasses", emoji: "🕶️", category: "hot" },
  cap: { id: "cap", name: "Cap", emoji: "🧢", category: "hot" },
  shorts: { id: "shorts", name: "Shorts", emoji: "🩳", category: "hot" },
  tshirt: { id: "tshirt", name: "T-Shirt", emoji: "👕", category: "hot" },
  // Cold
  scarf: { id: "scarf", name: "Scarf", emoji: "🧣", category: "cold" },
  gloves: { id: "gloves", name: "Gloves", emoji: "🧤", category: "cold" },
  coat: { id: "coat", name: "Coat", emoji: "🧥", category: "cold" },
  boots: { id: "boots", name: "Boots", emoji: "👢", category: "cold" },
};

const DAYS_OF_WEEK: Day[] = [
  { id: 'sun', name: 'Sunday', short: 'Sun' },
  { id: 'mon', name: 'Monday', short: 'Mon' },
  { id: 'tue', name: 'Tuesday', short: 'Tue' },
  { id: 'wed', name: 'Wednesday', short: 'Wed' },
  { id: 'thu', name: 'Thursday', short: 'Thu' },
  { id: 'fri', name: 'Friday', short: 'Fri' },
  { id: 'sat', name: 'Saturday', short: 'Sat' },
];

const ALL_ROUNDS: GameRound[] = [
  {
    id: 1,
    prompt: "We're going to the beach on Wednesday! It will be hot and sunny ☀️.",
    weather: 'hot',
    weatherEmoji: '☀️',
    dayId: 'wed',
    dayName: 'Wednesday',
    closetItemIds: ['sunglasses', 'shorts', 'scarf', 'gloves', 'tshirt'],
    correctItemIds: ['sunglasses', 'shorts', 'tshirt'],
  },
  {
    id: 2,
    prompt: "We're visiting the arctic on Friday! It will be cold and snowy ❄️.",
    weather: 'cold',
    weatherEmoji: '❄️',
    dayId: 'fri',
    dayName: 'Friday',
    closetItemIds: ['scarf', 'coat', 'boots', 'tshirt', 'sunglasses'],
    correctItemIds: ['scarf', 'coat', 'boots'],
  },
];

// Helper to shuffle an array
const shuffleArray = <T,>(array: T[]): T[] => {
  return [...array].sort(() => Math.random() - 0.5);
};

// --- COMPONENT ---

const VacationPackerGame: React.FC<LessonProps> = ({ onComplete }) => {
  // --- STATE ---
  const [gameRounds] = useState<GameRound[]>(shuffleArray(ALL_ROUNDS));
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [currentRound, setCurrentRound] = useState<GameRound>(gameRounds[0]);
  const [stage, setStage] = useState<1 | 2>(1);
  
  const [isGameComplete, setIsGameComplete] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [feedbackEmoji, setFeedbackEmoji] = useState<string | null>(null);

  // Stage 1: Packing
  const [closetItems, setClosetItems] = useState<ClothingItem[]>([]);
  const [suitcaseItems, setSuitcaseItems] = useState<ClothingItem[]>([]);
  const [draggingItem, setDraggingItem] = useState<ClothingItem | null>(null);
  const [dragOverSuitcase, setDragOverSuitcase] = useState(false);
  const [stage1Complete, setStage1Complete] = useState(false);
  
  // Stage 2: Calendar
  const [selectedDayId, setSelectedDayId] = useState<DayID | null>(null);

  // --- SOUNDS ---
  const createMockAudio = () => ({
    play: () => { /* console.log("Audio play mock") */ },
    pause: () => { /* console.log("Audio pause mock") */ },
    currentTime: 0,
  });

  const correctSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/correct.mp3") : createMockAudio());
  const wrongSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/incorrect.mp3") : createMockAudio());
  const clapSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/clap.mp3") : createMockAudio());

  // --- GAME SETUP ---
  const loadRound = useCallback((roundIndex: number) => {
    const round = gameRounds[roundIndex];
    setCurrentRound(round);
    
    const items = round.closetItemIds.map(id => ALL_CLOTHING_ITEMS[id]);
    setClosetItems(shuffleArray(items));
    
    setSuitcaseItems([]);
    setStage(1);
    setStage1Complete(false);
    setFeedback(null);
    setFeedbackEmoji(null);
    setSelectedDayId(null);
  }, [gameRounds]);

  useEffect(() => {
    loadRound(currentRoundIndex);
  }, [currentRoundIndex, loadRound]);

  // --- STAGE 1: COMPLETION CHECK ---
  useEffect(() => {
    if (stage === 1 && !stage1Complete) {
      const allCorrectPacked = currentRound.correctItemIds.every(id => 
        suitcaseItems.some(item => item.id === id)
      );
      if (allCorrectPacked && suitcaseItems.length === currentRound.correctItemIds.length) {
        setStage1Complete(true);
        correctSound.current.play();
      }
    }
  }, [suitcaseItems, currentRound, stage, stage1Complete]);

  // --- STAGE 1: DRAG & DROP ---
  const processDrop = (droppedItem: ClothingItem) => {
    if (stage1Complete || feedback) return;

    if (droppedItem.category === currentRound.weather) {
      correctSound.current.play();
      setFeedback('correct');
      setFeedbackEmoji(droppedItem.emoji);
      
      setSuitcaseItems(prev => [...prev, droppedItem]);
      setClosetItems(prev => prev.filter(item => item.id !== droppedItem.id));
      
    } else {
      wrongSound.current.play();
      setFeedback('wrong');
      setFeedbackEmoji('🤔');
    }
    
    setTimeout(() => {
      setFeedback(null);
      setFeedbackEmoji(null);
    }, 1000);
  };
  
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, item: ClothingItem) => {
    e.dataTransfer.setData("itemId", item.id);
    setDraggingItem(item);
  };
  const handleDragEnd = () => {
    setDraggingItem(null);
    setDragOverSuitcase(false);
  };
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOverSuitcase(true);
  };
  const handleDragLeave = () => setDragOverSuitcase(false);
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOverSuitcase(false);
    const itemId = e.dataTransfer.getData("itemId");
    const droppedItem = closetItems.find(item => item.id === itemId);
    if (droppedItem) processDrop(droppedItem);
    setDraggingItem(null);
  };
  // Touch
  const handleTouchStart = (item: ClothingItem) => setDraggingItem(item);
  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement | null;
    setDragOverSuitcase(!!element?.closest("[data-suitcase-dropzone]"));
  };
  const handleTouchEnd = () => {
    if (dragOverSuitcase && draggingItem) processDrop(draggingItem);
    setDraggingItem(null);
    setDragOverSuitcase(false);
  };
  
  // --- STAGE 2: CALENDAR LOGIC ---
  const handleDayClick = (day: Day) => {
    if (feedback) return;
    setSelectedDayId(day.id);
    
    if (day.id === currentRound.dayId) {
      correctSound.current.play();
      setFeedback('correct');
      setTimeout(() => {
        const nextIndex = currentRoundIndex + 1;
        if (nextIndex < gameRounds.length) {
          setCurrentRoundIndex(nextIndex); // Load next round
        } else {
          setIsGameComplete(true);
          clapSound.current.play();
          confetti({ particleCount: 200, spread: 80, origin: { y: 0.6 } });
        }
      }, 1500);
    } else {
      wrongSound.current.play();
      setFeedback('wrong');
      setTimeout(() => {
        setFeedback(null);
        setSelectedDayId(null);
      }, 1000);
    }
  };

  // --- RENDER ---
  if (isGameComplete) {
    return (
      <div className="p-6 text-center flex flex-col items-center justify-center h-full text-white">
        <CheckCircle size={80} className="text-green-400 mb-4" />
        <h2 className="text-3xl font-bold">Great Trip!</h2>
        <p className="text-lg mb-6">You're all packed and ready to go!</p>
        <button
          onClick={onComplete}
          className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Finish Lesson
        </button>
      </div>
    );
  }
  
  // --- STAGE 1 RENDER ---
  const renderStage1 = () => (
    <>
      <h3 className="text-2xl font-bold text-center mb-4">Stage 1: Pack your bag!</h3>
      <p className="text-lg text-center text-cyan-300 mb-4">{currentRound.prompt}</p>
      
      {/* Suitcase (Drop Zone) */}
      <div 
        data-suitcase-dropzone="true"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative flex-grow flex flex-col items-center justify-center p-4 bg-purple-800 rounded-xl transition-all duration-200 border-4 border-dashed min-h-[200px]
          ${dragOverSuitcase ? 'border-purple-400 scale-105' : 'border-white/20'}
          ${feedback === 'wrong' ? 'border-red-500 animate-shake' : ''}
          ${stage1Complete ? 'border-green-500' : ''}
        `}
      >
        <span className="text-7xl">🧳</span>
        <div className="flex flex-wrap gap-2 p-2 bg-black/20 rounded-lg mt-4">
          {suitcaseItems.map(item => (
            <div key={item.id} className="text-4xl">{item.emoji}</div>
          ))}
          {suitcaseItems.length === 0 && <span className="text-white/70">Drag items here!</span>}
        </div>
        
        {feedbackEmoji && (
          <span className="absolute top-4 right-4 text-5xl animate-pulse">
            {feedbackEmoji}
          </span>
        )}
      </div>

      {/* Closet (Draggable Items) */}
      <div className="w-full h-32 bg-stone-700 rounded-lg p-4 flex justify-center items-center gap-4 mt-4 overflow-x-auto">
        {closetItems.map(item => (
          <div
            key={item.id}
            draggable style={{ touchAction: "none" }}
            onDragStart={(e) => handleDragStart(e, item)}
            onDragEnd={handleDragEnd}
            onTouchStart={() => handleTouchStart(item)}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className={`flex flex-col items-center justify-center w-20 h-20 flex-shrink-0 bg-blue-500 rounded-lg shadow-lg cursor-grab
              ${draggingItem?.id === item.id ? 'opacity-30 scale-110' : 'hover:bg-blue-400'}
            `}
          >
            <span className="text-4xl">{item.emoji}</span>
            <span className="text-xs font-semibold">{item.name}</span>
          </div>
        ))}
      </div>
      
      {stage1Complete && (
        <button
          onClick={() => setStage(2)}
          className="w-full bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 transition-colors mt-4"
        >
          Next Stage
        </button>
      )}
    </>
  );
  
  // --- STAGE 2 RENDER ---
  const renderStage2 = () => (
    <>
      <h3 className="text-2xl font-bold text-center mb-4">Stage 2: Book your trip!</h3>
      <p className="text-lg text-center text-cyan-300 mb-4">Tap on <span className="font-bold text-yellow-300">{currentRound.dayName}</span>!</p>

      <div className="flex-grow w-full max-w-lg mx-auto bg-white/10 rounded-xl p-4 flex flex-col">
        <div className="grid grid-cols-7 gap-1 text-center font-bold text-sm text-cyan-300">
          {DAYS_OF_WEEK.map(day => <div key={day.id}>{day.short}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1 mt-2">
          {DAYS_OF_WEEK.map(day => {
            const isSelected = selectedDayId === day.id;
            const isCorrect = isSelected && feedback === 'correct';
            const isWrong = isSelected && feedback === 'wrong';
            
            return (
              <button
                key={day.id}
                onClick={() => handleDayClick(day)}
                disabled={!!feedback}
                className={`flex items-center justify-center aspect-square rounded-lg bg-indigo-600
                  transition-all duration-200
                  ${isCorrect ? 'bg-green-600 scale-105' : ''}
                  ${isWrong ? 'bg-red-600 animate-shake' : ''}
                  ${feedback && !isSelected ? 'opacity-50' : ''}
                  ${!feedback ? 'hover:bg-indigo-500' : ''}
                `}
              >
                {day.name.charAt(0)}
              </button>
            );
          })}
        </div>
        <div className="mt-4 p-4 bg-black/20 rounded-lg text-center">
          <span className="text-6xl">{currentRound.weatherEmoji}</span>
          <p className="text-xl mt-2">{currentRound.prompt}</p>
        </div>
      </div>
    </>
  );

  return (
    <div className="p-4 flex flex-col h-full text-white overflow-hidden">
      {stage === 1 ? renderStage1() : renderStage2()}
      
      {/* Shake Animation */}
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

export default VacationPackerGame;