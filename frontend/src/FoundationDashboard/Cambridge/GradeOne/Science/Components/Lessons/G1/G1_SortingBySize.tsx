import React, { useState, useEffect, useRef } from "react";
import { CheckCircle } from "lucide-react";
import confetti from "canvas-confetti";
import { useSpeech } from "../../../SpeechContext"; // adjust path
interface LessonProps {
  onComplete: () => void;
}

type Animal = {
  id: number;
  name: string;
  size: "big" | "small";
  emoji: string;
};

const initialAnimals: Animal[] = [
  { id: 1, name: "Elephant", size: "big", emoji: "🐘" },
  { id: 2, name: "Mouse", size: "small", emoji: "🐁" },
  { id: 3, name: "Whale", size: "big", emoji: "🐋" },
  { id: 4, name: "Ant", size: "small", emoji: "🐜" },
  { id: 5, name: "Giraffe", size: "big", emoji: "🦒" },
  { id: 6, name: "Ladybug", size: "small", emoji: "🐞" },
];

const G1_SortingBySize: React.FC<LessonProps> = ({ onComplete }) => {
  const [unsortedAnimals, setUnsortedAnimals] = useState<Animal[]>(initialAnimals);
  const [bigAnimalsHome, setBigAnimalsHome] = useState<Animal[]>([]);
  const [smallAnimalsHome, setSmallAnimalsHome] = useState<Animal[]>([]);

  // State for highlighting drop zones
  const [dragOverHome, setDragOverHome] = useState<string | null>(null);
  
  // State for highlighting the dragged item
  const [draggingId, setDraggingId] = useState<number | null>(null);
  
  const [isComplete, setIsComplete] = useState(false);

  // ✅ Sounds
  // Mock audio objects for environments without audio files
  const createMockAudio = () => ({
    play: () => { /* console.log("Audio play mock") */ },
    pause: () => { /* console.log("Audio pause mock") */ },
    currentTime: 0,
  });

  const correctSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/correct.mp3") : createMockAudio());
  const wrongSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/incorrect.mp3") : createMockAudio());
  const clapSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/clap.mp3") : createMockAudio());
    const { speak, stop } = useSpeech();
    const instructions = "Hi, in this lesson you will learn to compare big and small objects. Sort each animal into the big or small area."
      useEffect(() => {
        speak({ text: instructions });
        return stop; // stop when unmounting
      }, []);// ✅ Core drop logic
  useEffect(() => {
    if (unsortedAnimals.length === 0 && !isComplete) {
      setIsComplete(true);
      clapSound.current.play();
      confetti({ particleCount: 200, spread: 70, origin: { y: 0.6 } });
    }
  }, [unsortedAnimals, isComplete]);

  // ✅ Desktop drag
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, id: number) => {
    e.dataTransfer.setData("animalId", id.toString());
    setDraggingId(id); // Set dragging state
  };

  const handleDragEnd = () => {
    setDraggingId(null); // Clear dragging state
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, size: "big" | "small") => {
    e.preventDefault();
    setDragOverHome(null); // Clear drop zone highlight
    setDraggingId(null); // Clear dragging state

    const animalId = parseInt(e.dataTransfer.getData("animalId"));
    const animal = unsortedAnimals.find((a) => a.id === animalId);

    if (animal && animal.size === size) {
      correctSound.current.play();
      if (size === "big") setBigAnimalsHome((prev) => [...prev, animal]);
      if (size === "small") setSmallAnimalsHome((prev) => [...prev, animal]);
      setUnsortedAnimals((prev) => prev.filter((a) => a.id !== animalId));
    } else {
      wrongSound.current.play();
    }
  };
  
  // --- New handlers for drop zone highlighting ---
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, size: "big" | "small") => {
    e.preventDefault();
    setDragOverHome(size); // Highlight this drop zone
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOverHome(null); // Remove highlight
  };
  // --- End new handlers ---


  // ✅ Mobile touch support
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>, id: number) => {
    e.currentTarget.dataset.dragId = id.toString();
    setDraggingId(id); // Set dragging state
    // We remove e.preventDefault() here to avoid the passive listener error.
    // The `touchAction: 'none'` style on the element will handle preventing scroll.
    // e.preventDefault();
  };
  
  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    // We remove e.preventDefault() here to avoid the passive listener error.
    // The `touchAction: 'none'` style on the element will handle preventing scroll.
    // e.preventDefault(); 
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement | null;
    // Find the closest parent with data-size, in case the user's finger is on text/emoji
    const dropZone = element?.closest('[data-size]') as HTMLElement | null;

    if (dropZone?.dataset?.size) {
        setDragOverHome(dropZone.dataset.size as "big" | "small");
    } else {
        setDragOverHome(null);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>, animal: Animal) => {
    setDraggingId(null); // Clear dragging state
    setDragOverHome(null); // Clear drop zone highlight

    const touch = e.changedTouches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement | null;
    const dropZone = element?.closest('[data-size]') as HTMLElement | null;

    if (dropZone?.dataset?.size) {
      handleDropMobile(animal, dropZone.dataset.size as "big" | "small");
    }
  };

  const handleDropMobile = (animal: Animal, size: "big" | "small") => {
    if (animal.size === size) {
      correctSound.current.play();
      if (size === "big") setBigAnimalsHome((prev) => [...prev, animal]);
      if (size === "small") setSmallAnimalsHome((prev) => [...prev, animal]);
      setUnsortedAnimals((prev) => prev.filter((a) => a.id !== animal.id));
    } else {
      wrongSound.current.play();
    }
  };

  if (isComplete) {
    return (
      <div className="p-6 text-center flex flex-col items-center justify-center h-full text-white">
        <CheckCircle size={80} className="text-green-400 mb-4" />
        <h2 className="text-3xl font-bold">Great Job!</h2>
        <p className="text-lg mb-6">You helped all the animals!</p>
        <button
          onClick={() => {
            clapSound.current.play();
            onComplete();
          }}
          className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Continue Adventure
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 flex flex-col h-full text-white">
      <h3 className="text-2xl font-bold text-center mb-4">Help the animals find their home!</h3>

      {/* Animals to Drag */}
      <div className="flex-grow bg-white/10 rounded-lg p-4 mb-4 flex justify-center items-center flex-wrap gap-4 min-h-[150px]">
        {unsortedAnimals.map((animal) => (
          <div
            key={animal.id}
            draggable
            onDragStart={(e) => handleDragStart(e, animal.id)}
            onDragEnd={handleDragEnd} // Clear dragging state on drag end
            onTouchStart={(e) => handleTouchStart(e, animal.id)}
            onTouchMove={handleTouchMove} // Highlight drop zones on touch move
            onTouchEnd={(e) => handleTouchEnd(e, animal)}
            // Add touchAction: 'none' to prevent scrolling on mobile
            style={{ touchAction: 'none' }}
            className={`text-6xl cursor-grab transition-all duration-200 ${
              // Apply style when this animal is being dragged
              draggingId === animal.id ? "opacity-30 scale-125" : "opacity-100"
            }`}
          >
            {animal.emoji}
          </div>
        ))}
      </div>

      {/* Drop Zones */}
      <div className="grid grid-cols-2 gap-4">
        <div
          data-size="big"
          onDrop={(e) => handleDrop(e, "big")}
          onDragOver={(e) => handleDragOver(e, "big")} // Use new handler
          onDragLeave={handleDragLeave} // Use new handler
          className={`min-h-[150px] bg-red-500/30 rounded-lg p-2 border-2 border-dashed text-center transition-all duration-200 ${
            // Apply style when dragging over this zone
            dragOverHome === 'big' 
              ? "bg-red-500/50 border-red-300 scale-105 shadow-lg" 
              : "border-white/20"
          }`}
        >
          <h4 className="text-xl font-bold pointer-events-none">Big Animals</h4>
          <div className="flex flex-wrap gap-2 pointer-events-none">{bigAnimalsHome.map((a) => <span key={a.id} className="text-3xl">{a.emoji}</span>)}</div>
        </div>

        <div
          data-size="small"
          onDrop={(e) => handleDrop(e, "small")}
          onDragOver={(e) => handleDragOver(e, "small")} // Use new handler
          onDragLeave={handleDragLeave} // Use new handler
          className={`min-h-[150px] bg-blue-500/30 rounded-lg p-2 border-2 border-dashed text-center transition-all duration-200 ${
            // Apply style when dragging over this zone
            dragOverHome === 'small' 
              ? "bg-blue-500/50 border-blue-300 scale-105 shadow-lg" 
              : "border-white/20"
          }`}
        >
          <h4 className="text-xl font-bold pointer-events-none">Small Animals</h4>
          <div className="flex flex-wrap gap-2 pointer-events-none">{smallAnimalsHome.map((a) => <span key={a.id} className="text-3xl">{a.emoji}</span>)}</div>
        </div>
      </div>
    </div>
  );
};

export default G1_SortingBySize;
