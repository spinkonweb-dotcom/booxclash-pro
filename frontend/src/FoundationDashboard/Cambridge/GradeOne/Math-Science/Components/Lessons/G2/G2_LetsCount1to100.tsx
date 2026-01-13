import React, { useState, useEffect, useRef, useCallback } from "react";
import { CheckCircle } from "lucide-react";
import confetti from "canvas-confetti";

interface LessonProps {
  onComplete: () => void;
}

// --- GAME CONFIGURATION ---
const GRID_SIZE = 100;
const NUM_MISSING_NUMBERS = 8; // How many numbers will be missing per game

// --- COMPONENT ---

const HundredChartFillUpGame: React.FC<LessonProps> = ({ onComplete }) => {
  // --- STATE ---
  const [gridNumbers, setGridNumbers] = useState<(number | null)[]>([]);
  const [missingNumbers, setMissingNumbers] = useState<number[]>([]); // Numbers to be dragged
  const [filledNumbersCount, setFilledNumbersCount] = useState(0);
  const [isGameComplete, setIsGameComplete] = useState(false);

  // Drag state
  const [draggingNumber, setDraggingNumber] = useState<number | null>(null);
  const [dragOverCell, setDragOverCell] = useState<number | null>(null); // Index of the cell being dragged over

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
  useEffect(() => {
    initializeGame();
  }, []); // Run once on component mount

  const initializeGame = useCallback(() => {
    const fullGrid = Array.from({ length: GRID_SIZE }, (_, i) => i + 1);
    const availableNumbers = [...fullGrid];

    // Select random numbers to be missing
    const selectedMissingNumbers: number[] = [];
    for (let i = 0; i < NUM_MISSING_NUMBERS; i++) {
      if (availableNumbers.length === 0) break; // Should not happen with typical settings
      const randomIndex = Math.floor(Math.random() * availableNumbers.length);
      const missingNum = availableNumbers.splice(randomIndex, 1)[0];
      selectedMissingNumbers.push(missingNum);
    }

    // Create the grid with nulls for missing numbers
    const newGridNumbers = fullGrid.map(num =>
      selectedMissingNumbers.includes(num) ? null : num
    );

    setGridNumbers(newGridNumbers);
    setMissingNumbers(selectedMissingNumbers.sort((a, b) => a - b)); // Sort for better display
    setFilledNumbersCount(0);
    setIsGameComplete(false);
  }, []);

  // --- GAME COMPLETION CHECK ---
  useEffect(() => {
    if (filledNumbersCount === NUM_MISSING_NUMBERS && NUM_MISSING_NUMBERS > 0) {
      setIsGameComplete(true);
      clapSound.current.play();
      confetti({ particleCount: 200, spread: 80, origin: { y: 0.6 } });
    }
  }, [filledNumbersCount]);


  // --- DRAG & DROP LOGIC ---

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, num: number) => {
    e.dataTransfer.setData("draggingNumber", num.toString());
    setDraggingNumber(num);
  };

  const handleDragEnd = () => {
    setDraggingNumber(null);
    setDragOverCell(null);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    if (gridNumbers[index] === null) { // Only highlight empty cells
      setDragOverCell(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverCell(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetIndex: number) => {
    e.preventDefault();
    setDragOverCell(null);
    const droppedNumber = parseInt(e.dataTransfer.getData("draggingNumber"));

    if (gridNumbers[targetIndex] === null) { // Ensure cell is empty
      const expectedNumber = targetIndex + 1; // 1-indexed for the grid
      if (droppedNumber === expectedNumber) {
        correctSound.current.play();
        setGridNumbers(prev => {
          const newGrid = [...prev];
          newGrid[targetIndex] = droppedNumber;
          return newGrid;
        });
        setMissingNumbers(prev => prev.filter(num => num !== droppedNumber));
        setFilledNumbersCount(prev => prev + 1);
      } else {
        wrongSound.current.play();
      }
    }
    setDraggingNumber(null);
  };

  // --- MOBILE TOUCH HANDLERS ---
  // Simplified: Mobile drag-and-drop can be complex for precise targeting.
  // For this game, we'll keep the drag part, but the drop target detection
  // might be less precise than desktop or require a "tap to place" approach.
  // For now, mirroring desktop logic with `elementFromPoint`.

  const handleTouchStart = (_e: React.TouchEvent<HTMLDivElement>, num: number) => {
    setDraggingNumber(num);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement | null;
    const gridCell = element?.closest("[data-cell-index]") as HTMLElement | null;

    if (gridCell?.dataset?.cellIndex) {
      const index = parseInt(gridCell.dataset.cellIndex);
      if (gridNumbers[index] === null) {
        setDragOverCell(index);
      } else {
        setDragOverCell(null);
      }
    } else {
      setDragOverCell(null);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>, itemNum: number) => {
    const touch = e.changedTouches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement | null;
    const gridCell = element?.closest("[data-cell-index]") as HTMLElement | null;

    if (gridCell?.dataset?.cellIndex) {
      const targetIndex = parseInt(gridCell.dataset.cellIndex);
      if (gridNumbers[targetIndex] === null) {
        const expectedNumber = targetIndex + 1;
        if (itemNum === expectedNumber) {
          correctSound.current.play();
          setGridNumbers(prev => {
            const newGrid = [...prev];
            newGrid[targetIndex] = itemNum;
            return newGrid;
          });
          setMissingNumbers(prev => prev.filter(num => num !== itemNum));
          setFilledNumbersCount(prev => prev + 1);
        } else {
          wrongSound.current.play();
        }
      }
    }
    setDraggingNumber(null);
    setDragOverCell(null);
  };

  // --- RENDER ---
  if (isGameComplete) {
    return (
      <div className="p-6 text-center flex flex-col items-center justify-center h-full text-white">
        <CheckCircle size={80} className="text-green-400 mb-4" />
        <h2 className="text-3xl font-bold">Fantastic!</h2>
        <p className="text-lg mb-6">You've mastered the 100 Chart!</p>
        <button
          onClick={onComplete}
          className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Continue Your Learning Journey
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 flex flex-col h-full text-white">
      <h3 className="text-2xl font-bold text-center mb-4">Fill in the missing numbers on the 100 chart!</h3>

      <div className="flex-grow flex flex-col lg:flex-row gap-4">
        {/* 100 Chart Grid */}
        <div className="flex-grow grid grid-cols-10 gap-1 bg-white/10 rounded-lg p-3 max-w-[500px] mx-auto">
          {gridNumbers.map((num, index) => (
            <div
              key={index}
              data-cell-index={index}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              className={`flex items-center justify-center text-lg font-semibold w-full aspect-square rounded-md
                ${num === null
                  ? `bg-white/20 border-2 border-dashed ${dragOverCell === index ? 'border-blue-400 scale-105' : 'border-white/30'}`
                  : 'bg-indigo-700'
                } transition-all duration-100`}
            >
              {num}
            </div>
          ))}
        </div>

        {/* Gumball Machine / Numbers to Drag */}
        <div className="w-full lg:w-1/4 bg-red-800 rounded-lg p-4 flex flex-col items-center justify-between shadow-lg relative overflow-hidden">
            {/* Gumball Machine Top */}
            <div className="w-24 h-12 bg-gray-300 rounded-t-full absolute -top-2"></div>
            <div className="w-16 h-8 bg-gray-400 rounded-t-full absolute -top-1 left-1/2 -translate-x-1/2"></div>
            <div className="w-1/2 h-4 bg-gray-500 rounded-b absolute top-8"></div>


            <p className="text-lg font-bold mb-3 z-10">Numbers to place:</p>
            <div className="flex flex-wrap justify-center gap-2 max-h-[calc(100%-60px)] overflow-auto custom-scrollbar">
              {missingNumbers.map((num) => (
                <div
                  key={num}
                  draggable
                  style={{ touchAction: "none" }}
                  onDragStart={(e) => handleDragStart(e, num)}
                  onDragEnd={handleDragEnd}
                  onTouchStart={(e) => handleTouchStart(e, num)}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={(e) => handleTouchEnd(e, num)}
                  className={`relative w-14 h-14 bg-amber-300 rounded-full flex items-center justify-center text-xl font-bold text-amber-900 cursor-grab shadow-md
                    ${draggingNumber === num ? "opacity-30 scale-110" : "opacity-100"} transition-all duration-150`}
                >
                    {/* Gloss effect for gumball */}
                    <div className="absolute inset-1 rounded-full bg-white opacity-20 filter blur-[1px]"></div>
                    {/* Shadow for gumball */}
                    <div className="absolute inset-0 rounded-full shadow-inner shadow-amber-600/50"></div>
                    <span className="relative z-10">{num}</span>
                </div>
              ))}
            </div>
             {/* Small visual detail for gumball chute */}
            <div className="w-16 h-8 bg-gray-400 rounded-b-lg absolute bottom-0 left-1/2 -translate-x-1/2"></div>
        </div>
      </div>
    </div>
  );
};

export default HundredChartFillUpGame;
