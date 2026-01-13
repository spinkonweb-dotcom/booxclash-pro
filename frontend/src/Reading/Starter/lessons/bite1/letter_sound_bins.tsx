import React, { useState, useRef } from 'react';
import { Volume2, Check, X } from 'lucide-react';

// --- Types ---

export interface BinData {
  id: string;
  label: string; // e.g., "B"
  colorClass: string; // Tailwind color classes for styling e.g. "bg-blue-100"
}

export interface DragItem {
  id: string;
  word: string;      // e.g., "Bear"
  imageUrl: string; 
  correctBinId: string; // The ID of the matching bin
  audioUrl?: string; 
}

export interface LetterSoundBinsProps {
  title?: string;
  instruction?: string;
  bins: BinData[];
  items: DragItem[];
  onComplete: (success: boolean) => void;
}

// --- Component ---

const LetterSoundBins: React.FC<LetterSoundBinsProps> = ({
  title = "Letter Sound Sort",
  instruction = "Drag the picture to the letter that starts the word.",
  bins,
  items,
  onComplete,
}) => {
  // Queue state: The items remaining to be sorted
  const [queue, setQueue] = useState<DragItem[]>(items);
  // Current Item is always the first in the queue
  const currentItem = queue[0];
  
  // Feedback states
  const [feedbackStatus, setFeedbackStatus] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [dragOverBinId, setDragOverBinId] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // --- Helpers ---

  const playSound = (url?: string) => {
    if (!url) return;
    if (audioRef.current) audioRef.current.pause();
    audioRef.current = new Audio(url);
    audioRef.current.play().catch(e => console.error(e));
  };

  const handleSuccess = () => {
    setFeedbackStatus('correct');
    // Sound effect could go here
    
    setTimeout(() => {
      // Remove current item from queue
      const newQueue = queue.slice(1);
      setQueue(newQueue);
      setFeedbackStatus('idle');

      // Check if game is over
      if (newQueue.length === 0) {
        onComplete(true);
      }
    }, 1000);
  };

  const handleFailure = () => {
    setFeedbackStatus('wrong');
    setTimeout(() => setFeedbackStatus('idle'), 800);
  };

  // --- Drag & Drop Handlers ---

  const handleDragStart = (e: React.DragEvent, item: DragItem) => {
    e.dataTransfer.setData("itemId", item.id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, binId: string) => {
    e.preventDefault(); // Necessary to allow dropping
    setDragOverBinId(binId);
  };

  const handleDragLeave = () => {
    setDragOverBinId(null);
  };

  const handleDrop = (e: React.DragEvent, binId: string) => {
    e.preventDefault();
    setDragOverBinId(null);

    // Logic Check
    if (currentItem && binId === currentItem.correctBinId) {
      handleSuccess();
    } else {
      handleFailure();
    }
  };

  // --- Click Handler (Mobile/Accessibility Fallback) ---
  const handleBinClick = (binId: string) => {
    if (currentItem && binId === currentItem.correctBinId) {
      handleSuccess();
    } else {
      handleFailure();
    }
  };

  // --- Render ---

  // Game Over State (Empty Queue)
  if (!currentItem && queue.length === 0) {
    return (
      <div className="text-center p-8 bg-green-50 rounded-xl border border-green-200">
        <h3 className="text-2xl font-bold text-green-800 mb-2">Great Job!</h3>
        <p className="text-green-700">You sorted all the words correctly.</p>
        <div className="mt-4 flex justify-center">
           <Check className="w-12 h-12 text-green-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto font-sans">
      
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-slate-800">{title}</h2>
        <p className="text-slate-500 text-sm">{instruction}</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8 items-center justify-center min-h-[400px]">
        
        {/* --- THE BINS (Targets) --- */}
        <div className="flex flex-row md:flex-col gap-4 w-full md:w-1/3 justify-center">
          {bins.map((bin) => (
            <div
              key={bin.id}
              onDragOver={(e) => handleDragOver(e, bin.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, bin.id)}
              onClick={() => handleBinClick(bin.id)} // Click support
              className={`
                h-32 md:h-40 rounded-2xl border-4 flex flex-col items-center justify-center cursor-pointer transition-all duration-300
                ${dragOverBinId === bin.id ? 'scale-105 shadow-xl ring-4 ring-offset-2 ring-blue-200' : 'shadow-md'}
                ${bin.colorClass}
                ${feedbackStatus === 'correct' && currentItem.correctBinId === bin.id ? 'animate-bounce' : ''}
              `}
            >
              <span className="text-6xl font-black text-slate-800/80 pointer-events-none select-none">
                {bin.label}
              </span>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mt-2 pointer-events-none">
                Drop Here
              </p>
            </div>
          ))}
        </div>

        {/* --- CENTER DIVIDER (Desktop) --- */}
        <div className="hidden md:block w-px h-64 bg-slate-200"></div>

        {/* --- THE ITEM (Draggable) --- */}
        <div className="w-full md:w-1/3 flex flex-col items-center justify-center relative">
          
          {/* Deck Effect (Cards behind) */}
          {queue.length > 1 && (
            <div className="absolute top-2 w-56 h-56 bg-white border border-slate-200 rounded-xl shadow-sm rotate-3 z-0"></div>
          )}
          
          {/* Active Card */}
          <div
            draggable
            onDragStart={(e) => handleDragStart(e, currentItem)}
            className={`
              relative w-64 h-72 bg-white rounded-xl shadow-xl border border-slate-200 p-4 
              flex flex-col items-center z-10 cursor-grab active:cursor-grabbing
              transition-transform duration-300
              ${feedbackStatus === 'wrong' ? 'animate-shake border-red-400' : ''}
              ${feedbackStatus === 'correct' ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}
            `}
          >
            {/* Image */}
            <div className="w-full flex-1 rounded-lg overflow-hidden bg-slate-100 mb-4 relative group">
               <img 
                 src={currentItem.imageUrl} 
                 alt={currentItem.word} 
                 className="w-full h-full object-cover pointer-events-none" 
               />
               <button 
                 onClick={(e) => { e.stopPropagation(); playSound(currentItem.audioUrl); }}
                 className="absolute bottom-2 right-2 bg-white/90 p-2 rounded-full shadow-sm hover:bg-white text-blue-600"
               >
                 <Volume2 className="w-5 h-5" />
               </button>
            </div>

            {/* Word Label (optional hint) */}
            <div className="text-center">
              <span className="text-2xl font-bold text-slate-800 capitalize">
                {currentItem.word}
              </span>
              <p className="text-xs text-slate-400 mt-1">Drag to the matching letter</p>
            </div>

            {/* Status Icons Overlay */}
            {feedbackStatus === 'correct' && (
              <div className="absolute inset-0 flex items-center justify-center bg-green-100/80 rounded-xl backdrop-blur-sm">
                 <Check className="w-20 h-20 text-green-600 drop-shadow-md" />
              </div>
            )}
             {feedbackStatus === 'wrong' && (
              <div className="absolute inset-0 flex items-center justify-center bg-red-100/50 rounded-xl pointer-events-none">
                 <X className="w-20 h-20 text-red-600 drop-shadow-md" />
              </div>
            )}

          </div>
          
          <div className="mt-6 text-sm text-slate-400 font-medium">
            {queue.length} items remaining
          </div>

        </div>
      </div>
    </div>
  );
};

export default LetterSoundBins;