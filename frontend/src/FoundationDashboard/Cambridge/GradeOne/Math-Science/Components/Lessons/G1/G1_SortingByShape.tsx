import React, { useState, useEffect, useRef } from "react";
import { CheckCircle } from "lucide-react";
import confetti from "canvas-confetti";
import { useSpeech } from "../../../SpeechContext"; // adjust path


interface LessonProps {
  onComplete: () => void;
}

// New type for the shape objects
type ShapeObject = {
  id: number;
  name: string;
  shape: "circle" | "square" | "triangle";
  emoji: string;
};

// New initial data for shapes
const initialObjects: ShapeObject[] = [
  { id: 1, name: "Clock", shape: "circle", emoji: "⏰" },
  { id: 2, name: "Book", shape: "square", emoji: "📖" },
  { id: 3, name: "Pizza Slice", shape: "triangle", emoji: "🍕" },
  { id: 4, name: "Ball", shape: "circle", emoji: "🏀" },
  { id: 5, name: "Window", shape: "square", emoji: "🖼️" },
  { id: 6, name: "Yield Sign", shape: "triangle", emoji: "⚠️" },
];

// Renamed component
const G1_SortingByShape: React.FC<LessonProps> = ({ onComplete }) => {
  const [unsortedObjects, setUnsortedObjects] = useState<ShapeObject[]>(initialObjects);
  const [circleBox, setCircleBox] = useState<ShapeObject[]>([]);
  const [squareBox, setSquareBox] = useState<ShapeObject[]>([]);
  const [triangleBox, setTriangleBox] = useState<ShapeObject[]>([]);
  const { speak, stop } = useSpeech();
  const instructions = "Hi, in this lesson you will learn to recognize basic shapes. Move each object into the hole that matches its shape."
  // State for highlighting drop zones
  const [dragOverHome, setDragOverHome] = useState<string | null>(null);

  // State for highlighting the dragged item
  const [draggingId, setDraggingId] = useState<number | null>(null);

  const [isComplete, setIsComplete] = useState(false);

  // ✅ Sounds (using mock/CDN pattern for robustness)
  const createMockAudio = () => ({
    play: () => { /* console.log("Audio play mock") */ },
    pause: () => { /* console.log("Audio pause mock") */ },
    currentTime: 0,
  });

  const correctSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/correct.mp3") : createMockAudio());
  const wrongSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/incorrect.mp3") : createMockAudio());
  const clapSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/clap.mp3") : createMockAudio());

  // ✅ Trigger finish with confetti + clap
  useEffect(() => {
    if (unsortedObjects.length === 0 && !isComplete) {
      setIsComplete(true);
      clapSound.current.play();
      confetti({ particleCount: 200, spread: 80, origin: { y: 0.6 } });
    }
  }, [unsortedObjects, isComplete]);
      useEffect(() => {
        speak({ text: instructions });
        return stop; // stop when unmounting
      }, []);// ✅ Core drop logic
  const processDropLogic = (object: ShapeObject, targetShape: string) => {
    if (object.shape === targetShape) {
      correctSound.current.play();
      setUnsortedObjects((prev) => prev.filter((obj) => obj.id !== object.id));
      if (targetShape === "circle") setCircleBox((prev) => [...prev, object]);
      if (targetShape === "square") setSquareBox((prev) => [...prev, object]);
      if (targetShape === "triangle") setTriangleBox((prev) => [...prev, object]);
    } else {
      wrongSound.current.play();
    }
  };

  // ✅ Desktop drag handlers
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, obj: ShapeObject) => {
    e.dataTransfer.setData("objectId", obj.id.toString());
    setDraggingId(obj.id);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDragOverHome(null); // Also reset drop zone highlight
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, shape: "circle" | "square" | "triangle") => {
    e.preventDefault();
    setDragOverHome(null);
    setDraggingId(null);

    const objectId = parseInt(e.dataTransfer.getData("objectId"));
    const object = unsortedObjects.find((o) => o.id === objectId);

    if (object) {
      processDropLogic(object, shape);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, shape: string) => {
    e.preventDefault();
    setDragOverHome(shape);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOverHome(null);
  };

  // ✅ Mobile touch handlers
  const handleTouchStart = (_e: React.TouchEvent<HTMLDivElement>, obj: ShapeObject) => {
    setDraggingId(obj.id);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement | null;
    const dropZone = element?.closest("[data-shape]") as HTMLElement | null;

    if (dropZone?.dataset?.shape) {
      setDragOverHome(dropZone.dataset.shape);
    } else {
      setDragOverHome(null);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>, obj: ShapeObject) => {
    setDraggingId(null);
    setDragOverHome(null);

    const touch = e.changedTouches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement | null;
    const dropZone = element?.closest("[data-shape]") as HTMLElement | null;

    if (dropZone?.dataset?.shape) {
      processDropLogic(obj, dropZone.dataset.shape);
    }
  };

  // Data for mapping drop zones
  const dropZones = [
    { shape: "circle", symbol: "●", color: "bg-red-500/30", highlight: "bg-red-500/50 border-red-300", items: circleBox },
    { shape: "square", symbol: "■", color: "bg-blue-500/30", highlight: "bg-blue-500/50 border-blue-300", items: squareBox },
    { shape: "triangle", symbol: "▲", color: "bg-yellow-500/30", highlight: "bg-yellow-500/50 border-yellow-300", items: triangleBox },
  ];

  if (isComplete) {
    return (
      <div className="p-6 text-center flex flex-col items-center justify-center h-full text-white">
        <CheckCircle size={80} className="text-green-400 mb-4" />
        <h2 className="text-3xl font-bold">Well Done!</h2>
        <p className="text-lg mb-6">You sorted all the objects correctly!</p>
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
    <div className="p-4 flex flex-col h-full text-white">
      <h3 className="text-2xl font-bold text-center mb-4">Drag the objects into the matching shape hole!</h3>

      {/* Objects to drag */}
      <div className="flex-grow bg-white/10 rounded-lg p-4 mb-4 flex justify-center items-center flex-wrap gap-4 min-h-[150px]">
        {unsortedObjects.map((obj) => (
          <div
            key={obj.id}
            className={`text-6xl cursor-grab transition-all duration-200 ${
              draggingId === obj.id ? "opacity-30 scale-125" : "opacity-100"
            }`}
            draggable
            style={{ touchAction: "none" }} // Prevent scroll on mobile
            onDragStart={(e) => handleDragStart(e, obj)}
            onDragEnd={handleDragEnd}
            onTouchStart={(e) => handleTouchStart(e, obj)}
            onTouchMove={handleTouchMove}
            onTouchEnd={(e) => handleTouchEnd(e, obj)}
          >
            {obj.emoji}
          </div>
        ))}
      </div>

      {/* Drop Zones */}
      <div className="grid grid-cols-3 gap-4">
        {dropZones.map(({ shape, symbol, color, highlight, items }) => (
          <div
            key={shape}
            data-shape={shape}
            onDragOver={(e) => handleDragOver(e, shape)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, shape as any)}
            className={`min-h-[120px] rounded-lg p-2 border-2 border-dashed relative flex flex-wrap justify-center items-center transition-all duration-200 ${color} ${
              dragOverHome === shape
                ? `${highlight} scale-105 shadow-lg`
                : "border-white/20"
            }`}
          >
            <span className="text-8xl opacity-20 absolute pointer-events-none">{symbol}</span>
            {items.map((obj) => (
              <div key={obj.id} className="text-3xl z-10 pointer-events-none">
                {obj.emoji}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default G1_SortingByShape; // Update default export

