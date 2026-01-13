import React, { useState, useEffect, useRef, useCallback } from "react";
import { CheckCircle, Search } from "lucide-react";
import confetti from "canvas-confetti";

interface LessonProps {
  onComplete: () => void;
}

// --- DATA STRUCTURES ---

type GermSpot = {
  id: string;
  x: number; // Percentage from left
  y: number; // Percentage from top
  found: boolean;
};

// --- GAME DATA ---
const SCENE_GERM_SPOTS: GermSpot[] = [
  { id: "spot1", x: 20, y: 55, found: false },
  { id: "spot2", x: 50, y: 65, found: false },
  { id: "spot3", x: 60, y: 70, found: false },
  { id: "spot4", x: 75, y: 40, found: false },
  { id: "spot5", x: 30, y: 40, found: false },
  { id: "spot6", x: 80, y: 80, found: false },
  { id: "spot7", x: 40, y: 85, found: false },
  { id: "spot8", x: 15, y: 75, found: false },
];

const MAGNIFYING_GLASS_SIZE = 80; // px, for interaction area

// --- COMPONENT ---

const GermScannerGame: React.FC<LessonProps> = ({ onComplete }) => {
  // --- STATE ---
  const [germSpots, setGermSpots] = useState<GermSpot[]>([]);
  const [germsFoundCount, setGermsFoundCount] = useState(0);
  const [isGameComplete, setIsGameComplete] = useState(false);

  // Magnifying glass position (controlled by drag/touch)
  const [magGlassPos, setMagGlassPos] = useState({ x: 50, y: 50 }); // Center of the glass
  const [isDragging, setIsDragging] = useState(false);

  // --- REFS ---
  const gameAreaRef = useRef<HTMLDivElement>(null);

  // --- SOUNDS ---
  const createMockAudio = () => ({
    play: () => { /* console.log("Audio play mock") */ },
    pause: () => { /* console.log("Audio pause mock") */ },
    currentTime: 0,
  });

  const sparkleSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/sparkle.mp3") : createMockAudio());
  const clapSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/clap.mp3") : createMockAudio());

  // --- GAME SETUP ---
  useEffect(() => {
    setGermSpots(SCENE_GERM_SPOTS.map(spot => ({ ...spot, found: false })));
    setGermsFoundCount(0);
    setIsGameComplete(false);
  }, []);

  // --- GAME COMPLETION CHECK ---
  useEffect(() => {
    if (germSpots.length > 0 && germsFoundCount === germSpots.length && !isGameComplete) {
      setIsGameComplete(true);
      clapSound.current.play();
      confetti({ particleCount: 200, spread: 80, origin: { y: 0.6 } });
    }
  }, [germsFoundCount, germSpots.length, isGameComplete, clapSound]);

  // --- MAGNIFYING GLASS LOGIC ---
  const checkCollisions = useCallback(() => {
    if (!gameAreaRef.current) return;

    const gameRect = gameAreaRef.current.getBoundingClientRect();
    const magGlassCenterX = magGlassPos.x;
    const magGlassCenterY = magGlassPos.y;

    let newlyFound = false;

    setGermSpots(prevSpots => {
      let currentFoundCount = 0;
      const updatedSpots = prevSpots.map(spot => {
        if (spot.found) {
          currentFoundCount++;
          return spot;
        }

        // Convert germ spot percentages to absolute pixels
        const germAbsX = (spot.x / 100) * gameRect.width;
        const germAbsY = (spot.y / 100) * gameRect.height;

        // Check if germ spot is within magnifying glass interaction area
        const distanceX = Math.abs(magGlassCenterX - germAbsX);
        const distanceY = Math.abs(magGlassCenterY - germAbsY);

        const detectionRadius = MAGNIFYING_GLASS_SIZE / 2; // Radius of interaction

        if (distanceX < detectionRadius && distanceY < detectionRadius) {
          if (!spot.found) { // Only count and play sound if it's new
            newlyFound = true;
          }
          currentFoundCount++;
          return { ...spot, found: true };
        }
        return spot;
      });

      if (newlyFound) {
        sparkleSound.current.currentTime = 0;
        sparkleSound.current.play();
        setGermsFoundCount(currentFoundCount);
      }
      return updatedSpots;
    });

  }, [magGlassPos.x, magGlassPos.y, sparkleSound]);

  useEffect(() => {
    // Only check collisions if dragging or after a position update
    if (isDragging) {
      checkCollisions();
    }
  }, [magGlassPos, isDragging, checkCollisions]);


  // --- DRAG & TOUCH HANDLERS for Magnifying Glass ---
  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!gameAreaRef.current) return;

    const gameRect = gameAreaRef.current.getBoundingClientRect();
    const newX = Math.max(MAGNIFYING_GLASS_SIZE / 2, Math.min(gameRect.width - MAGNIFYING_GLASS_SIZE / 2, clientX - gameRect.left));
    const newY = Math.max(MAGNIFYING_GLASS_SIZE / 2, Math.min(gameRect.height - MAGNIFYING_GLASS_SIZE / 2, clientY - gameRect.top));

    setMagGlassPos({ x: newX, y: newY });
  }, []);

  const onMouseDown = useCallback((_e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    handleMove(e.clientX, e.clientY);
  }, [isDragging, handleMove]);

  const onMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const onMouseLeave = useCallback(() => { // If mouse leaves game area while dragging
    setIsDragging(false);
  }, []);

  const onTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    setIsDragging(true);
    handleMove(e.touches[0].clientX, e.touches[0].clientY);
    e.preventDefault(); // Prevent scrolling
  }, [handleMove]);

  const onTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    handleMove(e.touches[0].clientX, e.touches[0].clientY);
    e.preventDefault(); // Prevent scrolling
  }, [isDragging, handleMove]);

  const onTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);


  // --- RENDER ---
  if (isGameComplete) {
    return (
      <div className="p-6 text-center flex flex-col items-center justify-center h-full text-white">
        <CheckCircle size={80} className="text-green-400 mb-4" />
        <h2 className="text-3xl font-bold">Germ Detective!</h2>
        <p className="text-lg mb-6">You found all the invisible germs!</p>
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
      <h3 className="text-2xl font-bold text-center mb-4">Drag the magnifying glass to find the germs!</h3>
      
      {/* Game Area - where background and interactables live */}
      <div
        ref={gameAreaRef}
        className="relative flex-grow bg-black rounded-xl overflow-hidden shadow-lg border-4 border-blue-600"
        style={{
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Current Score */}
        <div className="absolute top-4 left-4 bg-black/50 text-white p-2 rounded-lg text-lg font-bold z-20">
          Germs Found: {germsFoundCount} / {germSpots.length}
        </div>

        {/* Magnifying Glass */}
        <div
          className="absolute flex items-center justify-center text-5xl bg-white/30 backdrop-blur-sm rounded-full border-4 border-white shadow-xl z-10 pointer-events-none"
          style={{
            width: MAGNIFYING_GLASS_SIZE,
            height: MAGNIFYING_GLASS_SIZE,
            left: magGlassPos.x - MAGNIFYING_GLASS_SIZE / 2, // Center the glass icon
            top: magGlassPos.y - MAGNIFYING_GLASS_SIZE / 2,
            cursor: isDragging ? 'grabbing' : 'grab',
          }}
        >
          <Search size={MAGNIFYING_GLASS_SIZE * 0.6} className="text-blue-200" />
        </div>

        {/* Germ Sprites (Grow when found) */}
        {germSpots.map(spot => (
          <div
            key={spot.id}
            className={`absolute text-3xl transition-all duration-300 ease-out
              ${spot.found ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}
            `}
            style={{
              left: `calc(${spot.x}% - 15px)`, // Center emoji
              top: `calc(${spot.y}% - 15px)`, // Center emoji
            }}
          >
            🦠
          </div>
        ))}

      </div>

      {/* Styles for sparkle animation (optional) */}
      <style>
        {`
          @keyframes sparkle {
            0% { opacity: 0; transform: scale(0.5) translateY(0); }
            50% { opacity: 1; transform: scale(1.2) translateY(-10px); }
            100% { opacity: 0; transform: scale(0.8) translateY(-20px); }
          }
          .animate-sparkle {
            animation: sparkle 1s ease-out forwards;
          }
        `}
      </style>
    </div>
  );
};

export default GermScannerGame;

