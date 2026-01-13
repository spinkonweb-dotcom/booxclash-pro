import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useSpeech } from "../../../SpeechContext"; // adjust path
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
`;

// Define the shape of the props this component expects
interface LessonProps {
  onComplete: () => void;
}

// Define the structure for a single draggable group
type Group = {
  id: string; // A unique ID combining round and count
  count: number;
};

// --- Data for all 5 rounds of the quiz ---
const quizRounds = [
  { round: 1, emoji: '🌸', counts: [2, 4, 1] },
  { round: 2, emoji: '🚗', counts: [5, 2, 3] },
  { round: 3, emoji: '⭐', counts: [6, 4, 7] },
  { round: 4, emoji: '🎈', counts: [3, 5, 2] },
  { round: 5, emoji: '🐞', counts: [8, 6, 9] },
];

// Mock audio for environments without audio
const createMockAudio = () => ({
  play: () => { /* console.log("Audio play mock") */ },
  pause: () => { /* console.log("Audio pause mock") */ },
  currentTime: 0,
});

const G1_OrderingGroups: React.FC<LessonProps> = ({ onComplete }) => {
  const [currentRound, setCurrentRound] = useState(0);
  // Groups available to be dragged
  const [draggableGroups, setDraggableGroups] = useState<Group[]>([]);
  // Groups placed in the drop zones
  const [orderedGroups, setOrderedGroups] = useState<(Group | null)[]>([]);

  const [isRoundComplete, setIsRoundComplete] = useState(false);
  const [isQuizComplete, setIsQuizComplete] = useState(false);

  // --- Interactivity State ---
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [draggingOrigin, setDraggingOrigin] = useState<'source' | 'zone' | null>(null);
  const [draggingOriginIndex, setDraggingOriginIndex] = useState<number | null>(null);
  const [dragOverZone, setDragOverZone] = useState<number | null>(null); // index of the zone
  const [shakeZones, setShakeZones] = useState(false); // To shake all zones on wrong order
  
  // --- Sound Refs ---
  const correctSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/correct.mp3") : createMockAudio());
  const wrongSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/incorrect.mp3") : createMockAudio());
  const clapSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/clap.mp3") : createMockAudio());
    const { speak, stop } = useSpeech();
    const instructions = "Hi, in this lesson you will learn to arrange quantities. Drag the groups into order from the smallest number to the largest."
      useEffect(() => {
        speak({ text: instructions });
        return stop; // stop when unmounting
      }, []);// ✅ Core drop logic
  // This effect sets up the board for each new round
  useEffect(() => {
    const roundData = quizRounds[currentRound];
    // Create shuffled groups for the top area
    const shuffled = [...roundData.counts]
      .sort(() => Math.random() - 0.5)
      .map(count => ({ id: `${roundData.round}-${count}`, count }));
    
    setDraggableGroups(shuffled);
    // Create empty slots for the drop zones
    setOrderedGroups(new Array(roundData.counts.length).fill(null));
    setIsRoundComplete(false);
  }, [currentRound]);

  // This effect plays the clap sound on final completion
  useEffect(() => {
    if (isQuizComplete) {
      clapSound.current.play();
    }
  }, [isQuizComplete, clapSound]);

  // This effect checks if the current order is correct
  useEffect(() => {
    // Check only if all slots are filled
    if (orderedGroups.length > 0 && orderedGroups.every(g => g !== null)) {
      let isCorrect = true;
      for (let i = 0; i < orderedGroups.length - 1; i++) {
        if ((orderedGroups[i]!.count > orderedGroups[i+1]!.count)) {
          isCorrect = false;
          break;
        }
      }
      if (isCorrect) {
        correctSound.current.play();
        confetti({ particleCount: 200, spread: 70, origin: { y: 0.6 } });
        setIsRoundComplete(true);
      } else {
        // Wrong order, shake all zones
        wrongSound.current.play();
        setShakeZones(true);
        setTimeout(() => setShakeZones(false), 500);
      }
    }
  }, [orderedGroups, correctSound, wrongSound]);

  // --- Drag & Drop Logic ---

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, group: Group, origin: 'source' | 'zone', index: number | null) => {
    e.dataTransfer.setData("groupId", group.id);
    e.dataTransfer.setData("origin", origin);
    if (index !== null) {
      e.dataTransfer.setData("originIndex", index.toString());
    }
    setDraggingId(group.id);
    setDraggingOrigin(origin);
    setDraggingOriginIndex(index);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDraggingOrigin(null);
    setDraggingOriginIndex(null);
    setDragOverZone(null);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number | null) => {
    e.preventDefault();
    setDragOverZone(index); // null for source area, index for zone
  };

  const handleDropOnZone = (e: React.DragEvent<HTMLDivElement>, dropIndex: number) => {
    e.preventDefault();
    setDragOverZone(null);
    const groupId = e.dataTransfer.getData("groupId");
    const origin = e.dataTransfer.getData("origin") as 'source' | 'zone';
    const originIndexStr = e.dataTransfer.getData("originIndex");
    const originIndex = originIndexStr ? parseInt(originIndexStr) : null;
    
    performDrop(groupId, origin, originIndex, 'zone', dropIndex);
  };

  const handleDropOnSource = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOverZone(null);
    const groupId = e.dataTransfer.getData("groupId");
    const origin = e.dataTransfer.getData("origin") as 'source' | 'zone';
    const originIndexStr = e.dataTransfer.getData("originIndex");
    const originIndex = originIndexStr ? parseInt(originIndexStr) : null;

    performDrop(groupId, origin, originIndex, 'source', null);
  };

  const performDrop = (
    groupId: string, 
    origin: 'source' | 'zone', 
    originIndex: number | null, 
    target: 'source' | 'zone', 
    targetIndex: number | null
  ) => {
    if (!groupId || !origin) return;
    
    // Find the dragged item
    const allItems = [...draggableGroups, ...orderedGroups.filter(g => g) as Group[]];
    const draggedItem = allItems.find(g => g.id === groupId);
    if (!draggedItem) return;

    let newDraggable = [...draggableGroups];
    let newOrdered = [...orderedGroups];

    // 1. Remove item from its origin
    if (origin === 'source') {
      newDraggable = newDraggable.filter(g => g.id !== groupId);
    } else if (origin === 'zone' && originIndex !== null) {
      newOrdered[originIndex] = null;
    }

    // 2. Add item to its target
    if (target === 'source') {
      newDraggable.push(draggedItem);
    } else if (target === 'zone' && targetIndex !== null) {
      const itemInTargetSlot = newOrdered[targetIndex];
      newOrdered[targetIndex] = draggedItem; // Place item
      
      // If target slot was occupied, move its item to the origin
      if (itemInTargetSlot) {
        if (origin === 'source') {
          newDraggable.push(itemInTargetSlot);
        } else if (origin === 'zone' && originIndex !== null) {
          newOrdered[originIndex] = itemInTargetSlot; // Swap
        }
      }
    }
    
    setDraggableGroups(newDraggable);
    setOrderedGroups(newOrdered);
  };


  // --- Touch Logic ---
  const handleTouchStart = (group: Group, origin: 'source' | 'zone', index: number | null) => {
    setDraggingId(group.id);
    setDraggingOrigin(origin);
    setDraggingOriginIndex(index);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!draggingId) return;
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    
    const dropZone = element?.closest('[data-index]') as HTMLElement | null;
    const dropSource = element?.closest('[data-sourcezone]') as HTMLElement | null;

    if (dropZone) {
      setDragOverZone(parseInt(dropZone.dataset.index!));
    } else if (dropSource) {
      setDragOverZone(null); // Indicates source zone
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!draggingId) return;
    
    const touch = e.changedTouches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    
    const dropZone = element?.closest('[data-index]') as HTMLElement | null;
    const dropSource = element?.closest('[data-sourcezone]') as HTMLElement | null;

    if (dropZone) {
      const dropIndex = parseInt(dropZone.dataset.index!);
      performDrop(draggingId, draggingOrigin!, draggingOriginIndex, 'zone', dropIndex);
    } else if (dropSource) {
      performDrop(draggingId, draggingOrigin!, draggingOriginIndex, 'source', null);
    }
    
    handleDragEnd(); // Reset all dragging state
  };


  // --- Other Handlers ---
  const handleNextRound = () => {
    if (currentRound >= quizRounds.length - 1) {
      setIsQuizComplete(true);
    } else {
      setCurrentRound(prev => prev + 1);
    }
  };

  // The final success screen
  if (isQuizComplete) {
    return (
      <div className="p-6 text-center flex flex-col items-center justify-center h-full bg-purple-50">
        <CheckCircle size={80} className="text-green-500 mb-4" />
        <h2 className="text-3xl font-bold">You're an ordering expert!</h2>
        <button onClick={onComplete} className="w-full mt-6 max-w-xs bg-blue-600 text-white font-bold py-3 px-4 rounded-lg">
          Continue Adventure
        </button>
      </div>
    );
  }
  
  const currentEmoji = quizRounds[currentRound].emoji;
  
  // Helper to render a group item (avoids code duplication)
  const renderGroup = (group: Group) => (
    <>
      <div className="flex flex-wrap justify-center gap-1">
        {Array.from({ length: group.count }).map((_, i) => (
          <span key={i} className="text-3xl sm:text-4xl">{currentEmoji}</span>
        ))}
      </div>
      <p className="font-bold text-xl mt-2">{group.count}</p>
    </>
  );

  return (
    <div className="p-4 flex flex-col h-auto bg-purple-50">
      <style>{shakeAnimationCss}</style>
      <h3 className="text-3xl font-bold text-center mb-4 text-purple-800">Line Them Up! Smallest to Largest</h3>

      {/* Draggable Groups Area */}
      <div
        data-sourcezone="true"
        onDragOver={(e) => handleDragOver(e, null)}
        onDrop={handleDropOnSource}
        className={`flex-grow bg-gray-100 rounded-lg p-4 mb-4 flex justify-center items-center gap-6 min-h-[150px] transition-colors
                    ${dragOverZone === null ? 'bg-gray-200' : ''}`}
      >
        {draggableGroups.map(group => (
          <div
            key={group.id}
            draggable
            onDragStart={(e) => handleDragStart(e, group, 'source', null)}
            onDragEnd={handleDragEnd}
            onTouchStart={() => handleTouchStart(group, 'source', null)}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{ touchAction: 'none' }}
            className={`p-3 bg-white rounded-lg shadow-md cursor-grab text-center hover:scale-105 transition-transform
                        ${draggingId === group.id ? 'opacity-30' : ''}`}
          >
            {renderGroup(group)}
          </div>
        ))}
        {draggableGroups.length === 0 && (
          <span className="text-gray-400">Drag items back here</span>
        )}
      </div>

      {/* Drop Zones */}
      <div className="grid grid-cols-3 gap-4 min-h-[150px]">
        {orderedGroups.map((group, index) => (
          <div
            key={index}
            data-index={index}
            onDrop={(e) => handleDropOnZone(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={() => setDragOverZone(null)}
            className={`rounded-xl border-4 border-dashed flex flex-col justify-center items-center p-3 transition-all
                        ${shakeZones ? 'shake' : ''}
                        ${group ? 'bg-purple-100 border-purple-300' : 'bg-purple-200 border-purple-400'}
                        ${dragOverZone === index ? 'border-solid bg-purple-300 scale-105' : ''}`}
          >
            {group ? (
              <div
                draggable
                onDragStart={(e) => handleDragStart(e, group, 'zone', index)}
                onDragEnd={handleDragEnd}
                onTouchStart={() => handleTouchStart(group, 'zone', index)}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                style={{ touchAction: 'none' }}
                className={`p-2 cursor-grab w-full h-full flex flex-col items-center justify-center ${draggingId === group.id ? 'opacity-30' : ''}`}
              >
                {renderGroup(group)}
              </div>
            ) : (
              <span className="text-3xl text-purple-400">?</span>
            )}
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="text-center mt-4 h-14">
        {isRoundComplete && (
          <button onClick={handleNextRound} className="bg-green-600 text-white font-bold py-3 px-8 rounded-lg text-xl animate-bounce">
            Next!
          </button>
        )}
      </div>
    </div>
  );
};

export default G1_OrderingGroups;