import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useSpeech } from "../../../SpeechContext"; 
// We will inject the CSS directly into the component
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


interface LessonProps {
  onComplete: () => void;
}

type Toy = {
  id: number;
  name: string;
  color: 'red' | 'blue' | 'yellow';
  emoji: string;
};

const initialToys: Toy[] = [
  { id: 1, name: 'Car', color: 'red', emoji: '🚗' },
  { id: 2, name: 'Whale', color: 'blue', emoji: '🐳' },
  { id: 3, name: 'Duck', color: 'yellow', emoji: '🦆' },
  { id: 4, name: 'Apple', color: 'red', emoji: '🍎' },
  { id: 5, name: 'Butterfly', color: 'blue', emoji: '🦋' },
  { id: 6, name: 'Banana', color: 'yellow', emoji: '🍌' },
  { id: 7, name: 'Heart', color: 'red', emoji: '❤️' },
  { id: 8, name: 'Sun', color: 'yellow', emoji: '☀️' },
];

// Mock audio for environments without audio
const createMockAudio = () => ({
  play: () => { /* console.log("Audio play mock") */ },
  pause: () => { /* console.log("Audio pause mock") */ },
  currentTime: 0,
});

const G1_SortingByColor: React.FC<LessonProps> = ({ onComplete }) => {
  const [unsortedToys, setUnsortedToys] = useState<Toy[]>(initialToys);
  const [redBox, setRedBox] = useState<Toy[]>([]);
  const [blueBox, setBlueBox] = useState<Toy[]>([]);
  const [yellowBox, setYellowBox] = useState<Toy[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [shakeBox, setShakeBox] = useState<string | null>(null);

  // States for interactivity
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [dragOverHome, setDragOverHome] = useState<string | null>(null);

  // ✅ Sound refs using CDN and mock fallback
  const correctSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/correct.mp3") : createMockAudio());
  const wrongSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/incorrect.mp3") : createMockAudio());
  const clapSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/clap.mp3") : createMockAudio());


  const { speak, stop } = useSpeech();
  const instruction = "Hi, in this lesson you will learn to identify and group things by color. Drag each object into the box that matches its color."
    useEffect(() => {
      speak({ text: instruction });
      return stop; // stop when unmounting
    }, []);// ✅ Core drop logic
  useEffect(() => {
    if (unsortedToys.length === 0 && !isComplete) {
      setIsComplete(true);
      clapSound.current.play();
      confetti({ particleCount: 200, spread: 70, origin: { y: 0.6 } });
    }
  }, [unsortedToys, isComplete]);

  // ✅ Core Drop Logic
  const handleToyDrop = (toyId: number, boxColor: 'red' | 'blue' | 'yellow') => {
    const draggedToy = unsortedToys.find((toy) => toy.id === toyId);
    if (!draggedToy) return;

    if (draggedToy.color === boxColor) {
      correctSound.current.play();
      if (boxColor === 'red') setRedBox(prev => [...prev, draggedToy]);
      if (boxColor === 'blue') setBlueBox(prev => [...prev, draggedToy]);
      if (boxColor === 'yellow') setYellowBox(prev => [...prev, draggedToy]);
      setUnsortedToys(prev => prev.filter((toy) => toy.id !== toyId));
    } else {
      wrongSound.current.play();
      setShakeBox(boxColor);
      setTimeout(() => setShakeBox(null), 500);
    }
  };

  // ✅ Desktop Drag Handlers
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, toy: Toy) => {
    e.dataTransfer.setData('toyId', toy.id.toString());
    setDraggingId(toy.id);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDragOverHome(null);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, color: string) => {
    e.preventDefault();
    setDragOverHome(color);
  };

  const handleDragLeave = () => {
    setDragOverHome(null);
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>, color: 'red' | 'blue' | 'yellow') => {
    e.preventDefault();
    setDraggingId(null);
    setDragOverHome(null);
    const toyId = parseInt(e.dataTransfer.getData('toyId'));
    if (toyId) {
      handleToyDrop(toyId, color);
    }
  };

  // ✅ Mobile Touch Handlers
  const handleTouchStart = (_e: React.TouchEvent<HTMLDivElement>, toy: Toy) => {
    setDraggingId(toy.id);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    const dropZone = element?.closest('[data-box]') as HTMLElement | null;

    if (dropZone?.dataset?.box) {
      setDragOverHome(dropZone.dataset.box);
    } else {
      setDragOverHome(null);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>, toy: Toy) => {
    setDraggingId(null);
    setDragOverHome(null);
    
    const touch = e.changedTouches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    const dropZone = element?.closest('[data-box]') as HTMLElement | null;

    if (dropZone?.dataset?.box) {
      handleToyDrop(toy.id, dropZone.dataset.box as 'red' | 'blue' | 'yellow');
    }
  };

  if (isComplete) {
    return (
      <div className="p-6 text-center flex flex-col items-center justify-center h-full text-white">
        <CheckCircle size={80} className="text-green-400 mb-4" />
        <h2 className="text-3xl font-bold">Awesome!</h2>
        <p className="text-lg mb-6">You sorted all the toys!</p>
        <button
          onClick={onComplete}
          className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Continue Adventure
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 text-white h-full flex flex-col">
      <style>{shakeAnimationCss}</style>
      <h3 className="text-2xl font-bold text-center mb-4">
        Drag the items into the correct color box!
      </h3>

      <div className="flex-grow flex flex-wrap gap-4 p-4 bg-white/20 rounded-lg backdrop-blur-sm justify-center items-center min-h-[150px]">
        {unsortedToys.map((toy) => (
          <div
            key={toy.id}
            draggable
            onDragStart={(e) => handleDragStart(e, toy)}
            onDragEnd={handleDragEnd}
            onTouchStart={(e) => handleTouchStart(e, toy)}
            onTouchMove={handleTouchMove}
            onTouchEnd={(e) => handleTouchEnd(e, toy)}
            style={{ touchAction: 'none' }}
            className={`text-5xl cursor-grab hover:scale-110 transition-all duration-200 ${
              draggingId === toy.id ? 'opacity-30 scale-125' : 'opacity-100'
            }`}
          >
            {toy.emoji}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4 mt-6">
        {[{ color: 'red', box: redBox, bg: 'bg-red-500/40', highlight: 'bg-red-500/60' },
          { color: 'blue', box: blueBox, bg: 'bg-blue-500/40', highlight: 'bg-blue-500/60' },
          { color: 'yellow', box: yellowBox, bg: 'bg-yellow-400/40', highlight: 'bg-yellow-400/60' }]
          .map(({ color, box, bg, highlight }) => (
            <div
              key={color}
              data-box={color}
              onDragOver={(e) => handleDragOver(e, color)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, color as 'red' | 'blue' | 'yellow')}
              className={`min-h-[120px] p-4 rounded-lg border-4 border-dashed flex flex-wrap justify-center items-center gap-2 transition-all duration-200 ${
                dragOverHome === color
                  ? `${highlight} scale-105 shadow-lg border-white/80`
                  : `${bg} border-white/20`
              } 
              ${shakeBox === color ? 'shake' : ''}`}
            >
              {box.map((toy) => (
                <div key={toy.id} className="text-3xl pointer-events-none">{toy.emoji}</div>
              ))}
            </div>
          ))}
      </div>
    </div>
  );
};

export default G1_SortingByColor;