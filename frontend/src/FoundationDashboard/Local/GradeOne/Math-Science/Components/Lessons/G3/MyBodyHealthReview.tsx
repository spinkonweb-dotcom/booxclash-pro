import React, { useState, useEffect, useRef } from "react";
import { CheckCircle, Eye, Heart, Thermometer } from "lucide-react";
import confetti from "canvas-confetti";

interface LessonProps {
  onComplete: () => void;
}

// --- DATA STRUCTURES ---
type HygieneItem = {
  id: string;
  emoji: string;
  name: string;
};

// --- GAME DATA ---
const ADVICE_ITEMS: HygieneItem[] = [
  { id: "soap", emoji: "🧼", name: "Wash Hands" },
  { id: "apple", emoji: "🍎", name: "Eat Healthy" },
  { id: "sleep", emoji: "😴", name: "Get Sleep" },
];

// --- COMPONENT ---
const DoctorsOfficeGame: React.FC<LessonProps> = ({ onComplete }) => {
  // --- STATE ---
  const [stage, setStage] = useState<1 | 2 | 3 | 4>(1); // Extended to 4 stages
  const [isGameComplete, setIsGameComplete] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

  // Stage 1 (Measure)
  const [isChartInPlace, setIsChartInPlace] = useState(false); 
  const [isRulerDragging, setIsRulerDragging] = useState(false);
  const [dragOverZone, setDragOverZone] = useState(false);

  // Stage 2 (Senses)
  const [eyeTestDone, setEyeTestDone] = useState(false);
  const [heartTestDone, setHeartTestDone] = useState(false);

  // Stage 3 (Temperature)
  const [isThermometerInPlace, setIsThermometerInPlace] = useState(false);
  const [isThermometerDragging, setIsThermometerDragging] = useState(false);
  const [dragOverPatientTemp, setDragOverPatientTemp] = useState(false);

  // Stage 4 (Hygiene)
  const [adviceGiven, setAdviceGiven] = useState<Set<string>>(new Set());
  const [draggingItem, setDraggingItem] = useState<HygieneItem | null>(null);
  const [dragOverPatientAdvice, setDragOverPatientAdvice] = useState(false);

  // --- SOUNDS ---
  const createMockAudio = () => ({
    play: () => { /* console.log("Audio play mock") */ },
    pause: () => { /* console.log("Audio pause mock") */ },
    currentTime: 0,
  });

  const correctSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/correct.mp3") : createMockAudio());
  const wrongSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/incorrect.mp3") : createMockAudio());
  const clapSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/clap.mp3") : createMockAudio());
  const popSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/pop.mp3") : createMockAudio());

  // --- STAGE 1: MEASURE LOGIC ---
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData("itemType", "ruler");
    setIsRulerDragging(true);
  };
  const handleDragEnd = () => {
    setIsRulerDragging(false);
    setDragOverZone(false);
  };
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOverZone(true);
  };
  const handleDragLeave = () => setDragOverZone(false);
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOverZone(false);
    if (e.dataTransfer.getData("itemType") === "ruler") {
      setIsChartInPlace(true); 
      popSound.current.play();
    }
    setIsRulerDragging(false);
  };
  // Touch
  const handleTouchStart = () => setIsRulerDragging(true);
  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement | null;
    setDragOverZone(!!element?.closest("[data-dropzone-stage1]"));
  };
  const handleTouchEnd = () => {
    if (dragOverZone) {
      setIsChartInPlace(true);
      popSound.current.play();
    }
    setIsRulerDragging(false);
    setDragOverZone(false);
  };

  const advanceToStage2 = () => {
    correctSound.current.play();
    setFeedback('correct');
    setTimeout(() => {
      setStage(2);
      setFeedback(null);
    }, 1000);
  };

  // --- STAGE 2: SENSES LOGIC ---
  const handleSenseClick = (sense: 'eye' | 'heart') => {
    if (feedback) return;
    correctSound.current.play();
    if (sense === 'eye') setEyeTestDone(true);
    if (sense === 'heart') setHeartTestDone(true);
  };

  useEffect(() => {
    if (stage === 2 && eyeTestDone && heartTestDone) {
      setFeedback('correct');
      setTimeout(() => {
        setStage(3); // Advance to new Stage 3
        setFeedback(null);
      }, 1000);
    }
  }, [stage, eyeTestDone, heartTestDone]);

  // --- STAGE 3: TEMPERATURE LOGIC ---
  const handleTempDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData("itemType", "thermometer");
    setIsThermometerDragging(true);
  };
  const handleTempDragEnd = () => {
    setIsThermometerDragging(false);
    setDragOverPatientTemp(false);
  };
  const handleTempDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOverPatientTemp(true);
  };
  const handleTempDragLeave = () => setDragOverPatientTemp(false);
  const handleTempDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOverPatientTemp(false);
    if (e.dataTransfer.getData("itemType") === "thermometer") {
      setIsThermometerInPlace(true); 
      popSound.current.play();
    }
    setIsThermometerDragging(false);
  };
  // Touch
  const handleTempTouchStart = () => setIsThermometerDragging(true);
  const handleTempTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement | null;
    setDragOverPatientTemp(!!element?.closest("[data-dropzone-stage3]"));
  };
  const handleTempTouchEnd = () => {
    if (dragOverPatientTemp) {
      setIsThermometerInPlace(true);
      popSound.current.play();
    }
    setIsThermometerDragging(false);
    setDragOverPatientTemp(false);
  };

  const advanceToStage4 = () => {
    correctSound.current.play();
    setFeedback('correct');
    setTimeout(() => {
      setStage(4);
      setFeedback(null);
    }, 1000);
  };


  // --- STAGE 4: HYGIENE LOGIC ---
  const handleAdviceDragStart = (e: React.DragEvent<HTMLDivElement>, item: HygieneItem) => {
    e.dataTransfer.setData("itemId", item.id);
    setDraggingItem(item);
  };
  const handleAdviceDragEnd = () => {
    setDraggingItem(null);
    setDragOverPatientAdvice(false);
  };
  const handleAdviceDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOverPatientAdvice(true);
  };
  const handleAdviceDragLeave = () => setDragOverPatientAdvice(false);
  const handleAdviceDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOverPatientAdvice(false);
    const itemId = e.dataTransfer.getData("itemId");
    const droppedItem = ADVICE_ITEMS.find(item => item.id === itemId);
    
    if (droppedItem && !adviceGiven.has(droppedItem.id)) {
      correctSound.current.play();
      setAdviceGiven(prev => new Set(prev).add(droppedItem.id));
    } else if (droppedItem) {
      // Already added
    } else {
      wrongSound.current.play();
    }
    setDraggingItem(null);
  };
  // Touch
  const handleAdviceTouchStart = (item: HygieneItem) => setDraggingItem(item);
  const handleAdviceTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement | null;
    setDragOverPatientAdvice(!!element?.closest("[data-dropzone-stage4]"));
  };
  const handleAdviceTouchEnd = () => {
    if (dragOverPatientAdvice && draggingItem) {
      if (!adviceGiven.has(draggingItem.id)) {
        correctSound.current.play();
        setAdviceGiven(prev => new Set(prev).add(draggingItem.id));
      }
    }
    setDraggingItem(null);
    setDragOverPatientAdvice(false);
  };

  useEffect(() => {
    if (stage === 4 && adviceGiven.size === ADVICE_ITEMS.length) {
      setFeedback('correct');
      setTimeout(() => {
        setIsGameComplete(true);
        clapSound.current.play();
        confetti({ particleCount: 200, spread: 80, origin: { y: 0.6 } });
      }, 1000);
    }
  }, [stage, adviceGiven, clapSound]);


  // --- RENDER ---

  if (isGameComplete) {
    return (
      <div className="p-6 text-center flex flex-col items-center justify-center h-full text-white">
        <CheckCircle size={80} className="text-green-400 mb-4" />
        <h2 className="text-3xl font-bold">Great Checkup!</h2>
        <p className="text-lg mb-6">You're a health review expert!</p>
        <button
          onClick={onComplete}
          className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Finish Lesson
        </button>
      </div>
    );
  }
  
  const renderStage1 = () => (
    <>
      <h3 className="text-2xl font-bold text-center mb-4">Stage 1: Measure the patient!</h3>
      <p className="text-lg text-center text-cyan-300 mb-6">Drag the growth chart to the wall.</p>
      
      <div className="flex-grow flex items-end justify-center gap-12">
        {/* Patient */}
        <div className="text-9xl">🧑</div>
        
        {/* Drop Zone */}
        <div
          data-dropzone-stage1="true"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative w-24 h-72 bg-white/10 rounded-lg border-4 border-dashed
            ${dragOverZone ? 'border-cyan-400' : 'border-white/20'}
            ${feedback === 'correct' ? 'border-green-500' : ''}
            ${isChartInPlace ? 'border-green-500' : ''} 
          `}
        >
          {isChartInPlace ? (
            <div className="relative w-full h-full bg-yellow-200 p-2 flex flex-col justify-between items-center">
              <span className="font-bold text-black">-- 4 --</span>
              <span className="font-bold text-black">-- 3 --</span>
              <span className="font-bold text-black">-- 2 --</span>
              <span className="font-bold text-black">-- 1 --</span>
            </div>
          ) : (
            <p className="text-white/70 text-center p-4">Place Chart Here</p>
          )}
        </div>
      </div>
      
      {/* Draggable Chart */}
      {!isChartInPlace && (
        <div className="w-full h-32 bg-stone-700 rounded-lg p-4 flex justify-center items-center mt-4">
          <div
            draggable style={{ touchAction: "none" }}
            onDragStart={handleDragStart} onDragEnd={handleDragEnd}
            onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}
            className={`w-16 h-28 bg-yellow-200 p-1 flex flex-col justify-between items-center rounded-lg cursor-grab
              ${isRulerDragging ? 'opacity-30 scale-105' : ''}
            `}
          >
             <span className="font-bold text-black text-xs">-- 4 --</span>
             <span className="font-bold text-black text-xs">-- 3 --</span>
             <span className="font-bold text-black text-xs">-- 2 --</span>
             <span className="font-bold text-black text-xs">-- 1 --</span>
          </div>
        </div>
      )}
      
      {isChartInPlace && feedback !== 'correct' && (
        <button
          onClick={advanceToStage2}
          className="w-full bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 transition-colors mt-6"
        >
          Measure
        </button>
      )}
    </>
  );

  const renderStage2 = () => (
    <>
      <h3 className="text-2xl font-bold text-center mb-4">Stage 2: Check senses!</h3>
      <p className="text-lg text-center text-cyan-300 mb-6">Click the tools to check sight and sound.</p>

      <div className="flex-grow flex flex-col items-center justify-center gap-6">
        <div className="text-9xl mb-4">🧑</div>
        <div className="flex gap-6">
          <button
            onClick={() => handleSenseClick('eye')}
            disabled={eyeTestDone}
            className={`w-32 h-32 bg-blue-600 rounded-lg flex flex-col items-center justify-center text-5xl
              ${eyeTestDone ? 'opacity-50 bg-green-700' : 'hover:bg-blue-500'}
            `}
          >
            <Eye size={48} />
            <span className="text-sm mt-2">Eye Chart</span>
          </button>
          <button
            onClick={() => handleSenseClick('heart')}
            disabled={heartTestDone}
            className={`w-32 h-32 bg-blue-600 rounded-lg flex flex-col items-center justify-center text-5xl
              ${heartTestDone ? 'opacity-50 bg-green-700' : 'hover:bg-blue-500'}
            `}
          >
            <Heart size={48} />
            <span className="text-sm mt-2">Stethoscope</span>
          </button>
        </div>
      </div>
    </>
  );

  const renderStage3 = () => (
    <>
      <h3 className="text-2xl font-bold text-center mb-4">Stage 3: Check Temperature!</h3>
      <p className="text-lg text-center text-cyan-300 mb-6">Drag the thermometer to the patient.</p>
      
      {/* Patient Drop Zone */}
      <div 
        data-dropzone-stage3="true"
        onDragOver={handleTempDragOver}
        onDragLeave={handleTempDragLeave}
        onDrop={handleTempDrop}
        className={`relative flex-grow flex flex-col items-center justify-center p-4 bg-indigo-800 rounded-xl
          border-4 border-dashed min-h-[200px]
          ${dragOverPatientTemp ? 'border-cyan-400 scale-105' : 'border-white/20'}
          ${feedback === 'correct' ? 'border-green-500' : ''}
          ${isThermometerInPlace ? 'border-green-500' : ''}
        `}
      >
        <div className="text-9xl">🧑</div>
        {isThermometerInPlace && (
          <div className="absolute top-4 right-4 text-2xl p-2 bg-black/40 rounded-lg flex items-center gap-2">
            <Thermometer size={24} className="text-red-400" /> 98.6°F
          </div>
        )}
      </div>
      
      {/* Draggable Thermometer */}
      {!isThermometerInPlace && (
        <div className="w-full h-32 bg-stone-700 rounded-lg p-4 flex justify-center items-center gap-6 mt-4">
          <div
            draggable style={{ touchAction: "none" }}
            onDragStart={handleTempDragStart}
            onDragEnd={handleTempDragEnd}
            onTouchStart={handleTempTouchStart}
            onTouchMove={handleTempTouchMove}
            onTouchEnd={handleTempTouchEnd}
            className={`flex flex-col items-center justify-center w-20 h-20 bg-blue-500 rounded-lg shadow-lg cursor-grab
              ${isThermometerDragging ? 'opacity-30 scale-110' : 'hover:bg-blue-400'}
            `}
          >
            <span className="text-4xl">🌡️</span>
            <span className="text-xs font-semibold">Check Temp</span>
          </div>
        </div>
      )}

      {isThermometerInPlace && feedback !== 'correct' && (
        <button
          onClick={advanceToStage4}
          className="w-full bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 transition-colors mt-6"
        >
          Check
        </button>
      )}
    </>
  );
  
  const renderStage4 = () => (
    <>
      <h3 className="text-2xl font-bold text-center mb-4">Stage 4: Give healthy advice!</h3>
      <p className="text-lg text-center text-cyan-300 mb-6">Drag the healthy items to the patient.</p>
      
      {/* Patient Drop Zone */}
      <div 
        data-dropzone-stage4="true"
        onDragOver={handleAdviceDragOver}
        onDragLeave={handleAdviceDragLeave}
        onDrop={handleAdviceDrop}
        className={`relative flex-grow flex flex-col items-center justify-center p-4 bg-indigo-800 rounded-xl
          border-4 border-dashed min-h-[200px]
          ${dragOverPatientAdvice ? 'border-cyan-400 scale-105' : 'border-white/20'}
          ${feedback === 'correct' ? 'border-green-500' : ''}
        `}
      >
        <div className="text-9xl">🧑</div>
        <div className="absolute bottom-2 left-2 flex gap-2">
          {Array.from(adviceGiven).map(id => (
            <div key={id} className="text-4xl p-2 bg-black/30 rounded-lg">
              {ADVICE_ITEMS.find(item => item.id === id)?.emoji}
            </div>
          ))}
        </div>
      </div>
      
      {/* Draggable Advice */}
      <div className="w-full h-32 bg-stone-700 rounded-lg p-4 flex justify-center items-center gap-6 mt-4">
        {ADVICE_ITEMS.map(item => (
          !adviceGiven.has(item.id) && (
            <div
              key={item.id}
              draggable style={{ touchAction: "none" }}
              onDragStart={(e) => handleAdviceDragStart(e, item)}
              onDragEnd={handleAdviceDragEnd}
              onTouchStart={() => handleAdviceTouchStart(item)}
              onTouchMove={handleAdviceTouchMove}
              onTouchEnd={handleAdviceTouchEnd}
              className={`flex flex-col items-center justify-center w-20 h-20 bg-blue-500 rounded-lg shadow-lg cursor-grab
                ${draggingItem?.id === item.id ? 'opacity-30 scale-110' : 'hover:bg-blue-400'}
              `}
            >
              <span className="text-4xl">{item.emoji}</span>
              <span className="text-xs font-semibold">{item.name}</span>
            </div>
          )
        ))}
      </div>
    </>
  );

  return (
    <div className="p-4 flex flex-col h-full text-white overflow-hidden">
      {stage === 1 && renderStage1()}
      {stage === 2 && renderStage2()}
      {stage === 3 && renderStage3()}
      {stage === 4 && renderStage4()}
    </div>
  );
};

export default DoctorsOfficeGame;