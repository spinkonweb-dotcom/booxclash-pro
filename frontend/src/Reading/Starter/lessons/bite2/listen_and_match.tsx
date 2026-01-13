import React, { useState, useRef, useEffect } from 'react';
import { Volume2, CheckCircle, XCircle, ArrowRight } from 'lucide-react';

// --- Types ---

export interface MatchOption {
  id: string;
  imageUrl: string; 
  label: string; // Accessibility text (e.g. "Sunrise")
  isCorrect: boolean;
}

export interface ListenMatchProps {
  title?: string;
  instruction?: string;
  audioUrl: string;
  options: MatchOption[]; // Array of 3 images
  onComplete: (success: boolean) => void;
}

// --- Component ---

const ListenAndMatch: React.FC<ListenMatchProps> = ({
  title = "Listen & Match",
  instruction = "Drag the sound to the matching picture.",
  audioUrl,
  options,
  onComplete,
}) => {
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [feedbackStatus, setFeedbackStatus] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  
  // Drag State
  const [isDragging, setIsDragging] = useState(false);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // --- Audio Logic ---
  
  useEffect(() => {
    // Reset audio when url changes
    audioRef.current = new Audio(audioUrl);
    // Optional: Auto-play on mount
    // audioRef.current.play().catch(() => {});
  }, [audioUrl]);

  const playAudio = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => console.error(e));
    }
  };

  // --- Interaction Handlers ---

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    e.dataTransfer.setData("audio", "payload"); // Required for Firefox
    e.dataTransfer.effectAllowed = "move";
    playAudio(); // Play sound when they pick it up
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDragOverId(null);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault(); // Allow dropping
    setDragOverId(id);
  };

  const handleDrop = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    setDragOverId(null);
    submitAnswer(id);
  };

  // Fallback for click (Mobile/Accessibility)
  const handleClickOption = (id: string) => {
    if (hasSubmitted) return;
    submitAnswer(id);
  };

  const submitAnswer = (id: string) => {
    if (hasSubmitted) return;
    
    setSelectedOptionId(id);
    setHasSubmitted(true);

    const isCorrect = options.find(o => o.id === id)?.isCorrect || false;

    if (isCorrect) {
      setFeedbackStatus('correct');
      // Play success sound logic here if desired
    } else {
      setFeedbackStatus('wrong');
    }
  };

  const handleContinue = () => {
    const isCorrect = options.find(o => o.id === selectedOptionId)?.isCorrect || false;
    onComplete(isCorrect);
  };

  return (
    <div className="max-w-xl mx-auto font-sans">
      
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-slate-800">{title}</h2>
        <p className="text-slate-500 text-sm mt-1">{instruction}</p>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200">
        
        {/* --- THE DRAGGABLE AUDIO SOURCE --- */}
        <div className="flex justify-center mb-8 relative z-20">
          <div
            draggable={!hasSubmitted}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onClick={playAudio} // Tap to listen
            className={`
              cursor-grab active:cursor-grabbing
              flex items-center gap-3 px-6 py-4 rounded-full shadow-lg border-2 transition-all duration-300
              ${hasSubmitted ? 'opacity-50 pointer-events-none grayscale' : 'hover:scale-105'}
              ${isDragging ? 'border-blue-500 bg-blue-50 text-blue-600 rotate-3 scale-110' : 'border-indigo-100 bg-white text-slate-700'}
            `}
          >
            <div className="p-2 bg-indigo-600 rounded-full text-white">
              <Volume2 className={`w-6 h-6 ${isDragging ? 'animate-pulse' : ''}`} />
            </div>
            <span className="font-bold text-lg select-none">
              {isDragging ? "Drop me!" : "Listen & Drag"}
            </span>
          </div>
          
          {/* Connector Line (Visual Flair) */}
          {isDragging && dragOverId && (
            <div className="absolute top-full left-1/2 w-0.5 h-8 bg-blue-300 -translate-x-1/2 animate-bounce"></div>
          )}
        </div>

        {/* --- THE DROP ZONES (Images) --- */}
        <div className="grid grid-cols-3 gap-4">
          {options.map((option) => {
            const isSelected = selectedOptionId === option.id;
            const isHovered = dragOverId === option.id;
            
            // Dynamic Styles
            let borderClass = "border-slate-200";
            let bgClass = "bg-slate-50";
            let overlay = null;

            if (hasSubmitted) {
              if (option.isCorrect) {
                borderClass = "border-green-500 ring-2 ring-green-200";
                overlay = <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center"><CheckCircle className="w-12 h-12 text-green-600 drop-shadow-md" /></div>;
              } else if (isSelected && !option.isCorrect) {
                borderClass = "border-red-500 ring-2 ring-red-200";
                overlay = <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center"><XCircle className="w-12 h-12 text-red-600 drop-shadow-md" /></div>;
              } else {
                bgClass = "opacity-40 grayscale";
              }
            } else if (isHovered) {
              borderClass = "border-blue-500 scale-105 shadow-xl ring-4 ring-blue-100";
              bgClass = "bg-blue-50";
            } else if (isDragging) {
              borderClass = "border-blue-200 border-dashed animate-pulse";
            }

            return (
              <div
                key={option.id}
                onDragOver={(e) => handleDragOver(e, option.id)}
                onDrop={(e) => handleDrop(e, option.id)}
                onClick={() => handleClickOption(option.id)}
                className={`
                  relative aspect-square rounded-xl border-2 overflow-hidden cursor-pointer transition-all duration-300
                  ${borderClass} ${bgClass}
                `}
              >
                <img 
                  src={option.imageUrl} 
                  alt={option.label}
                  className="w-full h-full object-cover pointer-events-none"
                />
                {overlay}
              </div>
            );
          })}
        </div>
      </div>

      {/* --- FEEDBACK FOOTER --- */}
      {hasSubmitted && (
        <div className={`
          mt-6 p-4 rounded-xl flex items-center justify-between animate-in slide-in-from-bottom-2
          ${feedbackStatus === 'correct' ? 'bg-green-50 border border-green-200 text-green-900' : 'bg-red-50 border border-red-200 text-red-900'}
        `}>
          <div className="font-medium">
            {feedbackStatus === 'correct' ? "That's correct!" : "Not quite right."}
          </div>
          <button
            onClick={handleContinue}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg font-bold text-sm hover:bg-slate-800 transition-colors flex items-center"
          >
            Continue <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        </div>
      )}
    </div>
  );
};

export default ListenAndMatch;