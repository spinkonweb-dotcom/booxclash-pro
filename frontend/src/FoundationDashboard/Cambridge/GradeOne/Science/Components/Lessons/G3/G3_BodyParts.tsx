import React, { useState, useEffect, useRef, useMemo } from 'react';
import { CheckCircle } from 'lucide-react';

// Shake animation CSS
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

type Item = {
  id: string;
  label: string;
};

type PictureZone = {
  id: string;
  name: string;
  imageUrl: string;
};

// The draggable items (names)
const ITEMS: Item[] = [
  { id: "head", label: "Head" },
  { id: "eyes", label: "Eyes" },
  { id: "nose", label: "Nose" },
  { id: "mouth", label: "Mouth" },
  { id: "hands", label: "Hands" },
  { id: "feet", label: "Feet" }
];

// The drop zones (pictures) - using the actual file paths
const PICTURE_ZONES: PictureZone[] = [
  { id: "head", name: "Head", imageUrl: "/images/lessons/head.jpg" },
  { id: "eyes", name: "Eyes", imageUrl: "/images/lessons/eyes.jpg" },
  { id: "nose", name: "Nose", imageUrl: "/images/lessons/nose.jpg" },
  { id: "mouth", name: "Mouth", imageUrl: "/images/lessons/mouth.jpg" },
  { id: "hands", name: "Hands", imageUrl: "/images/lessons/hands.jpg" },
  { id: "feet", name: "Feet", imageUrl: "/images/lessons/feet.jpg" }
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const createMockAudio = () => ({
  play: () => {},
  pause: () => {},
  currentTime: 0,
});

const G3_BodyParts: React.FC<LessonProps> = ({ onComplete }) => {
  const [shuffledItems] = useState<Item[]>(() => shuffle(ITEMS));
  const [shuffledZones] = useState<PictureZone[]>(() => shuffle(PICTURE_ZONES));
  const [placed, setPlaced] = useState<Record<string, string | null>>(() =>
    PICTURE_ZONES.reduce((acc, z) => ({ ...acc, [z.id]: null }), {} as Record<string, string | null>)
  );
  const [isComplete, setIsComplete] = useState(false);
  
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverZone, setDragOverZone] = useState<string | null>(null);
  const [shakeZone, setShakeZone] = useState<string | null>(null);
  const [message, setMessage] = useState<string>("");

  const correctSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/correct.mp3") : createMockAudio());
  const wrongSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/incorrect.mp3") : createMockAudio());

  const correctCount = useMemo(() => {
    return PICTURE_ZONES.reduce((count, z) => (placed[z.id] === z.id ? count + 1 : count), 0);
  }, [placed]);

  useEffect(() => {
    if (correctCount === PICTURE_ZONES.length && !isComplete) {
      setIsComplete(true);
    }
  }, [correctCount, isComplete]);

  const handleDropLogic = (itemId: string, zone: PictureZone) => {
    const item = ITEMS.find(i => i.id === itemId);
    if (!item) return;

    if (zone.id === item.id) {
      correctSound.current.play();
      setPlaced(prev => {
        const updated = { ...prev };
        for (const z of Object.keys(updated)) {
          if (updated[z] === itemId) updated[z] = null;
        }
        updated[zone.id] = itemId;
        return updated;
      });
      setMessage("");
    } else {
      wrongSound.current.play();
      setShakeZone(zone.id);
      setMessage("Try again! That doesn't go there.");
      setTimeout(() => {
        setShakeZone(null);
        setMessage("");
      }, 1500);
    }
  };

  const handleRemovePlaced = (zoneId: string) => {
    setPlaced(p => ({ ...p, [zoneId]: null }));
    setMessage("");
  };

  const onDragStart = (e: React.DragEvent<HTMLDivElement>, item: Item) => {
    e.dataTransfer.setData("text/plain", item.id);
    e.dataTransfer.effectAllowed = "move";
    setDraggingId(item.id);
  };

  const onDragEnd = () => {
    setDraggingId(null);
    setDragOverZone(null);
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>, zoneId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverZone(zoneId);
  };

  const onDragLeave = () => {
    setDragOverZone(null);
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>, zone: PictureZone) => {
    e.preventDefault();
    setDraggingId(null);
    setDragOverZone(null);
    const itemId = e.dataTransfer.getData("text/plain");
    if (itemId) {
      handleDropLogic(itemId, zone);
    }
  };

  const onTouchStart = (item: Item) => {
    setDraggingId(item.id);
  };

  const onTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    const dropZone = element?.closest('[data-zoneid]') as HTMLElement | null;
    setDragOverZone(dropZone?.dataset.zoneid || null);
  };

  const onTouchEnd = (e: React.TouchEvent<HTMLDivElement>, item: Item) => {
    setDraggingId(null);
    setDragOverZone(null);
    
    const touch = e.changedTouches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    const dropZoneEl = element?.closest('[data-zoneid]') as HTMLElement | null;
    
    if (dropZoneEl?.dataset.zoneid) {
      const zone = PICTURE_ZONES.find(z => z.id === dropZoneEl.dataset.zoneid);
      if (zone) {
        handleDropLogic(item.id, zone);
      }
    }
  };

  const remainingItems = useMemo(
    () => shuffledItems.filter((it) => !Object.values(placed).includes(it.id)),
    [shuffledItems, placed]
  );

  if (isComplete) {
    return (
      <div className="p-6 text-center flex flex-col items-center justify-center h-full bg-gradient-to-b from-blue-50 to-green-50">
        <CheckCircle size={80} className="text-green-500 mb-4" />
        <h2 className="text-3xl font-bold text-green-800 mb-2">Excellent Work!</h2>
        <p className="text-xl text-gray-700 mb-6">You've labeled all the body parts correctly!</p>
        <button 
          onClick={onComplete} 
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg text-xl transition-colors"
        >
          Continue Adventure
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6 bg-gradient-to-b from-blue-50 to-purple-50 min-h-screen">
      <style>{shakeAnimationCss}</style>
      
      {/* Top Panel - Draggable Items */}
      <div className="w-full bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-2xl font-bold text-center mb-4 text-purple-800">
          Drag Labels to Body Parts
        </h3>
        
        <div className="flex flex-wrap justify-center gap-3 min-h-[80px] mb-4">
          {remainingItems.map((item) => (
            <div
              key={item.id}
              draggable
              onDragStart={(e) => onDragStart(e, item)}
              onDragEnd={onDragEnd}
              onTouchStart={() => onTouchStart(item)}
              onTouchMove={onTouchMove}
              onTouchEnd={(e) => onTouchEnd(e, item)}
              style={{ touchAction: 'none' }}
              className={`bg-gradient-to-r from-blue-400 to-purple-400 text-white p-3 px-6 rounded-lg cursor-grab active:cursor-grabbing shadow-md hover:shadow-lg transition-all hover:scale-105 font-semibold text-center ${
                draggingId === item.id ? 'opacity-30' : 'opacity-100'
              }`}
            >
              {item.label}
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
          <div className="text-lg font-bold text-gray-700">
            Progress: {correctCount} / {PICTURE_ZONES.length}
          </div>
          {message && (
            <div className="text-red-600 font-semibold bg-red-50 p-2 rounded">
              {message}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Panel - Picture Drop Zones */}
      <div className="flex-1 bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-2xl font-bold text-center mb-6 text-green-800">
          Match the Names to the Pictures
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {shuffledZones.map((zone) => {
            const placedItemId = placed[zone.id];
            const placedItem = ITEMS.find((it) => it.id === placedItemId) ?? null;
            
            return (
              <div
                key={zone.id}
                data-zoneid={zone.id}
                onDragOver={(e) => onDragOver(e, zone.id)}
                onDragLeave={onDragLeave}
                onDrop={(e) => onDrop(e, zone)}
                className={`relative aspect-square p-3 rounded-lg border-4 transition-all duration-200 ${
                  shakeZone === zone.id ? 'shake' : ''
                } ${
                  placedItem 
                    ? 'bg-green-100 border-green-500' 
                    : dragOverZone === zone.id 
                      ? 'bg-yellow-100 border-yellow-400 scale-105' 
                      : 'bg-gray-50 border-dashed border-gray-300'
                }`}
              >
                <img
                  src={zone.imageUrl}
                  alt={zone.name}
                  className="w-full h-full object-contain rounded-md"
                  onError={(e) => {
                    e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150"><rect width="150" height="150" fill="%23ddd"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="14" fill="%23666">' + zone.name + '</text></svg>';
                  }}
                />
                {placedItem ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-green-500/90 rounded-lg">
                    <span className="text-xl font-bold text-white mb-2">{placedItem.label}</span>
                    <button
                      onClick={() => handleRemovePlaced(zone.id)}
                      className="bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold shadow-lg"
                      aria-label={`Remove ${placedItem.label}`}
                    >
                      ✖
                    </button>
                  </div>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-gray-400 text-sm font-semibold bg-white/80 px-3 py-1 rounded">
                      Drop here
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default G3_BodyParts;