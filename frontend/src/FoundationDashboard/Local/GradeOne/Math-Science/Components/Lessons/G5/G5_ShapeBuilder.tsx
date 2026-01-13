import React, { useState, useEffect, useRef, useCallback } from "react";
import { CheckCircle, Puzzle } from "lucide-react";
import confetti from "canvas-confetti";

interface LessonProps {
  onComplete: () => void;
}

// --- DATA STRUCTURES ---

type ShapeID = 
  | 'house-roof' | 'house-base'
  | 'boat-sail' | 'boat-hull'
  | 'tree-leaves' | 'tree-trunk'
  | 'rocket-nose' | 'rocket-body' | 'rocket-fin-l' | 'rocket-fin-r'
  | 'fish-body' | 'fish-tail' | 'fish-fin';

// Static data for a puzzle piece
type PuzzlePieceData = {
  id: ShapeID;
  label: string;
  style: React.CSSProperties; // Style of the shape itself (color, size)
  className?: string;
  initialPos: { x: number, y: number }; // Position in the palette
  correctSlotId: string;
};

// Static data for a drop slot
type PuzzleSlotData = {
  id: string;
  label: string;
  style: React.CSSProperties; // Position and size of the slot
  className?: string;
};

// Dynamic state for a piece
type PieceState = {
  id: ShapeID;
  pos: { x: number, y: number };
  isPlaced: boolean;
};

type Puzzle = {
  id: string;
  name: string;
  pieces: PuzzlePieceData[];
  slots: PuzzleSlotData[];
};

// --- GAME DATA: 5 OBJECTS ---

const ALL_PUZZLES: Puzzle[] = [
  // 1. House
  {
    id: 'house',
    name: 'House',
    pieces: [
      { id: 'house-roof', label: 'Roof', style: { borderBottom: '100px solid #d946ef', borderLeft: '70px solid transparent', borderRight: '70px solid transparent' }, className: 'css-triangle', initialPos: { x: 20, y: 30 }, correctSlotId: 'house-roof-slot' },
      { id: 'house-base', label: 'Base', style: { width: 120, height: 120, backgroundColor: '#a16207' }, initialPos: { x: 180, y: 20 }, correctSlotId: 'house-base-slot' },
    ],
    slots: [
      { id: 'house-roof-slot', label: 'Roof Slot', style: { top: 50, left: '50%', transform: 'translateX(-50%)', borderBottom: '100px dashed #fff', borderLeft: '70px solid transparent', borderRight: '70px solid transparent' }, className: 'css-triangle' },
      { id: 'house-base-slot', label: 'Base Slot', style: { top: 150, left: '50%', transform: 'translateX(-50%)', width: 120, height: 120, border: '4px dashed #fff' } },
    ]
  },
  // 2. Boat
  {
    id: 'boat',
    name: 'Boat',
    pieces: [
      { id: 'boat-sail', label: 'Sail', style: { borderBottom: '80px solid #22d3ee', borderLeft: '50px solid transparent', borderRight: '50px solid transparent' }, className: 'css-triangle', initialPos: { x: 40, y: 30 }, correctSlotId: 'boat-sail-slot' },
      { id: 'boat-hull', label: 'Hull', style: { borderBottom: '60px solid #f97316', borderLeft: '30px solid transparent', borderRight: '30px solid transparent', width: 120, height: 0 }, className: 'css-trapezoid', initialPos: { x: 150, y: 40 }, correctSlotId: 'boat-hull-slot' },
    ],
    slots: [
      { id: 'boat-sail-slot', label: 'Sail Slot', style: { top: 50, left: '50%', transform: 'translateX(-50%)', borderBottom: '80px dashed #fff', borderLeft: '50px solid transparent', borderRight: '50px solid transparent' }, className: 'css-triangle' },
      { id: 'boat-hull-slot', label: 'Hull Slot', style: { top: 130, left: '50%', transform: 'translateX(-50%)', borderBottom: '60px dashed #fff', borderLeft: '30px solid transparent', borderRight: '30px solid transparent', width: 120, height: 0 }, className: 'css-trapezoid' },
    ]
  },
  // 3. Tree
  {
    id: 'tree',
    name: 'Tree',
    pieces: [
      { id: 'tree-leaves', label: 'Leaves', style: { borderBottom: '120px solid #22c55e', borderLeft: '80px solid transparent', borderRight: '80px solid transparent' }, className: 'css-triangle', initialPos: { x: 30, y: 10 }, correctSlotId: 'tree-leaves-slot' },
      { id: 'tree-trunk', label: 'Trunk', style: { width: 50, height: 100, backgroundColor: '#78350f' }, initialPos: { x: 220, y: 20 }, correctSlotId: 'tree-trunk-slot' },
    ],
    slots: [
      { id: 'tree-leaves-slot', label: 'Leaves Slot', style: { top: 50, left: '50%', transform: 'translateX(-50%)', borderBottom: '120px dashed #fff', borderLeft: '80px solid transparent', borderRight: '80px solid transparent' }, className: 'css-triangle' },
      { id: 'tree-trunk-slot', label: 'Trunk Slot', style: { top: 170, left: '50%', transform: 'translateX(-50%)', width: 50, height: 100, border: '4px dashed #fff' } },
    ]
  },
  // 4. Rocket
  {
    id: 'rocket',
    name: 'Rocket',
    pieces: [
      { id: 'rocket-nose', label: 'Nose', style: { borderBottom: '80px solid #ef4444', borderLeft: '40px solid transparent', borderRight: '40px solid transparent' }, className: 'css-triangle', initialPos: { x: 20, y: 30 }, correctSlotId: 'rocket-nose-slot' },
      { id: 'rocket-body', label: 'Body', style: { width: 70, height: 130, backgroundColor: '#6b7280' }, initialPos: { x: 120, y: 10 }, correctSlotId: 'rocket-body-slot' },
      { id: 'rocket-fin-l', label: 'Left Fin', style: { borderTop: '40px solid #ef4444', borderRight: '30px solid transparent' }, className: 'css-triangle', initialPos: { x: 210, y: 20 }, correctSlotId: 'rocket-fin-l-slot' },
      { id: 'rocket-fin-r', label: 'Right Fin', style: { borderTop: '40px solid #ef4444', borderLeft: '30px solid transparent' }, className: 'css-triangle', initialPos: { x: 210, y: 80 }, correctSlotId: 'rocket-fin-r-slot' },
    ],
    slots: [
      { id: 'rocket-nose-slot', label: 'Nose Slot', style: { top: 20, left: '50%', transform: 'translateX(-50%)', borderBottom: '80px dashed #fff', borderLeft: '40px solid transparent', borderRight: '40px solid transparent' }, className: 'css-triangle' },
      { id: 'rocket-body-slot', label: 'Body Slot', style: { top: 100, left: '50%', transform: 'translateX(-50%)', width: 70, height: 130, border: '4px dashed #fff' } },
      { id: 'rocket-fin-l-slot', label: 'Left Fin Slot', style: { top: 190, left: '50%', transform: 'translateX(-125%)', borderTop: '40px dashed #fff', borderRight: '30px solid transparent' }, className: 'css-triangle' },
      { id: 'rocket-fin-r-slot', label: 'Right Fin Slot', style: { top: 190, left: '50%', transform: 'translateX(25%)', borderTop: '40px dashed #fff', borderLeft: '30px solid transparent' }, className: 'css-triangle' },
    ]
  },
  // 5. Fish
  {
    id: 'fish',
    name: 'Fish',
    pieces: [
      { id: 'fish-body', label: 'Body', style: { width: 150, height: 100, backgroundColor: '#f97316', borderRadius: '50%' }, className: 'css-oval', initialPos: { x: 20, y: 20 }, correctSlotId: 'fish-body-slot' },
      { id: 'fish-tail', label: 'Tail', style: { borderLeft: '60px solid #f97316', borderTop: '40px solid transparent', borderBottom: '40px solid transparent' }, className: 'css-triangle', initialPos: { x: 200, y: 30 }, correctSlotId: 'fish-tail-slot' },
      { id: 'fish-fin', label: 'Fin', style: { borderBottom: '40px solid #f97316', borderLeft: '20px solid transparent', borderRight: '20px solid transparent' }, className: 'css-triangle', initialPos: { x: 200, y: 100 }, correctSlotId: 'fish-fin-slot' },
    ],
    slots: [
      { id: 'fish-body-slot', label: 'Body Slot', style: { top: 100, left: '50%', transform: 'translateX(-70%)', width: 150, height: 100, border: '4px dashed #fff', borderRadius: '50%' }, className: 'css-oval' },
      { id: 'fish-tail-slot', label: 'Tail Slot', style: { top: 130, left: '50%', transform: 'translateX(30%)', borderLeft: '60px dashed #fff', borderTop: '40px solid transparent', borderBottom: '40px solid transparent' }, className: 'css-triangle' },
      { id: 'fish-fin-slot', label: 'Fin Slot', style: { top: 70, left: '50%', transform: 'translateX(-60%)', borderBottom: '40px dashed #fff', borderLeft: '20px solid transparent', borderRight: '20px solid transparent' }, className: 'css-triangle' },
    ]
  }
];

const SNAP_THRESHOLD = 30; // How close (in px) to snap to target

// --- COMPONENT ---

const ShapeDragDropGame: React.FC<LessonProps> = ({ onComplete }) => {
  // --- STATE ---
  const [puzzleIndex, setPuzzleIndex] = useState(0);
  const [currentPuzzle, setCurrentPuzzle] = useState<Puzzle>(ALL_PUZZLES[0]);
  const [pieces, setPieces] = useState<PieceState[]>([]);
  const [draggingPieceId, setDraggingPieceId] = useState<ShapeID | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isGameComplete, setIsGameComplete] = useState(false);
  const [prompt, setPrompt] = useState("Let's build a puzzle! Drag a shape.");

  // --- REFS ---
  const puzzleContainerRef = useRef<HTMLDivElement>(null);
  const correctSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/correct.mp3") : { play: () => {} });
  const wrongSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/incorrect.mp3") : { play: () => {} });
  const clapSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/clap.mp3") : { play: () => {} });
  const stageSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/stage_clear.mp3") : { play: () => {} });

  // --- GAME LOGIC ---

  // Load new puzzle pieces into state
  const loadPuzzle = useCallback((index: number) => {
    const newPuzzle = ALL_PUZZLES[index];
    setCurrentPuzzle(newPuzzle);
    const newPieces = newPuzzle.pieces.map(p => ({
      id: p.id,
      pos: p.initialPos,
      isPlaced: false,
    }));
    setPieces(newPieces);
    setPrompt(`Let's build a ${newPuzzle.name}! Drag a shape.`);
  }, []);

  useEffect(() => {
    loadPuzzle(puzzleIndex);
  }, [puzzleIndex, loadPuzzle]);

  // Check for puzzle completion
  useEffect(() => {
    if (pieces.length === 0) return;
    const allPlaced = pieces.every(p => p.isPlaced);
    if (allPlaced) {
      stageSound.current.play();
      setTimeout(() => {
        if (puzzleIndex < ALL_PUZZLES.length - 1) {
          setPuzzleIndex(prev => prev + 1);
        } else {
          setIsGameComplete(true);
          clapSound.current.play();
          confetti({ particleCount: 200, spread: 80, origin: { y: 0.6 } });
        }
      }, 1200);
    }
  }, [pieces, puzzleIndex, clapSound, stageSound]);

  // --- DRAG AND DROP HANDLERS ---

  const getEventCoords = (e: MouseEvent | TouchEvent) => {
    if ('touches' in e) {
      return { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY };
    }
    return { clientX: e.clientX, clientY: e.clientY };
  };

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent, pieceId: ShapeID) => {
    const piece = pieces.find(p => p.id === pieceId);
    if (!piece || piece.isPlaced || !puzzleContainerRef.current) return;

    e.preventDefault();
    const { clientX, clientY } = getEventCoords(e.nativeEvent);
    const containerRect = puzzleContainerRef.current.getBoundingClientRect();

    // Calculate offset from top-left of *piece* to mouse/touch position
    // This assumes piece.pos is the top-left corner of the piece.
    const offsetX = clientX - (containerRect.left + piece.pos.x);
    const offsetY = clientY - (containerRect.top + piece.pos.y);

    setDragOffset({ x: offsetX, y: offsetY });
    setDraggingPieceId(pieceId);
    setPrompt("Drag it to the matching outline!");
  };

  // These move/end handlers are attached to the *window*
  // This ensures dragging continues even if the cursor leaves the puzzle area

  const handleDragMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!draggingPieceId || !puzzleContainerRef.current) return;
    e.preventDefault();

    const { clientX, clientY } = getEventCoords(e);
    const containerRect = puzzleContainerRef.current.getBoundingClientRect();

    const newX = clientX - containerRect.left - dragOffset.x;
    const newY = clientY - containerRect.top - dragOffset.y;

    setPieces(prevPieces =>
      prevPieces.map(p =>
        p.id === draggingPieceId ? { ...p, pos: { x: newX, y: newY } } : p
      )
    );
  }, [draggingPieceId, dragOffset]);

  const handleDragEnd = useCallback(() => {
    if (!draggingPieceId || !puzzleContainerRef.current) return;

    const piece = pieces.find(p => p.id === draggingPieceId)!;
    const pieceData = currentPuzzle.pieces.find(p => p.id === draggingPieceId)!;
    const targetSlot = currentPuzzle.slots.find(s => s.id === pieceData.correctSlotId)!;
    
    // Get target position from slot style (this is brittle, better to store pos:{x,y} on slot)
    // For this demo, let's just use the slot's *data* (assuming its style.top/left are pixel values)
    
    // A bit of a hack for 'translateX(-50%)'
    // A more robust way would be to get slot's BoundingRect
    const slotEl = document.getElementById(targetSlot.id);
    if (slotEl) {
        const slotRect = slotEl.getBoundingClientRect();
        const containerRect = puzzleContainerRef.current.getBoundingClientRect();
        const targetX_rel = slotRect.left - containerRect.left;
        const targetY_rel = slotRect.top - containerRect.top;

        const distance = Math.hypot(piece.pos.x - targetX_rel, piece.pos.y - targetY_rel);

        if (distance < SNAP_THRESHOLD) {
          // --- CORRECT DROP ---
          correctSound.current.play();
          setPieces(prev => prev.map(p => 
            p.id === draggingPieceId ? { ...p, pos: { x: targetX_rel, y: targetY_rel }, isPlaced: true } : p
          ));
          setPrompt("Perfect fit! Find the next piece.");
        } else {
          // --- WRONG DROP (Snap Back) ---
          wrongSound.current.play();
          setPieces(prev => prev.map(p =>
            p.id === draggingPieceId ? { ...p, pos: pieceData.initialPos } : p
          ));
          setPrompt("That doesn't fit. Try again.");
        }
    } else {
        // Fallback if element not found (shouldn't happen)
        wrongSound.current.play();
        setPieces(prev => prev.map(p =>
            p.id === draggingPieceId ? { ...p, pos: pieceData.initialPos } : p
        ));
    }

    setDraggingPieceId(null);
  }, [draggingPieceId, pieces, currentPuzzle]);

  // Effect to add/remove global event listeners
  useEffect(() => {
    if (draggingPieceId) {
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('touchmove', handleDragMove, { passive: false });
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchend', handleDragEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('touchmove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchend', handleDragEnd);
    };
  }, [draggingPieceId, handleDragMove, handleDragEnd]);


  // --- RENDER ---
  if (isGameComplete) {
    return (
      <div className="p-6 text-center flex flex-col items-center justify-center h-full text-white">
        <CheckCircle size={80} className="text-green-400 mb-4" />
        <h2 className="text-3xl font-bold">Puzzles Complete!</h2>
        <p className="text-lg mb-6">You're a master shape builder!</p>
        <button
          onClick={onComplete}
          className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Finish Lesson
        </button>
      </div>
    );
  }

  // Find static data for dynamic pieces
  const piecesWithData = pieces.map(p => {
    const data = currentPuzzle.pieces.find(pd => pd.id === p.id)!;
    return { ...p, ...data };
  });

  return (
    <div className="p-4 flex flex-col h-full text-white overflow-hidden">
      <h3 className="text-2xl font-bold text-center mb-2">Shape Builder: {currentPuzzle.name}</h3>
      <p className="text-lg text-center text-cyan-300 mb-4 h-12">{prompt}</p>

      {/* Puzzle Outline & Palette Area */}
      <div 
        ref={puzzleContainerRef} 
        className="relative flex-grow bg-gray-800 rounded-lg border-2 border-gray-600 min-h-[400px] overflow-hidden touch-none"
        style={{ touchAction: 'none' }} // Prevents page scroll on touch devices
      >
        {/* Render Slots (Outlines) */}
        {currentPuzzle.slots.map((slot) => {
          const isFilled = pieces.some(p => p.isPlaced && p.id === currentPuzzle.pieces.find(pd => pd.correctSlotId === slot.id)?.id);
          return (
            <div
              key={slot.id}
              id={slot.id} // Used by handleDragEnd to get BoundingRect
              style={slot.style}
              className={`absolute transition-all duration-300
                ${slot.className || ''}
                ${isFilled ? 'opacity-0' : 'opacity-50'}
              `}
            />
          );
        })}

        {/* Render Draggable Pieces */}
        {piecesWithData.map((piece) => {
          const isDragging = draggingPieceId === piece.id;
          return (
            <div
              key={piece.id}
              onMouseDown={(e) => handleDragStart(e, piece.id)}
              onTouchStart={(e) => handleDragStart(e, piece.id)}
              style={{
                ...piece.style,
                position: 'absolute',
                left: 0, // Position is controlled by transform
                top: 0,
                transform: `translate(${piece.pos.x}px, ${piece.pos.y}px)`,
                zIndex: isDragging ? 100 : (piece.isPlaced ? 10 : 20),
                cursor: piece.isPlaced ? 'default' : (isDragging ? 'grabbing' : 'grab'),
                transition: isDragging ? 'none' : 'transform 0.2s ease-out',
                boxShadow: isDragging ? '0 10px 25px rgba(0,0,0,0.5)' : 'none',
              }}
              className={`
                ${piece.className || ''}
                ${piece.isPlaced ? 'opacity-100' : 'opacity-90'}
              `}
            >
              {piece.isPlaced && (
                <CheckCircle size={24} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white bg-green-500 rounded-full" />
              )}
            </div>
          );
        })}
      </div>

      {/* Animations & Styles */}
      <style>
        {`
          /* Special class for CSS triangles */
          .css-triangle {
            width: 0;
            height: 0;
            background-color: transparent !important;
          }
          /* Override for dashed triangle slots */
          .css-triangle[style*="dashed"] {
            background-color: transparent !important;
            border-bottom-style: dashed !important;
            border-top-style: dashed !important;
            border-left-style: dashed !important;
          }
          /* CSS Trapezoid */
          .css-trapezoid {
            width: 120px; /* This needs to match the data */
            height: 0;
            background-color: transparent !important;
          }
          .css-trapezoid[style*="dashed"] {
            background-color: transparent !important;
            border-bottom-style: dashed !important;
          }
        `}
      </style>
    </div>
  );
};

export default ShapeDragDropGame;