import React, { useState, useEffect, useRef, useCallback } from "react";
import { CheckCircle, Heart, Shield, XCircle } from "lucide-react";
import confetti from "canvas-confetti";

interface LessonProps {
  onComplete: () => void;
}

// --- DATA STRUCTURES ---
type ItemType = 'healthy' | 'unhealthy';
type GameItem = {
  id: number;
  emoji: string;
  type: ItemType;
  x: number; // Position (percentage)
  y: 'ground' | 'air'; // Position
};

// --- GAME CONSTANTS ---
const GAME_SPEED = 25; // Percent of screen width per second
const ITEM_SPAWN_RATE = 2000; // ms
const SCORE_TO_WIN = 10;
const STARTING_LIVES = 3;
const JUMP_HEIGHT = "bottom-24"; // 96px
const GROUND_HEIGHT = "bottom-4"; // 16px
const JUMP_DURATION = 500; // ms

// --- COMPONENT ---
const HealthDefenderGame: React.FC<LessonProps> = ({ onComplete }) => {
  // --- STATE ---
  const [items, setItems] = useState<GameItem[]>([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(STARTING_LIVES);
  const [isJumping, setIsJumping] = useState(false);
  const [gameStatus, setGameStatus] = useState<'start' | 'playing' | 'win' | 'lose'>('start');

  // --- REFS ---
  const gameLoopRef = useRef<number | null>(null);
  const itemSpawnerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastTimeRef = useRef<number>(0);
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  // --- SOUNDS ---
  // Mock audio for environments where Audio API is not available or files are missing
  const createMockAudio = () => ({
    play: () => { /* console.log("Audio play mock") */ },
    pause: () => { /* console.log("Audio pause mock") */ },
    currentTime: 0,
  });

  const correctSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/correct.mp3") : createMockAudio());
  const wrongSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/incorrect.mp3") : createMockAudio());
  const clapSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/clap.mp3") : createMockAudio());

  // --- GAME LOGIC ---

  // Item Spawner
  const spawnItem = useCallback(() => {
    const isHealthy = Math.random() > 0.5;
    const isAir = Math.random() > 0.6; // 40% chance to be in the air
    
    let emoji;
    if (isHealthy) {
      emoji = ["🍎", "🥦", "🍓", "🏃", "🧼"][Math.floor(Math.random() * 5)];
    } else {
      emoji = ["🦠", "🤧", "🥤", "🍬", "🛋️"][Math.floor(Math.random() * 5)];
    }

    const newItem: GameItem = {
      id: Date.now(),
      emoji: emoji,
      type: isHealthy ? 'healthy' : 'unhealthy',
      x: 100,
      y: isAir ? 'air' : 'ground',
    };
    setItems(prev => [...prev, newItem]);
  }, []);

  // Game Loop
  const gameLoop = useCallback((timestamp: number) => {
    if (gameStatus !== 'playing') return;

    const deltaTime = timestamp - lastTimeRef.current;
    
    // Only update if enough time has passed (targeting ~60fps)
    if (deltaTime > 16) { 
      lastTimeRef.current = timestamp;
      // Calculate movement based on time, not frames
      const distanceToMove = (GAME_SPEED / 1000) * deltaTime;

      // Use a single functional update to process items, score, and lives
      setItems(prevItems => {
        let itemToRemove: number | null = null;
        let scoreDelta = 0;
        let livesDelta = 0;

        // 1. Process all items and determine changes
        const updatedItems = prevItems.map(item => {
          const newItemX = item.x - distanceToMove;
          
          // Collision Detection
          // Check if an item is in the hitzone and no other item has been processed this frame
          if (itemToRemove === null && newItemX < 30 && newItemX > 15) {
            const itemIsGround = item.y === 'ground';
            // isJumping is from the hook's closure, which is stable
            const heroIsGround = !isJumping; 

            // If hero and item are on the same level (ground or air)
            if (itemIsGround === heroIsGround) {
              itemToRemove = item.id; // Mark this item for removal
              if (item.type === 'healthy') {
                scoreDelta = 1;
                correctSound.current.play();
              } else {
                livesDelta = -1;
                wrongSound.current.play();
              }
            }
          }
          
          if (newItemX < -10) return null; // Remove item if off-screen
          if (item.id === itemToRemove) return null; // Remove collided item
          
          return { ...item, x: newItemX };
        }).filter(Boolean) as GameItem[];

        // 2. Apply score changes based on processing
        if (scoreDelta > 0) {
          setScore(prevScore => {
            const newScore = prevScore + scoreDelta;
            // Check for win condition *inside* the updater
            if (newScore >= SCORE_TO_WIN) {
              setGameStatus('win');
              clapSound.current.play();
              confetti({ particleCount: 200, spread: 80, origin: { y: 0.6 } });
            }
            return newScore;
          });
        }

        // 3. Apply lives changes based on processing
        if (livesDelta < 0) {
          setLives(prevLives => {
            const newLives = prevLives + livesDelta;
            // Check for lose condition *inside* the updater
            if (newLives <= 0) {
              setGameStatus('lose');
            }
            return newLives;
          });
        }

        // 4. Return the new items array
        return updatedItems;
      });
    }

    // Continue the loop
    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [gameStatus, isJumping, correctSound, wrongSound, clapSound]); // Dependencies are now minimal

  // Start/Stop Game Loop
  useEffect(() => {
    if (gameStatus === 'playing') {
      // Set start time for delta-time calculations
      lastTimeRef.current = performance.now();
      gameLoopRef.current = requestAnimationFrame(gameLoop);
      itemSpawnerRef.current = setInterval(spawnItem, ITEM_SPAWN_RATE);
    } else {
      // Clean up loop and spawner
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
      if (itemSpawnerRef.current) clearInterval(itemSpawnerRef.current);
    }
    
    // Cleanup function
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
      if (itemSpawnerRef.current) clearInterval(itemSpawnerRef.current);
    };
  }, [gameStatus, gameLoop, spawnItem]);

  // --- INTERACTION ---
  const handleJump = () => {
    if (gameStatus === 'start') {
      setGameStatus('playing');
      return;
    }
    if (gameStatus !== 'playing' || isJumping) return;
    
    setIsJumping(true);
    setTimeout(() => {
      setIsJumping(false);
    }, JUMP_DURATION);
  };

  const handleRestart = () => {
    setItems([]);
    setScore(0);
    setLives(STARTING_LIVES);
    setIsJumping(false);
    setGameStatus('start');
  };

  // --- RENDER ---

  const renderGameContent = () => {
    if (gameStatus === 'start') {
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 z-20">
          <h2 className="text-4xl font-bold mb-4">Health Quest</h2>
          <p className="text-xl mb-6">Collect healthy items, avoid unhealthy ones!</p>
          <button
            onClick={handleJump}
            className="w-1/2 bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 transition-colors text-2xl"
          >
            Start Game
          </button>
        </div>
      );
    }

    if (gameStatus === 'win') {
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 z-20">
          <CheckCircle size={80} className="text-green-400 mb-4" />
          <h2 className="text-4xl font-bold mb-4">You Won!</h2>
          <p className="text-xl mb-6">You are a true Health Defender!</p>
          <button
            onClick={onComplete}
            className="w-1/2 bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Finish Lesson
          </button>
          <button
            onClick={handleRestart}
            className="w-1/2 bg-gray-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-gray-600 transition-colors mt-4"
          >
            Play Again
          </button>
        </div>
      );
    }

    if (gameStatus === 'lose') {
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 z-20">
          <XCircle size={80} className="text-red-400 mb-4" />
          <h2 className="text-4xl font-bold mb-4">Game Over</h2>
          <p className="text-xl mb-6">Try again to be a Health Hero!</p>
          <button
            onClick={handleRestart}
            className="w-1/2 bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Restart
          </button>
        </div>
      );
    }
    return null;
  };

  // Render lives
  const renderLives = () => {
    return Array.from({ length: STARTING_LIVES }).map((_, i) => (
      <Heart key={i} size={32} className={i < lives ? "text-red-500 fill-red-500" : "text-gray-600"} />
    ));
  };
  
  // Render items
  const renderItems = () => {
    return items.map(item => (
      <div
        key={item.id}
        className={`absolute text-5xl ${item.y === 'ground' ? GROUND_HEIGHT : JUMP_HEIGHT}`}
        style={{ left: `${item.x}%` }}
      >
        {item.emoji}
      </div>
    ));
  };

  return (
    <div 
      className="p-4 flex flex-col h-full text-white overflow-hidden"
      // Use onMouseDown for quicker response on desktop, onTouchStart for mobile
      onMouseDown={handleJump}
      onTouchStart={(e) => {
        e.preventDefault(); // Prevent "click" event firing after
        handleJump();
      }}
    >
      {/* Game Header */}
      <div className="flex justify-between items-center mb-4 z-30">
        <div className="flex gap-2">
          {renderLives()}
        </div>
        <div className="text-3xl font-bold">
          <Shield size={32} className="inline-block text-cyan-400 mr-2" /> Score: {score}
        </div>
      </div>

      {/* Game Area */}
      <div ref={gameAreaRef} className="relative flex-grow bg-blue-900 rounded-xl overflow-hidden shadow-lg border-b-8 border-green-700">
        {/* Game Status Content (Start, Win, Lose) */}
        {renderGameContent()}
        
        {/* Hero */}
        <div
          ref={heroRef}
          className={`absolute text-7xl transition-all duration-150 ease-out left-[20%]
            ${isJumping ? JUMP_HEIGHT : GROUND_HEIGHT}
          `}
        >
          🦸
        </div>

        {/* Items */}
        {renderItems()}

        {/* Ground Line (Visual) */}
        <div className="absolute bottom-2 left-0 right-0 h-2 bg-green-800" />
      </div>
    </div>
  );
};

export default HealthDefenderGame;

