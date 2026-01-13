import React, { useState, useEffect, useRef, useCallback } from "react";
import { CheckCircle } from "lucide-react";
import confetti from "canvas-confetti";

interface LessonProps {
  onComplete: () => void;
}

// --- DATA STRUCTURES ---

type WeatherType = 'sunny' | 'rainy' | 'snowy';

type ClothingItem = {
  id: string;
  name: string;
  emoji: string;
  correctWeather: WeatherType[]; // Changed to an array
};

type GameRound = {
  weather: WeatherType;
  prompt: string;
  weatherEmoji: string;
  closetItemIds: string[]; // IDs of all items in the closet for this round
  correctItemIds: string[]; // IDs of the correct items
};

// --- MASTER DATA ---
const ALL_CLOTHING_ITEMS: Record<string, ClothingItem> = {
  sunglasses: { id: "sunglasses", name: "Sunglasses", emoji: "🕶️", correctWeather: ["sunny"] },
  cap: { id: "cap", name: "Cap", emoji: "🧢", correctWeather: ["sunny"] },
  tshirt: { id: "tshirt", name: "T-Shirt", emoji: "👕", correctWeather: ["sunny"] },
  scarf: { id: "scarf", name: "Scarf", emoji: "🧣", correctWeather: ["snowy"] },
  gloves: { id: "gloves", name: "Gloves", emoji: "🧤", correctWeather: ["snowy"] },
  coat: { id: "coat", name: "Coat", emoji: "🧥", correctWeather: ["snowy", "rainy"] }, // Updated
  boots: { id: "boots", name: "Boots", emoji: "👢", correctWeather: ["snowy"] },
  umbrella: { id: "umbrella", name: "Umbrella", emoji: "☂️", correctWeather: ["rainy"] },
  rainBoots: { id: "rainBoots", name: "Rain Boots", emoji: "🥾", correctWeather: ["rainy"] },
  // Add an incorrect item for sunny and snowy, that would be for rainy
  shorts: { id: "shorts", name: "Shorts", emoji: " 🩳", correctWeather: ["sunny"] },
  sandals: { id: "sandals", name: "Sandals", emoji: "👡", correctWeather: ["sunny"] },
  hat: { id: "hat", name: "Hat", emoji: "👒", correctWeather: ["sunny"] },
  sweater: { id: "sweater", name: "Sweater", emoji: " 🧶", correctWeather: ["snowy"] },
  mittens: { id: "mittens", name: "Mittens", emoji: "🧤", correctWeather: ["snowy"] },
};

const ALL_ROUNDS: GameRound[] = [
  {
    weather: 'sunny',
    prompt: "It's a hot, sunny day!",
    weatherEmoji: '☀️',
    closetItemIds: ['sunglasses', 'cap', 'tshirt', 'scarf', 'gloves', 'shorts', 'sandals', 'hat'],
    correctItemIds: ['sunglasses', 'cap', 'tshirt', 'shorts', 'sandals', 'hat'],
  },
  {
    weather: 'snowy',
    prompt: "It's cold and snowy! Bundle up!",
    weatherEmoji: '❄️',
    closetItemIds: ['scarf', 'gloves', 'coat', 'boots', 'tshirt', 'sunglasses', 'sweater', 'mittens'],
    correctItemIds: ['scarf', 'gloves', 'coat', 'boots', 'sweater', 'mittens'],
  },
  {
    weather: 'rainy',
    prompt: "It's raining! What will keep you dry?",
    weatherEmoji: '🌧️',
    closetItemIds: ['umbrella', 'coat', 'rainBoots', 'cap', 'scarf', 'tshirt'],
    correctItemIds: ['umbrella', 'coat', 'rainBoots'],
  },
];

// Helper to shuffle an array
const shuffleArray = <T,>(array: T[]): T[] => {
  return [...array].sort(() => Math.random() - 0.5);
};

// --- COMPONENT ---

const DressForTheWeatherGame: React.FC<LessonProps> = ({ onComplete }) => {
  // --- STATE ---
  const [gameRounds] = useState<GameRound[]>(shuffleArray(ALL_ROUNDS));
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [currentRound, setCurrentRound] = useState<GameRound>(gameRounds[0]);
  
  const [closetItems, setClosetItems] = useState<ClothingItem[]>([]); // Draggable items
  const [wornItems, setWornItems] = useState<ClothingItem[]>([]); // Correctly worn items
  
  const [isGameComplete, setIsGameComplete] = useState(false);
  const [isRoundComplete, setIsRoundComplete] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [feedbackEmoji, setFeedbackEmoji] = useState<string | null>(null);

  // Drag state
  const [draggingItem, setDraggingItem] = useState<ClothingItem | null>(null);
  const [dragOverCharacter, setDragOverCharacter] = useState(false);

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
    
    // Get full item objects from IDs and shuffle them for the closet
    const items = round.closetItemIds.map(id => ALL_CLOTHING_ITEMS[id]);
    setClosetItems(shuffleArray(items));
    
    setWornItems([]);
    setIsRoundComplete(false);
    setFeedback(null);
    setFeedbackEmoji(null);
  }, [gameRounds]);

  useEffect(() => {
    loadRound(currentRoundIndex);
  }, [currentRoundIndex, loadRound]);

  // --- GAME COMPLETION CHECK ---
  useEffect(() => {
    // Check if all *required* items for the current round are worn
    const allCorrectWorn = currentRound.correctItemIds.every(id => 
      wornItems.some(item => item.id === id)
    );

    if (allCorrectWorn && wornItems.length === currentRound.correctItemIds.length) {
      setIsRoundComplete(true);
      clapSound.current.play();
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    }
  }, [wornItems, currentRound]);

  // --- GAME LOGIC ---
  const handleNextRound = () => {
    if (currentRoundIndex < gameRounds.length - 1) {
      setCurrentRoundIndex(prev => prev + 1);
    } else {
      setIsGameComplete(true);
      clapSound.current.play(); // Extra confetti for final win
    }
  };

  const processDrop = (droppedItem: ClothingItem) => {
    if (isRoundComplete || feedback) return;

    // Check if the item is appropriate for the current weather
    if (droppedItem.correctWeather.includes(currentRound.weather)) {
      correctSound.current.play();
      setFeedback('correct');
      setFeedbackEmoji(droppedItem.emoji);
      
      // Move from closet to worn, ensuring no duplicates
      setWornItems(prev => {
        if (!prev.some(item => item.id === droppedItem.id)) {
          return [...prev, droppedItem];
        }
        return prev;
      });
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

  // --- DRAG & DROP HANDLERS ---
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, item: ClothingItem) => {
    e.dataTransfer.setData("itemId", item.id);
    setDraggingItem(item);
  };

  const handleDragEnd = () => {
    setDraggingItem(null);
    setDragOverCharacter(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOverCharacter(true);
  };

  const handleDragLeave = () => {
    setDragOverCharacter(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOverCharacter(false);
    const itemId = e.dataTransfer.getData("itemId");
    const droppedItem = closetItems.find(item => item.id === itemId);
    if (droppedItem) {
      processDrop(droppedItem);
    }
    setDraggingItem(null);
  };

  // --- TOUCH HANDLERS ---
  const handleTouchStart = (_e: React.TouchEvent<HTMLDivElement>, item: ClothingItem) => {
    setDraggingItem(item);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement | null;
    const dropZone = element?.closest("[data-character-dropzone]");
    setDragOverCharacter(!!dropZone);
  };

  const handleTouchEnd = (_e: React.TouchEvent<HTMLDivElement>) => {
    if (dragOverCharacter && draggingItem) {
      processDrop(draggingItem);
    }
    setDraggingItem(null);
    setDragOverCharacter(false);
  };

  // --- RENDER ---
  if (isGameComplete) {
    return (
      <div className="p-6 text-center flex flex-col items-center justify-center h-full text-white">
        <CheckCircle size={80} className="text-green-400 mb-4" />
        <h2 className="text-3xl font-bold">Great Job!</h2>
        <p className="text-lg mb-6">You're ready for any weather!</p>
        <button
          onClick={onComplete}
          className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Finish Lesson
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 flex flex-col h-full text-white overflow-hidden">
      <h3 className="text-2xl font-bold text-center mb-2">Get Dressed!</h3>
      <p className="text-lg text-center text-cyan-300 mb-4">{currentRound.prompt}</p>

      {/* Character Drop Zone */}
      <div 
        data-character-dropzone="true"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative flex-grow flex flex-col md:flex-row items-center justify-center p-4 bg-indigo-800 rounded-xl transition-all duration-200 border-4 border-dashed min-h-[250px]
          ${dragOverCharacter ? 'border-cyan-400 scale-105' : 'border-white/20'}
          ${feedback === 'wrong' ? 'border-red-500 animate-shake' : ''}
        `}
      >
        {/* Weather Window */}
        <div className="text-8xl p-4 bg-black/20 rounded-lg">
          {currentRound.weatherEmoji}
        </div>
        
        {/* Character */}
        <div className="text-9xl p-4 relative">
          🧑
          {feedbackEmoji && (
            <span className="absolute top-0 right-0 text-5xl animate-pulse">
              {feedbackEmoji}
            </span>
          )}
        </div>

        {/* Worn Items */}
        <div className="flex flex-wrap gap-4 p-4 bg-black/20 rounded-lg">
          {wornItems.map(item => (
            <div key={item.id} className="text-5xl">{item.emoji}</div>
          ))}
          {wornItems.length === 0 && <span className="text-white/70">Drag items here!</span>}
        </div>
      </div>

      {/* Closet Area (Draggable Items) */}
      <div className="w-full h-32 bg-stone-700 rounded-lg p-4 flex justify-center items-center gap-4 mt-4 overflow-x-auto">
        {closetItems.map(item => (
          <div
            key={item.id}
            draggable
            style={{ touchAction: "none" }}
            onDragStart={(e) => handleDragStart(e, item)}
            onDragEnd={handleDragEnd}
            onTouchStart={(e) => handleTouchStart(e, item)}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className={`flex flex-col items-center justify-center w-20 h-20 flex-shrink-0 bg-blue-500 rounded-lg shadow-lg cursor-grab
              ${draggingItem?.id === item.id ? 'opacity-30 scale-110' : 'opacity-100 hover:bg-blue-400'}
            `}
          >
            <span className="text-4xl">{item.emoji}</span>
            <span className="text-xs font-semibold">{item.name}</span>
          </div>
        ))}
      </div>

      {/* Round Complete Overlay */}
      {isRoundComplete && !isGameComplete && (
        <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-10">
          <CheckCircle size={80} className="text-green-400 mb-4" />
          <h2 className="text-3xl font-bold">Round Complete!</h2>
          <button
            onClick={handleNextRound}
            className="w-1/2 bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors mt-6"
          >
            Next
          </button>
        </div>
      )}
      
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

export default DressForTheWeatherGame;