import React, { useState, useEffect, useRef, useMemo } from 'react';
import { CheckCircle, Trash2, Droplets, Wind, Recycle, TreePine } from 'lucide-react';

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
  
  .pulse-glow {
    animation: pulseGlow 2s ease-in-out infinite;
  }
  
  @keyframes pulseGlow {
    0%, 100% {
      box-shadow: 0 0 10px rgba(239, 68, 68, 0.5);
    }
    50% {
      box-shadow: 0 0 20px rgba(239, 68, 68, 0.8);
    }
  }
`;

interface LessonProps {
  onComplete: () => void;
}

type PollutionItem = {
  id: string;
  label: string;
  emoji: string;
  type: 'air' | 'water' | 'land';
};

type PollutionZone = {
  id: string;
  name: string;
  type: 'air' | 'water' | 'land';
  icon: React.ReactNode;
  description: string;
};

type Scenario = {
  id: number;
  title: string;
  description: string;
  items: PollutionItem[];
};

// Define all 5 unique scenarios
const SCENARIOS: Scenario[] = [
  {
    id: 1,
    title: "Clean the Park",
    description: "Help clean up the park by sorting pollution into the correct bins!",
    items: [
      { id: "car-exhaust", label: "Car Exhaust", emoji: "💨", type: "air" },
      { id: "trash-ground", label: "Plastic Bottle", emoji: "🗑️", type: "land" },
      { id: "oil-pond", label: "Oil Spill", emoji: "🛢️", type: "water" },
      { id: "factory-smoke", label: "Factory Smoke", emoji: "🏭", type: "air" },
      { id: "litter", label: "Food Wrapper", emoji: "🍔", type: "land" },
    ]
  },
  {
    id: 2,
    title: "Beach Cleanup Day",
    description: "Sort the pollution found at the beach into the right categories!",
    items: [
      { id: "plastic-bag", label: "Plastic Bag", emoji: "🛍️", type: "land" },
      { id: "boat-fuel", label: "Boat Fuel", emoji: "⛽", type: "water" },
      { id: "cigarette", label: "Cigarette Butt", emoji: "🚬", type: "land" },
      { id: "smoke-bbq", label: "BBQ Smoke", emoji: "🔥", type: "air" },
      { id: "sewage", label: "Sewage Pipe", emoji: "💩", type: "water" },
    ]
  },
  {
    id: 3,
    title: "City Streets Mission",
    description: "Identify and sort the pollution in our city!",
    items: [
      { id: "bus-exhaust", label: "Bus Exhaust", emoji: "🚌", type: "air" },
      { id: "soda-can", label: "Soda Can", emoji: "🥤", type: "land" },
      { id: "paint-spill", label: "Paint in Drain", emoji: "🎨", type: "water" },
      { id: "tire-fire", label: "Burning Tire", emoji: "🔥", type: "air" },
      { id: "broken-glass", label: "Broken Glass", emoji: "🪟", type: "land" },
    ]
  },
  {
    id: 4,
    title: "Farm Protection",
    description: "Help the farm by sorting out pollution that shouldn't be there!",
    items: [
      { id: "pesticide", label: "Pesticide Runoff", emoji: "☠️", type: "water" },
      { id: "tractor-smoke", label: "Tractor Exhaust", emoji: "🚜", type: "air" },
      { id: "fertilizer-bag", label: "Empty Fertilizer", emoji: "📦", type: "land" },
      { id: "chemical-barrel", label: "Chemical Barrel", emoji: "🛢️", type: "water" },
      { id: "burning-trash", label: "Burning Trash", emoji: "🔥", type: "air" },
    ]
  },
  {
    id: 5,
    title: "Lake Restoration",
    description: "Restore the lake by identifying all types of pollution!",
    items: [
      { id: "boat-smoke", label: "Boat Engine", emoji: "⛵", type: "air" },
      { id: "fishing-net", label: "Fishing Net", emoji: "🪢", type: "water" },
      { id: "camping-trash", label: "Camping Trash", emoji: "🏕️", type: "land" },
      { id: "algae", label: "Toxic Algae", emoji: "🦠", type: "water" },
      { id: "campfire-smoke", label: "Campfire Smoke", emoji: "🏕️", type: "air" },
    ]
  }
];

const ZONES: PollutionZone[] = [
  { 
    id: "air", 
    name: "Air Pollution", 
    type: "air",
    icon: <Wind className="w-8 h-8" />,
    description: "Smoke, exhaust, fumes"
  },
  { 
    id: "water", 
    name: "Water Pollution", 
    type: "water",
    icon: <Droplets className="w-8 h-8" />,
    description: "Oil, chemicals, waste in water"
  },
  { 
    id: "land", 
    name: "Land Pollution", 
    type: "land",
    icon: <Trash2 className="w-8 h-8" />,
    description: "Litter, trash, waste on ground"
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

const G6_PollutionDefender: React.FC<LessonProps> = ({ onComplete }) => {
  const [currentScenarioIndex, setCurrentScenarioIndex] = useState(0);
  const [shuffledScenarios] = useState(() => shuffle(SCENARIOS));
  const currentScenario = shuffledScenarios[currentScenarioIndex];
  
  const [shuffledItems, setShuffledItems] = useState<PollutionItem[]>(() => 
    shuffle(currentScenario.items)
  );
  
  const [placed, setPlaced] = useState<Record<string, string | null>>(() =>
    ZONES.reduce((acc, z) => ({ ...acc, [z.id]: null }), {} as Record<string, string | null>)
  );
  
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());
  const [allScenariosComplete, setAllScenariosComplete] = useState(false);
  
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverZone, setDragOverZone] = useState<string | null>(null);
  const [shakeItem, setShakeItem] = useState<string | null>(null);
  const [message, setMessage] = useState<string>("");

  const correctSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/correct.mp3") : createMockAudio());
  const wrongSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/incorrect.mp3") : createMockAudio());

  // Reset items when scenario changes
  useEffect(() => {
    setShuffledItems(shuffle(currentScenario.items));
    setPlaced(ZONES.reduce((acc, z) => ({ ...acc, [z.id]: null }), {} as Record<string, string | null>));
    setCompletedItems(new Set());
    setMessage("");
  }, [currentScenarioIndex]);

  const handleDropLogic = (itemId: string, zone: PollutionZone) => {
    const item = currentScenario.items.find(i => i.id === itemId);
    if (!item || completedItems.has(itemId)) return;

    if (zone.type === item.type) {
      correctSound.current.play();
      setCompletedItems(prev => new Set([...prev, itemId]));
      setMessage(`✓ Correct! ${item.label} is ${zone.name}!`);
      setTimeout(() => setMessage(""), 2000);
    } else {
      wrongSound.current.play();
      setShakeItem(itemId);
      setMessage(`✗ Not quite! Think about where ${item.label} causes pollution.`);
      setTimeout(() => {
        setShakeItem(null);
        setMessage("");
      }, 1500);
    }
  };

  const onDragStart = (e: React.DragEvent<HTMLDivElement>, item: PollutionItem) => {
    e.dataTransfer.setData("text/plain", item.id);
    e.dataTransfer.effectAllowed = "move";
    setDraggingId(item.id);
  };

  const onDragEnd = () => {
    setDraggingId(null);
    setDragOverZone(null);
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>, zoneId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverZone(zoneId);
  };

  const onDragLeave = () => {
    setDragOverZone(null);
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>, zone: PollutionZone) => {
    e.preventDefault();
    setDraggingId(null);
    setDragOverZone(null);
    const itemId = e.dataTransfer.getData("text/plain");
    if (itemId) {
      handleDropLogic(itemId, zone);
    }
  };

  const onTouchStart = (item: PollutionItem) => {
    if (!completedItems.has(item.id)) {
      setDraggingId(item.id);
    }
  };

  const onTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    const dropZone = element?.closest('[data-zoneid]') as HTMLElement | null;
    setDragOverZone(dropZone?.dataset.zoneid || null);
  };

  const onTouchEnd = (e: React.TouchEvent<HTMLDivElement>, item: PollutionItem) => {
    setDraggingId(null);
    setDragOverZone(null);
    
    const touch = e.changedTouches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    const dropZoneEl = element?.closest('[data-zoneid]') as HTMLElement | null;
    
    if (dropZoneEl?.dataset.zoneid) {
      const zone = ZONES.find(z => z.id === dropZoneEl.dataset.zoneid);
      if (zone) {
        handleDropLogic(item.id, zone);
      }
    }
  };

  const scenarioComplete = completedItems.size === currentScenario.items.length;

  const handleNextScenario = () => {
    if (currentScenarioIndex < shuffledScenarios.length - 1) {
      setCurrentScenarioIndex(prev => prev + 1);
    } else {
      setAllScenariosComplete(true);
    }
  };

  if (allScenariosComplete) {
    return (
      <div className="p-6 text-center flex flex-col items-center justify-center h-screen bg-gradient-to-b from-green-50 to-blue-50">
        <CheckCircle size={80} className="text-green-500 mb-4" />
        <h2 className="text-3xl font-bold text-green-800 mb-2">Amazing Work, Pollution Defender!</h2>
        <p className="text-xl text-gray-700 mb-6">You've mastered identifying all types of pollution!</p>
        <button 
          onClick={onComplete} 
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg text-xl transition-colors"
        >
          Continue Adventure
        </button>
      </div>
    );
  }

  if (scenarioComplete) {
    return (
      <div className="p-6 text-center flex flex-col items-center justify-center h-screen bg-gradient-to-b from-green-50 to-emerald-50">
        <CheckCircle size={64} className="text-green-500 mb-4" />
        <h2 className="text-2xl font-bold text-green-800 mb-2">Scenario Complete!</h2>
        <p className="text-lg text-gray-700 mb-6">
          You completed {currentScenarioIndex + 1} of {shuffledScenarios.length} scenarios
        </p>
        <button 
          onClick={handleNextScenario} 
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg text-xl transition-colors"
        >
          Next Challenge →
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gradient-to-b from-green-50 to-blue-50">
      <style>{shakeAnimationCss}</style>
      
      {/* Header */}
      <div className="bg-white shadow-md p-4 border-b-4 border-green-500">
        <h2 className="text-2xl md:text-3xl font-bold text-center text-green-800 mb-1">
          🏭 Pollution Defender 🌍
        </h2>
        <p className="text-center text-gray-600 text-sm md:text-base">{currentScenario.description}</p>
        <div className="flex justify-center items-center gap-4 mt-2">
          <span className="text-lg font-semibold text-purple-700">
            Scenario {currentScenarioIndex + 1}/{shuffledScenarios.length}
          </span>
          <span className="text-lg font-semibold text-blue-700">
            Progress: {completedItems.size}/{currentScenario.items.length}
          </span>
        </div>
        {message && (
          <div className={`mt-2 text-center font-bold p-2 rounded ${
            message.startsWith('✓') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {message}
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden p-4 flex flex-col gap-4">
        
        {/* Pollution Items (Top) */}
        <div className="bg-white rounded-lg shadow-lg p-4 border-2 border-purple-300">
          <h3 className="text-lg md:text-xl font-bold text-center mb-3 text-purple-800">
            Drag Each Item to Its Pollution Type
          </h3>
          <div className="flex flex-wrap justify-center gap-2 md:gap-3 min-h-[100px]">
            {shuffledItems.map((item) => {
              const isCompleted = completedItems.has(item.id);
              const isDragging = draggingId === item.id;
              
              return (
                <div
                  key={item.id}
                  draggable={!isCompleted}
                  onDragStart={(e) => !isCompleted && onDragStart(e, item)}
                  onDragEnd={onDragEnd}
                  onTouchStart={() => onTouchStart(item)}
                  onTouchMove={onTouchMove}
                  onTouchEnd={(e) => onTouchEnd(e, item)}
                  style={{ touchAction: 'none' }}
                  className={`relative flex flex-col items-center justify-center p-3 md:p-4 rounded-lg shadow-md transition-all ${
                    isCompleted 
                      ? 'bg-green-500 text-white cursor-not-allowed opacity-50' 
                      : shakeItem === item.id
                      ? 'bg-red-400 text-white shake'
                      : isDragging
                      ? 'opacity-30 bg-gray-300'
                      : 'bg-gradient-to-br from-yellow-300 to-orange-400 text-gray-800 cursor-grab active:cursor-grabbing hover:scale-105 pulse-glow'
                  }`}
                >
                  <span className="text-3xl md:text-4xl mb-1">{item.emoji}</span>
                  <span className="text-xs md:text-sm font-bold text-center">{item.label}</span>
                  {isCompleted && (
                    <CheckCircle className="absolute top-1 right-1 w-5 h-5 text-white" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Drop Zones (Bottom) */}
        <div className="flex-1 bg-white rounded-lg shadow-lg p-4 border-2 border-blue-300 overflow-hidden">
          <h3 className="text-lg md:text-xl font-bold text-center mb-3 text-blue-800">
            Pollution Categories
          </h3>
          <div className="grid grid-cols-3 gap-2 md:gap-4 h-[calc(100%-3rem)]">
            {ZONES.map((zone) => {
              const zoneItems = currentScenario.items.filter(
                item => item.type === zone.type && completedItems.has(item.id)
              );
              
              return (
                <div
                  key={zone.id}
                  data-zoneid={zone.id}
                  onDragOver={(e) => onDragOver(e, zone.id)}
                  onDragLeave={onDragLeave}
                  onDrop={(e) => onDrop(e, zone)}
                  className={`flex flex-col items-center justify-center p-2 md:p-4 rounded-lg border-4 transition-all ${
                    dragOverZone === zone.id 
                      ? 'bg-yellow-100 border-yellow-400 scale-105' 
                      : zone.type === 'air'
                      ? 'bg-blue-50 border-blue-400'
                      : zone.type === 'water'
                      ? 'bg-cyan-50 border-cyan-400'
                      : 'bg-amber-50 border-amber-400'
                  }`}
                >
                  <div className={`mb-2 ${
                    zone.type === 'air' ? 'text-blue-600' :
                    zone.type === 'water' ? 'text-cyan-600' :
                    'text-amber-600'
                  }`}>
                    {zone.icon}
                  </div>
                  <h4 className="font-bold text-center text-xs md:text-sm mb-1">{zone.name}</h4>
                  <p className="text-xs text-gray-600 text-center mb-2 hidden md:block">{zone.description}</p>
                  
                  {/* Show collected items */}
                  <div className="flex flex-wrap justify-center gap-1 mt-2">
                    {zoneItems.map(item => (
                      <span key={item.id} className="text-2xl">{item.emoji}</span>
                    ))}
                  </div>
                  
                  {zoneItems.length === 0 && (
                    <div className="text-gray-400 text-xs mt-2 font-semibold">
                      Drop here
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default G6_PollutionDefender;