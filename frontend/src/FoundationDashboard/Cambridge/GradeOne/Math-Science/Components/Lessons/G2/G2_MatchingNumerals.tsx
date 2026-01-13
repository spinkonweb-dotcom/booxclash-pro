import React, { useState, useEffect, useMemo, useRef, } from 'react';
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
`;

// Define the shape of the props this component expects
interface LessonProps {
  onComplete: () => void;
}

// Define the structure for a single group of objects
type Group = {
  id: number;
  count: number;
  emoji: string;
  isMatched: boolean; // Tracks if the correct number has been dropped on it
};

// Initial data for the groups of objects
const initialGroups: Group[] = [
  { id: 1, count: 2, emoji: '🐶', isMatched: false },
  { id: 2, count: 4, emoji: '🐱', isMatched: false },
  { id: 3, count: 1, emoji: '🐦', isMatched: false },
  { id: 4, count: 3, emoji: '🍎', isMatched: false },
];

// Mock audio for environments without audio
const createMockAudio = () => ({
  play: () => { /* console.log("Audio play mock") */ },
  pause: () => { /* console.log("Audio pause mock") */ },
  currentTime: 0,
});

const G1_MatchingNumerals: React.FC<LessonProps> = ({ onComplete }) => {
  const [groups, setGroups] = useState<Group[]>(initialGroups);
  const [dragOverGroup, setDragOverGroup] = useState<number | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  // States for interactivity
  const [draggingNumeral, setDraggingNumeral] = useState<number | null>(null);
  const [shakeGroup, setShakeGroup] = useState<number | null>(null);

  // Sound refs
  const correctSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/correct.mp3") : createMockAudio());
  const wrongSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/incorrect.mp3") : createMockAudio());
  const clapSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/clap.mp3") : createMockAudio());

  // Memoize and shuffle the numerals only once when the component loads
  const numerals = useMemo(() => {
    const nums = initialGroups.map(g => g.count);
    // Simple shuffle algorithm
    for (let i = nums.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [nums[i], nums[j]] = [nums[j], nums[i]];
    }
    return nums;
  }, []);

  // Check for the win condition whenever the 'groups' state changes
  useEffect(() => {
    const allMatched = groups.every(group => group.isMatched);
    if (allMatched && !isComplete) {
      clapSound.current.play();
      confetti({ particleCount: 200, spread: 70, origin: { y: 0.6 } });
      setTimeout(() => setIsComplete(true), 500);
    }
  }, [groups, isComplete, clapSound]);

  // --- Unified Drop Logic ---
  const handleDropLogic = (droppedNumeral: number, targetGroup: Group) => {
    if (targetGroup.isMatched) return; // Already matched

    // Check if the dropped number matches the count of items in the group
    if (droppedNumeral === targetGroup.count) {
      correctSound.current.play();
      // Update the state to mark this group as matched
      setGroups(prevGroups => 
        prevGroups.map(group =>
          group.id === targetGroup.id ? { ...group, isMatched: true } : group
        )
      );
    } else {
      wrongSound.current.play();
      setShakeGroup(targetGroup.id);
      setTimeout(() => setShakeGroup(null), 500);
    }
  };

  // --- Desktop Drag Handlers ---
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, numeral: number) => {
    e.dataTransfer.setData("numeral", numeral.toString());
    setDraggingNumeral(numeral);
  };

  const handleDragEnd = () => {
    setDraggingNumeral(null);
    setDragOverGroup(null);
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetGroup: Group) => {
    e.preventDefault();
    setDragOverGroup(null);
    const droppedNumeral = parseInt(e.dataTransfer.getData("numeral"));
    if (droppedNumeral) {
        handleDropLogic(droppedNumeral, targetGroup);
    }
  };

  // --- Mobile Touch Handlers ---
  const onTouchStart = (numeral: number) => {
    setDraggingNumeral(numeral);
  };

  const onTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    const dropZone = element?.closest('[data-groupid]') as HTMLElement | null;
    setDragOverGroup(dropZone?.dataset.groupid ? parseInt(dropZone.dataset.groupid) : null);
  };

  const onTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (draggingNumeral === null) return;
    
    const touch = e.changedTouches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    const dropZoneEl = element?.closest('[data-groupid]') as HTMLElement | null;
    
    if (dropZoneEl?.dataset.groupid) {
      const groupId = parseInt(dropZoneEl.dataset.groupid);
      const targetGroup = groups.find(g => g.id === groupId);
      if (targetGroup) {
        handleDropLogic(draggingNumeral, targetGroup);
      }
    }
    setDraggingNumeral(null);
    setDragOverGroup(null);
  };

  // The final success screen shown after all groups are matched
  if (isComplete) {
    return (
      <div className="p-6 text-center flex flex-col items-center justify-center h-full bg-blue-50 backdrop-blur-sm">
        <CheckCircle size={80} className="text-green-500 mb-4" />
        <h2 className="text-3xl font-bold">You're a counting pro!</h2>
        <p className="text-lg text-gray-600 mb-6">You matched all the numbers.</p>
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
    <div className="p-4 flex flex-col h-full bg-blue-50">
      <style>{shakeAnimationCss}</style>
      <h3 className="text-2xl font-bold text-center mb-6 text-blue-800">Drag the number to the group that matches!</h3>
      
      {/* Top Section: Groups of objects (the drop zones) */}
      <div className="flex-grow grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {groups.map(group => (
          <div
            key={group.id}
            data-groupid={group.id}
            onDrop={(e) => handleDrop(e, group)}
            onDragOver={(e) => { e.preventDefault(); setDragOverGroup(group.id); }}
            onDragLeave={() => setDragOverGroup(null)}
            className={`p-4 rounded-xl border-4 border-dashed flex flex-col items-center justify-center transition-all duration-200
                        ${shakeGroup === group.id ? 'shake' : ''}
                        ${group.isMatched ? 'border-green-500 bg-green-100' : 'border-blue-300 bg-white'}
                        ${!group.isMatched && dragOverGroup === group.id ? 'border-solid border-blue-500 scale-105' : ''}`}
          >
            <div className="text-4xl md:text-5xl flex flex-wrap justify-center gap-2">
              {Array.from({ length: group.count }).map((_, i) => (
                <span key={i}>{group.emoji}</span>
              ))}
            </div>
            {group.isMatched && (
              <div className="mt-4 text-4xl md:text-5xl font-bold text-green-600">{group.count}</div>
            )}
          </div>
        ))}
      </div>

      {/* Bottom Section: Draggable Numerals */}
      <div className="h-24 bg-blue-200 rounded-lg flex justify-center items-center gap-4 md:gap-8 p-4">
        {numerals.map(numeral => {
          // Check if this numeral has already been matched to a group
          const isMatched = groups.some(g => g.isMatched && g.count === numeral);
          
          return (
            <div
              key={numeral}
              draggable={!isMatched} // Only allow dragging if not already matched
              onDragStart={(e) => handleDragStart(e, numeral)}
              onDragEnd={handleDragEnd}
              onTouchStart={() => onTouchStart(numeral)}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
              style={{ touchAction: 'none' }}
              className={`w-16 h-16 md:w-20 md:h-20 flex items-center justify-center bg-white rounded-full shadow-lg text-3xl md:text-4xl font-bold text-blue-800 transition-all duration-300
                        ${isMatched ? 'opacity-20 cursor-default' : 'cursor-grab hover:scale-110'}
                        ${draggingNumeral === numeral ? 'opacity-30 scale-125' : ''}`}
            >
              {numeral}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default G1_MatchingNumerals;

