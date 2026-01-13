import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

// We will inject the CSS for the shake animation
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
  .touch-drag-item {
    touch-action: none;
  }
`;

// Define the shape of the props this component expects
interface LessonProps {
  onComplete: () => void;
}

// Data for all 4 distinct rounds of the review
const quizRounds = [
  { type: 'matching', instruction: 'Drag the right number to the group!', emoji: '⭐', count: 4, choices: [2, 4, 5] },
  { type: 'comparing', instruction: 'Which box has LESS?', emoji: '🐠', groupA: 3, groupB: 5, answer: 'A' as const },
  { type: 'ordering', instruction: 'Order the groups from SMALLEST to LARGEST!', emoji: '🌸', counts: [5, 2, 3] },
  { type: 'ordinal', instruction: 'Click the 4th car!', emoji: ['🚗', '🚙', '🚕', '🏎️', '🚓'], targetIndex: 3 },
];

// Mock audio for environments without audio
const createMockAudio = () => ({
  play: () => { /* console.log("Audio play mock") */ },
  pause: () => { /* console.log("Audio pause mock") */ },
  currentTime: 0,
});

const NumbersReview: React.FC<LessonProps> = ({ onComplete }) => {
  const [currentRound, setCurrentRound] = useState(0);
  const [isRoundComplete, setIsRoundComplete] = useState(false);
  const [isQuizComplete, setIsQuizComplete] = useState(false);
  
  // --- State for all sub-games ---
  const [feedback, setFeedback] = useState<string | number | null>(null);
  
  // --- State for Matching ---
  const [isMatched, setIsMatched] = useState(false);

  // --- State for Ordering ---
  const [draggableGroups, setDraggableGroups] = useState<{ id: number; count: number }[]>([]);
  const [orderedGroups, setOrderedGroups] = useState<( { id: number; count: number } | null)[]>([]);
  const [showTryAgain, setShowTryAgain] = useState(false); // For ordering round

  // --- State for Drag/Touch ---
  const [draggingId, setDraggingId] = useState<string | null>(null); // e.g., "numeral-4" or "group-1"
  const [dragOverZone, setDragOverZone] = useState<string | null>(null); // e.g., "matching-zone" or "ordering-slot-1"

  // --- Sound Refs ---
  const correctSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/correct.mp3") : createMockAudio());
  const wrongSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/incorrect.mp3") : createMockAudio());
  const clapSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/clap.mp3") : createMockAudio());

  // Effect to play confetti and clap on final completion
  useEffect(() => {
    if (isQuizComplete) {
      clapSound.current.play();
      confetti({ particleCount: 200, spread: 70, origin: { y: 0.6 } });
    }
  }, [isQuizComplete, clapSound]);

  const resetOrderingRound = () => {
    const roundData = quizRounds[currentRound];
    if (roundData.type === 'ordering') {
      const counts = roundData.counts ?? [];
      const shuffled = [...counts]
        .sort(() => Math.random() - 0.5)
        .map((count, i) => ({ id: i, count }));
      setDraggableGroups(shuffled);
      setOrderedGroups(new Array(counts.length).fill(null));
      setShowTryAgain(false);
      setFeedback(null);
      setIsRoundComplete(false);
    }
  };

  // Effect to reset state for each new round
  useEffect(() => {
    setIsRoundComplete(false);
    setFeedback(null);
    setIsMatched(false);
    setShowTryAgain(false);

    const roundData = quizRounds[currentRound];
    if (roundData.type === 'ordering') {
      resetOrderingRound();
    }
  }, [currentRound]);
  
  // Effect to check if the 'ordering' round is complete
  useEffect(() => {
    const roundData = quizRounds[currentRound];
    if (roundData.type === 'ordering' && orderedGroups.every(g => g !== null)) {
      let isCorrect = true;
      for (let i = 0; i < orderedGroups.length - 1; i++) {
        if ((orderedGroups[i]!.count > orderedGroups[i+1]!.count)) {
          isCorrect = false;
          break;
        }
      }
      if (isCorrect) {
        correctSound.current.play();
        setShowTryAgain(false);
        setTimeout(() => setIsRoundComplete(true), 500);
      } else {
        wrongSound.current.play();
        setFeedback('incorrect');
        setShowTryAgain(true); // Show "Try Again" button
        setTimeout(() => setFeedback(null), 500); // Clear shake
      }
    }
  }, [orderedGroups, currentRound, correctSound, wrongSound]);

  const handleNextRound = () => {
    if (currentRound >= quizRounds.length - 1) {
      setIsQuizComplete(true);
    } else {
      setCurrentRound(prev => prev + 1);
    }
  };

  // --- Unified Logic for Drops (called by both mouse and touch) ---
  
  const doMatchingDrop = (numeral: number) => {
    const round = quizRounds[currentRound];
    if (round.type !== 'matching') return;
    
    if (numeral === round.count) {
      correctSound.current.play();
      setIsMatched(true);
      setTimeout(() => setIsRoundComplete(true), 500);
    } else {
      wrongSound.current.play();
      setFeedback('incorrect');
      setTimeout(() => setFeedback(null), 500);
    }
  };

  const doOrderingDrop = (groupId: number, dropIndex: number) => {
    // Find where the group came from
    const groupFromPalette = draggableGroups.find(g => g.id === groupId);
    const groupFromSlotIndex = orderedGroups.findIndex(g => g?.id === groupId);

    // Case 1: Dragging from Palette to an empty slot
    if (groupFromPalette && !orderedGroups[dropIndex]) {
      const newOrderedGroups = [...orderedGroups];
      newOrderedGroups[dropIndex] = groupFromPalette;
      setOrderedGroups(newOrderedGroups);
      setDraggableGroups(prev => prev.filter(g => g.id !== groupId));
    }
    // Case 2: Dragging from one empty slot to another empty slot
    else if (groupFromSlotIndex > -1 && !orderedGroups[dropIndex]) {
       const newOrderedGroups = [...orderedGroups];
       const [movedGroup] = newOrderedGroups.splice(groupFromSlotIndex, 1, null);
       newOrderedGroups[dropIndex] = movedGroup;
       setOrderedGroups(newOrderedGroups);
    }
  };
  
  const doDropOnPalette = (groupId: number) => {
    const groupInSlot = orderedGroups.find(g => g?.id === groupId);
    if (groupInSlot) {
      // Remove from orderedGroups
      setOrderedGroups(prev => prev.map(g => g?.id === groupId ? null : g));
      // Add back to draggableGroups
      setDraggableGroups(prev => [...prev, groupInSlot]);
    }
  };


  // --- Mouse Drag Handlers ---
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, id: string) => {
    e.dataTransfer.setData("id", id);
    setDraggingId(id);
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, zoneId: string) => {
    e.preventDefault();
    setDragOverZone(zoneId);
  };
  
  const handleDragLeave = () => {
    setDragOverZone(null);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDragOverZone(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, zoneId: string) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("id");
    
    if (id.startsWith('numeral-')) {
      const numeral = parseInt(id.split('-')[1]);
      if (zoneId === 'matching-zone') {
        doMatchingDrop(numeral);
      }
    } else if (id.startsWith('group-')) {
      const groupId = parseInt(id.split('-')[1]);
      if (zoneId.startsWith('ordering-slot-')) {
        const dropIndex = parseInt(zoneId.split('-')[2]);
        doOrderingDrop(groupId, dropIndex);
      } else if (zoneId === 'ordering-palette') {
        doDropOnPalette(groupId);
      }
    }
    
    handleDragEnd();
  };

  // --- Touch Handlers ---
  const handleTouchStart = (id: string) => {
    setDraggingId(id);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!draggingId) return;
    
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    const dropZone = element?.closest('[data-zone-id]') as HTMLElement | null;
    
    if (dropZone?.dataset?.zoneId) {
      setDragOverZone(dropZone.dataset.zoneId);
    } else {
      setDragOverZone(null);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!draggingId) return;

    const touch = e.changedTouches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    const dropZone = element?.closest('[data-zone-id]') as HTMLElement | null;
    const zoneId = dropZone?.dataset?.zoneId;

    if (draggingId.startsWith('numeral-')) {
      const numeral = parseInt(draggingId.split('-')[1]);
      if (zoneId === 'matching-zone') {
        doMatchingDrop(numeral);
      }
    } else if (draggingId.startsWith('group-')) {
      const groupId = parseInt(draggingId.split('-')[1]);
      if (zoneId && zoneId.startsWith('ordering-slot-')) {
        const dropIndex = parseInt(zoneId.split('-')[2]);
        doOrderingDrop(groupId, dropIndex);
      } else if (zoneId === 'ordering-palette') {
        doDropOnPalette(groupId);
      }
    }
    
    setDraggingId(null);
    setDragOverZone(null);
  };

  // --- Handlers for Click-based games ---
  const handleComparingSelect = (selection: 'A' | 'B') => {
    const round = quizRounds[currentRound];
    if (round.type !== 'comparing') return;

    if (feedback) return;
    if (selection === round.answer) {
      correctSound.current.play();
      setFeedback('correct');
      setTimeout(() => setIsRoundComplete(true), 1000);
    } else {
      wrongSound.current.play();
      setFeedback('incorrect');
      setTimeout(() => setFeedback(null), 1000);
    }
  };
  
  const handleOrdinalClick = (index: number) => {
    const round = quizRounds[currentRound];
    if(round.type !== 'ordinal') return;

    if(feedback) return;
    if(index === round.targetIndex) {
      correctSound.current.play();
      setFeedback('correct');
      setTimeout(() => setIsRoundComplete(true), 1000);
    } else {
      wrongSound.current.play();
      setFeedback(index);
      setTimeout(() => setFeedback(null), 1000);
    }
  };

  // --- Render functions for each sub-game ---
  const renderMatchingRound = () => {
    const round = quizRounds[currentRound];
    if (round.type !== 'matching') return null;
    const zoneId = 'matching-zone';
    const isHovering = dragOverZone === zoneId;

    return (
      <>
        <div 
          data-zone-id={zoneId}
          onDrop={(e) => handleDrop(e, zoneId)} 
          onDragOver={(e) => handleDragOver(e, zoneId)} 
          onDragLeave={handleDragLeave}
          className={`p-4 rounded-xl border-4 border-dashed flex items-center justify-center min-h-[150px] transition-all
                      ${isMatched ? 'border-green-500 bg-green-100' : 'border-blue-300 bg-white'}
                      ${feedback === 'incorrect' ? 'shake' : ''}
                      ${isHovering ? 'border-solid border-blue-500 scale-105' : ''}`}
        >
          <div className="text-5xl flex gap-2">{Array.from({ length: round.count ?? 0 }).map((_, i) => <span key={i}>{round.emoji}</span>)}</div>
        </div>
        <div className="h-24 bg-blue-200 rounded-lg flex justify-center items-center gap-8 p-4 mt-6">
          {round.choices?.map(num => {
            const id = `numeral-${num}`;
            const isDragging = draggingId === id;
            return (
              <div 
                key={id}
                draggable={!isMatched} 
                onDragStart={e => handleDragStart(e, id)} 
                onDragEnd={handleDragEnd}
                onTouchStart={() => handleTouchStart(id)}
                className={`w-20 h-20 flex items-center justify-center bg-white rounded-full shadow-lg text-4xl font-bold text-blue-800 transition-all touch-drag-item
                            ${isMatched ? 'opacity-20 cursor-default' : 'cursor-grab hover:scale-110'}
                            ${isDragging ? 'opacity-30 scale-125' : ''}`}
              >
                {num}
              </div>
            );
          })}
        </div>
      </>
    );
  };

  const renderComparingRound = () => {
    const round = quizRounds[currentRound];
    if (round.type !== 'comparing') return null;

    return (
      <div className="grid grid-cols-2 gap-4">
        <div 
          onClick={() => handleComparingSelect('A')} 
          className={`p-4 rounded-xl border-8 flex justify-center items-center cursor-pointer 
                      ${feedback === 'incorrect' ? 'border-red-500 shake' : 'border-cyan-300 bg-white hover:border-cyan-500'}
                      ${feedback === 'correct' ? 'border-green-500 bg-green-100' : ''}`}
        >
          <div className="flex flex-wrap gap-2 text-4xl sm:text-5xl justify-center">{Array.from({ length: round.groupA! }).map((_, i) => <span key={i}>{round.emoji}</span>)}</div>
        </div>
        <div 
          onClick={() => handleComparingSelect('B')} 
          className={`p-4 rounded-xl border-8 flex justify-center items-center cursor-pointer 
                      ${feedback === 'incorrect' ? 'border-red-500 shake' : 'border-cyan-300 bg-white hover:border-cyan-500'}
                      ${feedback === 'correct' ? 'border-green-500 bg-green-100' : ''}`}
        >
          <div className="flex flex-wrap gap-2 text-4xl sm:text-5xl justify-center">{Array.from({ length: round.groupB! }).map((_, i) => <span key={i}>{round.emoji}</span>)}</div>
        </div>
      </div>
    );
  };

  const renderOrderingRound = () => {
    const round = quizRounds[currentRound];
    if (round.type !== 'ordering') return null;
    const paletteZoneId = 'ordering-palette';

    return (
        <>
            <div 
              data-zone-id={paletteZoneId}
              onDrop={(e) => handleDrop(e, paletteZoneId)}
              onDragOver={(e) => handleDragOver(e, paletteZoneId)}
              onDragLeave={handleDragLeave}
              className={`flex-grow bg-gray-100 rounded-lg p-4 mb-4 flex justify-center items-center gap-6 min-h-[150px] transition-all
                          ${dragOverZone === paletteZoneId ? 'bg-gray-200' : ''}`}
            >
                {draggableGroups.map(group => {
                    const id = `group-${group.id}`;
                    return (
                      <div 
                        key={id} 
                        draggable 
                        onDragStart={e => handleDragStart(e, id)} 
                        onDragEnd={handleDragEnd}
                        onTouchStart={() => handleTouchStart(id)}
                        className={`p-3 bg-white rounded-lg shadow-md cursor-grab text-center touch-drag-item
                                    ${draggingId === id ? 'opacity-30' : ''}`}
                      >
                          {Array.from({ length: group.count }).map((_, i) => <span key={i} className="text-4xl">{round.emoji}</span>)}
                          <p className="font-bold text-xl">{group.count}</p>
                      </div>
                    );
                })}
                {draggableGroups.length === 0 && <span className="text-gray-400">Drop items here to remove them</span>}
            </div>
            <div className={`grid grid-cols-3 gap-4 min-h-[150px] ${feedback === 'incorrect' ? 'shake' : ''}`}>
                {orderedGroups.map((group, index) => {
                    const zoneId = `ordering-slot-${index}`;
                    const isHovering = dragOverZone === zoneId;
                    return (
                      <div 
                        key={index}
                        data-zone-id={zoneId}
                        onDrop={e => handleDrop(e, zoneId)} 
                        onDragOver={e => handleDragOver(e, zoneId)} 
                        onDragLeave={handleDragLeave}
                        className={`bg-purple-200 rounded-xl border-4 border-dashed border-purple-400 flex flex-col justify-center items-center p-3 min-h-[120px] transition-all
                                    ${isHovering ? 'border-solid border-purple-600 scale-105' : ''}`}
                      >
                          {group ? (
                              <div 
                                draggable 
                                onDragStart={e => handleDragStart(e, `group-${group.id}`)}
                                onDragEnd={handleDragEnd}
                                onTouchStart={() => handleTouchStart(`group-${group.id}`)}
                                className={`cursor-grab touch-drag-item ${draggingId === `group-${group.id}` ? 'opacity-30' : ''}`}
                              >
                                  {Array.from({ length: group.count }).map((_, i) => <span key={i} className="text-4xl">{round.emoji}</span>)}
                                  <p className="font-bold text-xl text-center">{group.count}</p>
                              </div>
                          ) : <span className="text-3xl text-purple-400">?</span>}
                      </div>
                    );
                })}
            </div>
        </>
    );
  };

  const renderOrdinalRound = () => {
    const round = quizRounds[currentRound];
    if (round.type !== 'ordinal') return null;

    return (
        <div className="flex flex-col justify-center items-center">
          <div className="flex justify-center items-end gap-2 sm:gap-4">
              {(round.emoji as string[]).map((emoji, index) => (
                  <div 
                    key={index} 
                    onClick={() => handleOrdinalClick(index)} 
                    className={`text-5xl sm:text-6xl md:text-7xl cursor-pointer transition-all duration-300 
                                ${feedback === index ? 'shake' : ''} 
                                ${feedback === 'correct' && index === round.targetIndex ? 'scale-125 -translate-y-4' : ''}
                                ${feedback === null ? 'hover:scale-110' : ''}`}
                  >
                      {emoji}
                  </div>
              ))}
          </div>
          {/* The finish line */}
          <div className="w-full h-4 mt-2 bg-black-and-white-checkered" />
          <div className="w-full h-8 bg-gray-600" />
        </div>
    );
  };
  
  const renderCurrentRound = () => {
    const type = quizRounds[currentRound].type;
    switch(type) {
      case 'matching': return renderMatchingRound();
      case 'comparing': return renderComparingRound();
      case 'ordering': return renderOrderingRound();
      case 'ordinal': return renderOrdinalRound();
      default: return null;
    }
  };

  if (isQuizComplete) {
    return (
      <div className="p-6 text-center flex flex-col items-center justify-center h-full bg-gray-50">
        <CheckCircle size={80} className="text-green-500 mb-4" />
        <h2 className="text-3xl font-bold">Great Job on the Review!</h2>
        <p className="text-lg text-gray-600 mb-6">You've mastered your numbers.</p>
        <button
          onClick={onComplete}
          className="w-full max-w-xs bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Continue Adventure
        </button>
      </div>
    );
  }

  return (
    <div 
      className="p-4 flex flex-col h-auto bg-gray-50"
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <style>{shakeAnimationCss}</style>
      <h3 className="text-3xl font-bold text-center mb-4 text-gray-800">{quizRounds[currentRound].instruction}</h3>
      <div className="flex-grow flex flex-col justify-center">
        {renderCurrentRound()}
      </div>
      <div className="text-center mt-4 h-14">
        {isRoundComplete && (
          <button onClick={handleNextRound} className="bg-green-600 text-white font-bold py-3 px-8 rounded-lg text-xl animate-bounce">
            Next!
          </button>
        )}
        {showTryAgain && !isRoundComplete && (
           <button onClick={resetOrderingRound} className="bg-red-500 text-white font-bold py-2 px-6 rounded-lg">
            Try Again
          </button>
        )}
      </div>
      {/* Finish line styles for ordinal round */}
      <style>{`
        .bg-black-and-white-checkered {
          background-image:
            linear-gradient(45deg, #000 25%, transparent 25%),
            linear-gradient(-45deg, #000 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, #000 75%),
            linear-gradient(-45deg, transparent 75%, #000 75%);
          background-size: 20px 20px;
          background-color: #fff;
        }
      `}</style>
    </div>
  );
};

export default NumbersReview;

