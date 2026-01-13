import React, { useState, useEffect, useRef, useCallback } from "react";
import { CheckCircle } from "lucide-react";
import confetti from "canvas-confetti";

interface LessonProps {
  onComplete: () => void;
}

// --- DATA STRUCTURES ---

type MaterialType = 'brick' | 'glass' | 'wood';
type PartType = 'wall' | 'window' | 'roof';

type Material = {
  type: MaterialType;
  label: string;
  emoji: string;
};

type BuildPart = {
  type: PartType;
  label: string;
  correctMaterial: MaterialType;
  built: boolean;
};

// --- GAME DATA ---

const MATERIALS: Material[] = [
  { type: 'brick', label: 'Bricks', emoji: '🧱' },
  { type: 'glass', label: 'Glass', emoji: '🧊' },
  { type: 'wood', label: 'Wood', emoji: '🪵' },
];

const INITIAL_BLUEPRINT_PARTS: BuildPart[] = [
  { type: 'wall', label: 'Wall', correctMaterial: 'brick', built: false },
  { type: 'window', label: 'Window', correctMaterial: 'glass', built: false },
  { type: 'roof', label: 'Roof', correctMaterial: 'wood', built: false },
];

// --- COMPONENT ---

const BlueprintBuilderGame: React.FC<LessonProps> = ({ onComplete }) => {
  // --- STATE ---
  const [blueprintParts, setBlueprintParts] = useState<BuildPart[]>(INITIAL_BLUEPRINT_PARTS);
  const [activeMaterial, setActiveMaterial] = useState<MaterialType | null>(null);
  const [isGameComplete, setIsGameComplete] = useState(false);
  const [wrongPart, setWrongPart] = useState<PartType | null>(null);
  const [prompt, setPrompt] = useState("Select a material to build with.");

  // --- SOUNDS ---
  const createMockAudio = () => ({
    play: () => { /* console.log("Audio play mock") */ },
    pause: () => { /* console.log("Audio pause mock") */ },
    currentTime: 0,
  });

  const buildSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/correct.mp3") : createMockAudio()); // Re-using correct
  const wrongSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/incorrect.mp3") : createMockAudio());
  const clapSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/clap.mp3") : createMockAudio());

  // --- GAME SETUP ---
  const resetGame = useCallback(() => {
    // Make sure to create a new array to trigger state update
    setBlueprintParts(INITIAL_BLUEPRINT_PARTS.map(p => ({ ...p, built: false })));
    setActiveMaterial(null);
    setIsGameComplete(false);
    setWrongPart(null);
    setPrompt("Select a material to build with.");
  }, []);

  // Reset game on load
  useEffect(() => {
    resetGame();
  }, [resetGame]);

  // --- GAME LOGIC ---

  // Check for game completion whenever parts are updated
  useEffect(() => {
    const allBuilt = blueprintParts.every(part => part.built);
    if (allBuilt && !isGameComplete) {
      // Delay to let the user see the final built part
      setTimeout(() => {
        setIsGameComplete(true);
        clapSound.current.play();
        confetti({ particleCount: 200, spread: 80, origin: { y: 0.6 } });
      }, 1000);
    }
  }, [blueprintParts, isGameComplete, clapSound]);

  const handleMaterialClick = (materialType: MaterialType) => {
    // selectSound.current.play();
    setActiveMaterial(materialType);
    const material = MATERIALS.find(m => m.type === materialType);
    setPrompt(`Where do the ${material?.label.toLowerCase()} go?`);
    setWrongPart(null); // Clear any "wrong" shakes
  };

  const handlePartClick = (clickedPart: BuildPart) => {
    // Don't do anything if no material is selected or part is already built
    if (!activeMaterial || clickedPart.built) return;

    if (activeMaterial === clickedPart.correctMaterial) {
      // --- CORRECT ---
      buildSound.current.play();
      setBlueprintParts(prevParts =>
        prevParts.map(part =>
          part.type === clickedPart.type ? { ...part, built: true } : part
        )
      );
      setActiveMaterial(null); // Deselect material after using it
      setPrompt("Great! Select the next material.");
    } else {
      // --- WRONG ---
      wrongSound.current.play();
      setWrongPart(clickedPart.type); // Make the *part* shake
      setActiveMaterial(null); // Deselect material
      setPrompt("That doesn't seem right. Try again.");
      setTimeout(() => {
        setWrongPart(null);
        if (!activeMaterial) setPrompt("Select a material to build with.");
      }, 1000);
    }
  };

  // --- RENDER ---
  if (isGameComplete) {
    return (
      <div className="p-6 text-center flex flex-col items-center justify-center h-full text-white">
        <CheckCircle size={80} className="text-green-400 mb-4" />
        <h2 className="text-3xl font-bold">House Built!</h2>
        <p className="text-lg mb-6">You used all the right materials!</p>
        <button
          onClick={onComplete}
          className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Finish Lesson
        </button>
      </div>
    );
  }

  // Get part objects for rendering
  const wall = blueprintParts.find(p => p.type === 'wall')!;
  const window = blueprintParts.find(p => p.type === 'window')!;
  const roof = blueprintParts.find(p => p.type === 'roof')!;

  return (
    <div className="p-4 flex flex-col h-full text-white overflow-hidden">
      <h3 className="text-2xl font-bold text-center mb-2">Blueprint Builder</h3>
      <p className="text-lg text-center text-cyan-300 mb-4 h-12">{prompt}</p>

      {/* Blueprint Area */}
      <div className="relative flex-grow flex justify-center items-center mb-4 min-h-[250px]">
        {/* Simple house structure */}
        <div className="relative w-64 h-64">
          {/* Roof */}
          <button
            onClick={() => handlePartClick(roof)}
            disabled={roof.built}
            className={`absolute top-0 left-1/2 -translate-x-1/2 w-0 h-0
              border-l-[140px] border-l-transparent
              border-r-[140px] border-r-transparent
              border-b-[100px] 
              transition-all duration-300
              ${roof.built ? 'border-b-yellow-900' : 'border-b-white/20 border-dashed'}
              ${wrongPart === 'roof' ? 'animate-shake' : ''}
              ${activeMaterial === 'wood' && !roof.built ? 'animate-pulse' : ''}
            `}
          >
            {roof.built && (
              <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-5xl">🪵</span>
            )}
          </button>
          
          {/* Wall */}
          <button
            onClick={() => handlePartClick(wall)}
            disabled={wall.built}
            className={`absolute bottom-0 left-0 w-full h-40 
              transition-all duration-300
              flex justify-center items-center
              ${wall.built ? 'bg-red-800' : 'bg-white/10 border-2 border-white/30 border-dashed'}
              ${wrongPart === 'wall' ? 'animate-shake' : ''}
              ${activeMaterial === 'brick' && !wall.built ? 'animate-pulse' : ''}
            `}
          >
            {wall.built && <span className="text-5xl opacity-80">🧱</span>}
          </button>

          {/* Window */}
          <button
            onClick={() => handlePartClick(window)}
            disabled={window.built}
            className={`absolute bottom-10 left-1/2 -translate-x-1/2 w-20 h-20 
              transition-all duration-300
              flex justify-center items-center
              ${window.built ? 'bg-sky-300' : 'bg-black/20 border-2 border-white/30 border-dashed'}
              ${wrongPart === 'window' ? 'animate-shake' : ''}
              ${activeMaterial === 'glass' && !window.built ? 'animate-pulse' : ''}
            `}
          >
            {window.built && <span className="text-5xl">🧊</span>}
          </button>
        </div>
      </div>

      {/* Material Palette */}
      <div className="flex justify-center items-center gap-3">
        {MATERIALS.map((material) => {
          const isActive = activeMaterial === material.type;
          const isFaded = activeMaterial && !isActive;

          return (
            <button
              key={material.type}
              onClick={() => handleMaterialClick(material.type)}
              className={`flex-1 flex flex-col items-center justify-center p-4 rounded-lg 
                bg-indigo-600 hover:bg-indigo-500
                transition-all duration-200
                ${isActive ? 'scale-105 ring-4 ring-blue-400' : ''}
                ${isFaded ? 'opacity-30' : ''}
              `}
            >
              <span className="text-5xl">{material.emoji}</span>
              <span className="text-xl font-semibold">{material.label}</span>
            </button>
          );
        })}
      </div>

      {/* Animations */}
      <style>
        {`
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
          }
          /* Shaking the roof or window requires respecting existing transforms */
          .animate-shake {
             animation: shake 0.5s ease-in-out;
             /* We need to be careful not to override the translate-x-1/2 */
          }
        `}
      </style>
    </div>
  );
};

export default BlueprintBuilderGame;