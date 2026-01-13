import React, { useState, useEffect, useRef, useCallback } from "react";
import { CheckCircle } from "lucide-react";
import confetti from "canvas-confetti";

interface LessonProps {
  onComplete: () => void;
}

// --- DATA STRUCTURES ---

type MaterialType = 'wood' | 'metal' | 'glass' | 'plastic' | 'fabric';

type SceneItem = {
  id: string;
  name: string;
  emoji: string;
  material: MaterialType;
  position: { top: string; left: string; };
  isFound: boolean; // Has this item been found *in its correct round*?
};

type GameRound = {
  id: number;
  prompt: string;
  materialToFind: MaterialType;
  targetCount: number;
};

// --- GAME DATA ---
const ALL_SCENE_ITEMS: SceneItem[] = [
  // Wood
  { id: 'chair', name: 'Chair', emoji: '🪑', material: 'wood', position: { top: '60%', left: '15%' }, isFound: false },
  { id: 'desk', name: 'Desk', emoji: ' desk', material: 'wood', position: { top: '70%', left: '40%' }, isFound: false }, // Placeholder
  { id: 'shelf', name: 'Bookshelf', emoji: '📚', material: 'wood', position: { top: '20%', left: '80%' }, isFound: false },
  
  // Glass
  { id: 'window', name: 'Window', emoji: '🖼️', material: 'glass', position: { top: '15%', left: '10%' }, isFound: false },
  { id: 'cup', name: 'Glass Cup', emoji: '🥛', material: 'glass', position: { top: '65%', left: '50%' }, isFound: false },
  
  // Metal
  { id: 'lamp', name: 'Lamp', emoji: '💡', material: 'metal', position: { top: '65%', left: '75%' }, isFound: false },
  { id: 'fork', name: 'Fork', emoji: '🍴', material: 'metal', position: { top: '80%', left: '45%' }, isFound: false },
  
  // Plastic
  { id: 'bottle', name: 'Bottle', emoji: '🍾', material: 'plastic', position: { top: '85%', left: '10%' }, isFound: false },
  { id: 'toy', name: 'Toy Block', emoji: '🧱', material: 'plastic', position: { top: '80%', left: '85%' }, isFound: false },
  
  // Fabric
  { id: 'sofa', name: 'Sofa', emoji: '🛋️', material: 'fabric', position: { top: '40%', left: '30%' }, isFound: false },
  { id: 'shirt', name: 'Shirt', emoji: '👕', material: 'fabric', position: { top: '50%', left: '10%' }, isFound: false },
];

const GAME_ROUNDS: GameRound[] = [
  { id: 1, prompt: 'Find everything made of Wood!', materialToFind: 'wood', targetCount: 3 },
  { id: 2, prompt: 'Find everything made of Glass!', materialToFind: 'glass', targetCount: 2 },
  { id: 3, prompt: 'Find everything made of Metal!', materialToFind: 'metal', targetCount: 2 },
  { id: 4, prompt: 'Find everything made of Plastic!', materialToFind: 'plastic', targetCount: 2 },
  { id: 5, prompt: 'Find everything made of Fabric!', materialToFind: 'fabric', targetCount: 2 },
];

// --- COMPONENT ---

const MaterialFinderGame: React.FC<LessonProps> = ({ onComplete }) => {
  // --- STATE ---
  const [sceneItems, setSceneItems] = useState<SceneItem[]>(ALL_SCENE_ITEMS);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [currentRound, setCurrentRound] = useState(GAME_ROUNDS[0]);
  
  const [foundCount, setFoundCount] = useState(0);
  
  const [isGameComplete, setIsGameComplete] = useState(false);
  const [isRoundComplete, setIsRoundComplete] = useState(false);
  const [wrongClickId, setWrongClickId] = useState<string | null>(null);

  // --- SOUNDS ---
  const createMockAudio = () => ({
    play: () => { /* console.log("Audio play mock") */ },
    pause: () => { /* console.log("Audio pause mock") */ },
    currentTime: 0,
  });

  const correctSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/correct.mp3") : createMockAudio());
  const wrongSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/incorrect.mp3") : createMockAudio());
  const clapSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/clap.mp3") : createMockAudio());

  // --- GAME SETUP & FLOW ---
  // Load round
  useEffect(() => {
    const round = GAME_ROUNDS[currentRoundIndex];
    setCurrentRound(round);
    setFoundCount(0);
    // Reset 'isFound' status for all items for the new round
    setSceneItems(prev => prev.map(item => ({ ...item, isFound: false })));
    setIsRoundComplete(false);
    setWrongClickId(null);
  }, [currentRoundIndex]);

  // Check for round completion
  useEffect(() => {
    if (foundCount === currentRound.targetCount) {
      setIsRoundComplete(true);
      clapSound.current.play();
    }
  }, [foundCount, currentRound]);

  // --- INTERACTION ---
  const handleItemClick = (item: SceneItem) => {
    if (isRoundComplete || item.isFound) return;

    if (item.material === currentRound.materialToFind) {
      correctSound.current.play();
      setFoundCount(prev => prev + 1);
      setSceneItems(prev => 
        prev.map(sItem => 
          sItem.id === item.id ? { ...sItem, isFound: true } : sItem
        )
      );
    } else {
      wrongSound.current.play();
      setWrongClickId(item.id);
      setTimeout(() => setWrongClickId(null), 500);
    }
  };

  const handleNextRound = () => {
    if (currentRoundIndex < GAME_ROUNDS.length - 1) {
      setCurrentRoundIndex(prev => prev + 1);
    } else {
      setIsGameComplete(true);
      confetti({ particleCount: 200, spread: 80, origin: { y: 0.6 } });
    }
  };

  // --- RENDER ---
  if (isGameComplete) {
    return (
      <div className="p-6 text-center flex flex-col items-center justify-center h-full text-white">
        <CheckCircle size={80} className="text-green-400 mb-4" />
        <h2 className="text-3xl font-bold">Material Detective!</h2>
        <p className="text-lg mb-6">You found all the materials!</p>
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
      
      {/* Question Header */}
      <div className="text-center mb-4">
        <h3 className="text-2xl font-bold">{isRoundComplete ? "Great Job!" : currentRound.prompt}</h3>
        <p className="text-xl text-cyan-300">
          Found: <span className="font-bold">{foundCount}</span> / <span className="font-bold">{currentRound.targetCount}</span>
        </p>
      </div>
      
      {/* "I-Spy" Room */}
      <div 
        className="relative flex-grow bg-blue-900/70 rounded-xl overflow-hidden shadow-lg border-4 border-white/20"
        style={{
          backgroundImage: 'url(https://via.placeholder.com/600x400/304e6e/ffffff?text=Room+Scene)', // Placeholder room image
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {sceneItems.map(item => (
          <div
            key={item.id}
            onClick={() => handleItemClick(item)}
            className={`absolute transition-all duration-200
              ${item.isFound 
                ? 'opacity-50 scale-90' 
                : 'cursor-pointer hover:scale-110'}
              ${wrongClickId === item.id ? 'animate-shake' : ''}
            `}
            style={item.position}
            title={item.name}
          >
            {/* Checkmark if found */}
            {item.isFound && (
              <span className="absolute -top-4 -right-2 text-4xl text-green-400">✓</span>
            )}
            <span className="text-6xl p-2 bg-black/10 rounded-lg">{item.emoji}</span>
          </div>
        ))}
      </div>

      {/* Next Button */}
      {isRoundComplete && (
        <button
          onClick={handleNextRound}
          className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors mt-4"
        >
          {currentRoundIndex < GAME_ROUNDS.length - 1 ? "Next Round" : "All Done!"}
        </button>
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

export default MaterialFinderGame;