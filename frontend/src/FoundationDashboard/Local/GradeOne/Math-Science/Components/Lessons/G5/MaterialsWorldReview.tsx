import React, { useState, useEffect, useRef, useCallback } from "react";
import { CheckCircle } from "lucide-react";
import confetti from "canvas-confetti";

interface LessonProps {
  onComplete: () => void;
}

// --- DATA STRUCTURES ---

type GameStage = 'building' | 'eco' | 'complete';
type BuildItemType = 'wooden-square' | 'glass-square' | 'metal-triangle' | 'wooden-triangle';
type EcoItemType = 'solar-panel' | 'recycle-bin';
type PaletteItemType = BuildItemType | EcoItemType;

type BuildSlotType = 'wall' | 'roof';
type EcoSlotType = 'solar-slot' | 'bin-slot';
type SlotType = BuildSlotType | EcoSlotType;

type BuiltPartDetail = {
  built: boolean;
  correctItem: PaletteItemType;
};

type BuiltPartsState = {
  wall: BuiltPartDetail;
  roof: BuiltPartDetail;
  solar: BuiltPartDetail;
  bin: BuiltPartDetail;
};

type PaletteItem = {
  type: PaletteItemType;
  label: string;
  emoji: string;
};

// --- GAME DATA ---

const BUILDING_PALETTE: PaletteItem[] = [
  { type: 'wooden-square', label: 'Wood Wall', emoji: '🟫' },
  { type: 'metal-triangle', label: 'Metal Roof', emoji: '🔺' },
  { type: 'glass-square', label: 'Glass Wall', emoji: '🧊' },
  { type: 'wooden-triangle', label: 'Wood Roof', emoji: '🪵' },
];

const ECO_PALETTE: PaletteItem[] = [
  { type: 'solar-panel', label: 'Solar Panel', emoji: '☀️' },
  { type: 'recycle-bin', label: 'Recycle Bin', emoji: '♻️' },
];

const INITIAL_PARTS: BuiltPartsState = {
  wall: { built: false, correctItem: 'wooden-square' },
  roof: { built: false, correctItem: 'metal-triangle' },
  solar: { built: false, correctItem: 'solar-panel' },
  bin: { built: false, correctItem: 'recycle-bin' },
};

// --- COMPONENT ---

const ClubhouseBuilderGame: React.FC<LessonProps> = ({ onComplete }) => {
  // --- STATE ---
  const [gameStage, setGameStage] = useState<GameStage>('building');
  const [builtParts, setBuiltParts] = useState<BuiltPartsState>(INITIAL_PARTS);
  const [activeItem, setActiveItem] = useState<PaletteItemType | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'wrong', slot: SlotType } | null>(null);
  const [prompt, setPrompt] = useState("Let's build a clubhouse! Select a part.");

  // --- SOUNDS ---
  const createMockAudio = () => ({
    play: () => { /* console.log("Audio play mock") */ },
    pause: () => { /* console.log("Audio pause mock") */ },
    currentTime: 0,
  });

  const buildSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/correct.mp3") : createMockAudio());
  const wrongSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/incorrect.mp3") : createMockAudio());
  const clapSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/clap.mp3") : createMockAudio());
  const stageSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/stage_clear.mp3") : createMockAudio()); // Optional new sound

  // --- GAME SETUP ---
  const resetGame = useCallback(() => {
    setBuiltParts(INITIAL_PARTS);
    setGameStage('building');
    setActiveItem(null);
    setFeedback(null);
    setPrompt("Let's build a clubhouse! Select a part.");
  }, []);

  useEffect(() => {
    resetGame();
  }, [resetGame]);

  // --- GAME LOGIC ---

  // Check for stage completion
  useEffect(() => {
    if (gameStage === 'building' && builtParts.wall.built && builtParts.roof.built) {
      // Stage 1 Complete
      stageSound.current.play();
      setGameStage('eco');
      setActiveItem(null);
      setPrompt("Great! Now let's add some eco-friendly items.");
    } else if (gameStage === 'eco' && builtParts.solar.built && builtParts.bin.built) {
      // Game Complete
      setTimeout(() => {
        setGameStage('complete');
        clapSound.current.play();
        confetti({ particleCount: 200, spread: 80, origin: { y: 0.6 } });
      }, 1000);
    }
  }, [builtParts, gameStage, clapSound, stageSound]);

  const handleItemClick = (itemType: PaletteItemType) => {
    setActiveItem(itemType);
    const item = [...BUILDING_PALETTE, ...ECO_PALETTE].find(i => i.type === itemType);
    setPrompt(`Where does the ${item?.label.toLowerCase()} go?`);
    setFeedback(null);
  };

  const handleSlotClick = (slot: SlotType, correctItem: PaletteItemType) => {
    if (!activeItem || feedback) return;

    if (activeItem === correctItem) {
      // --- CORRECT ---
      buildSound.current.play();
      if (slot === 'wall') setBuiltParts(p => ({ ...p, wall: { ...p.wall, built: true } }));
      if (slot === 'roof') setBuiltParts(p => ({ ...p, roof: { ...p.roof, built: true } }));
      if (slot === 'solar-slot') setBuiltParts(p => ({ ...p, solar: { ...p.solar, built: true } }));
      if (slot === 'bin-slot') setBuiltParts(p => ({ ...p, bin: { ...p.bin, built: true } }));

      setActiveItem(null);
      setPrompt("Perfect! Select the next part.");
    } else {
      // --- WRONG ---
      wrongSound.current.play();
      setFeedback({ type: 'wrong', slot: slot });
      setActiveItem(null);
      setPrompt("That doesn't go there. Try again.");
      setTimeout(() => {
        setFeedback(null);
        if (!activeItem) setPrompt("Select a part.");
      }, 1000);
    }
  };

  // --- RENDER ---
  if (gameStage === 'complete') {
    return (
      <div className="p-6 text-center flex flex-col items-center justify-center h-full text-white">
        <CheckCircle size={80} className="text-green-400 mb-4" />
        <h2 className="text-3xl font-bold">Clubhouse Complete!</h2>
        <p className="text-lg mb-6">You built a strong AND eco-friendly clubhouse!</p>
        <button
          onClick={onComplete}
          className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Finish Lesson
        </button>
      </div>
    );
  }

  const currentPalette = gameStage === 'building' ? BUILDING_PALETTE : ECO_PALETTE;

  return (
    <div className="p-4 flex flex-col h-full text-white overflow-hidden">
      <h3 className="text-2xl font-bold text-center mb-2">Build a Clubhouse</h3>
      <p className="text-lg text-center text-cyan-300 mb-4 h-12">{prompt}</p>

      {/* Blueprint Area */}
      <div className="relative flex-grow flex justify-center items-center mb-4 min-h-[300px]">
        <div className="relative w-64 h-64">
          
          {/* Roof Slot */}
          <button
            onClick={() => handleSlotClick('roof', builtParts.roof.correctItem)}
            disabled={builtParts.roof.built}
            className={`absolute top-0 left-1/2 -translate-x-1/2 w-0 h-0
              border-l-[140px] border-l-transparent
              border-r-[140px] border-r-transparent
              border-b-[100px] 
              transition-all duration-300
              ${builtParts.roof.built ? 'border-b-slate-500' : 'border-b-white/20 border-dashed'}
              ${feedback?.slot === 'roof' ? 'animate-shake' : ''}
              ${activeItem === 'metal-triangle' && !builtParts.roof.built ? 'animate-pulse' : ''}
            `}
          >
            {builtParts.roof.built && (
              <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-5xl">🔺</span>
            )}
          </button>
          
          {/* Wall Slot */}
          <button
            onClick={() => handleSlotClick('wall', builtParts.wall.correctItem)}
            disabled={builtParts.wall.built}
            className={`absolute bottom-0 left-0 w-full h-40 
              transition-all duration-300
              flex justify-center items-center
              ${builtParts.wall.built ? 'bg-yellow-900' : 'bg-white/10 border-2 border-white/30 border-dashed'}
              ${feedback?.slot === 'wall' ? 'animate-shake' : ''}
              ${activeItem === 'wooden-square' && !builtParts.wall.built ? 'animate-pulse' : ''}
            `}
          >
            {builtParts.wall.built && <span className="text-7xl opacity-80">🟫</span>}
          </button>

          {/* === ECO SLOTS === */}
          {gameStage === 'eco' && (
            <>
              {/* Solar Panel Slot (on roof) */}
              <button
                onClick={() => handleSlotClick('solar-slot', builtParts.solar.correctItem)}
                disabled={builtParts.solar.built}
                className={`absolute top-16 left-1/2 -translate-x-1/4 w-20 h-10
                  transition-all duration-300
                  flex justify-center items-center
                  ${builtParts.solar.built ? 'bg-blue-800' : 'bg-black/20 border-2 border-white/30 border-dashed'}
                  ${feedback?.slot === 'solar-slot' ? 'animate-shake' : ''}
                  ${activeItem === 'solar-panel' && !builtParts.solar.built ? 'animate-pulse' : ''}
                `}
              >
                {builtParts.solar.built && <span className="text-3xl">☀️</span>}
              </button>

              {/* Recycle Bin Slot (next to door/wall) */}
              <button
                onClick={() => handleSlotClick('bin-slot', builtParts.bin.correctItem)}
                disabled={builtParts.bin.built}
                className={`absolute bottom-0 -right-20 w-16 h-20
                  transition-all duration-300
                  flex justify-center items-center
                  ${builtParts.bin.built ? 'bg-green-700' : 'bg-white/10 border-2 border-white/30 border-dashed'}
                  ${feedback?.slot === 'bin-slot' ? 'animate-shake' : ''}
                  ${activeItem === 'recycle-bin' && !builtParts.bin.built ? 'animate-pulse' : ''}
                `}
              >
                {builtParts.bin.built && <span className="text-4xl">♻️</span>}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Material Palette */}
      <div className="flex justify-center items-center gap-3">
        {currentPalette.map((item) => {
          const isActive = activeItem === item.type;
          const isFaded = activeItem && !isActive;

          return (
            <button
              key={item.type}
              onClick={() => handleItemClick(item.type)}
              className={`flex-1 flex flex-col items-center justify-center p-4 rounded-lg 
                bg-indigo-600 hover:bg-indigo-500
                transition-all duration-200
                ${isActive ? 'scale-105 ring-4 ring-blue-400' : ''}
                ${isFaded ? 'opacity-30' : ''}
              `}
            >
              <span className="text-5xl">{item.emoji}</span>
              <span className="text-lg font-semibold text-center">{item.label}</span>
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
          .animate-shake {
             animation: shake 0.5s ease-in-out;
          }
        `}
      </style>
    </div>
  );
};

export default ClubhouseBuilderGame;