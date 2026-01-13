import React, { useState, useRef } from 'react';
import { Volume2, CheckCircle, XCircle, ArrowRight, HelpCircle } from 'lucide-react';

// --- Types ---

export interface SortOption {
  id: string;
  word: string;      // e.g., "Cat"
  imageUrl: string;  
  audioUrl?: string; // Optional: helps if user doesn't know what image is
  isOddOneOut: boolean; // True if this is the correct answer (the different sound)
}

export interface SoundSortProps {
  title?: string;
  instruction?: string;
  options?: SortOption[]; // Array of 3 options
  onComplete: (success: boolean) => void;
}

// --- Component ---

const SoundSort: React.FC<SoundSortProps> = ({
  title = "Sound Sort",
  instruction = "Find the word that starts with a DIFFERENT sound.",
  options,
  onComplete,
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // --- SAFETY GUARD ---
  if (!options || options.length < 3) {
    return (
      <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-300">
        <p>Loading sort activity...</p>
      </div>
    );
  }

  // Handle Play Sound (Optional helper)
  const playWordAudio = (url?: string) => {
    if (!url) return;
    if (audioRef.current) {
      audioRef.current.pause(); // Stop any currently playing
    }
    audioRef.current = new Audio(url);
    audioRef.current.play().catch(e => console.error("Audio error:", e));
  };

  const handleSelect = (id: string, audioUrl?: string) => {
    if (hasSubmitted) {
      // If already submitted, just play the sound for reinforcement
      playWordAudio(audioUrl);
      return;
    }

    // Play sound immediately on select to help them "hear" the choice
    playWordAudio(audioUrl);
    
    setSelectedId(id);
    setHasSubmitted(true);
  };

  const handleNext = () => {
    const selectedOption = options.find((opt) => opt.id === selectedId);
    onComplete(selectedOption?.isOddOneOut || false);
    setSelectedId(null);
    setHasSubmitted(false);
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden border border-slate-200 font-sans">
      
      {/* Header */}
      <div className="bg-slate-50 p-6 text-center border-b border-slate-100">
        <h2 className="text-xl font-bold text-slate-800">{title}</h2>
        <div className="flex items-center justify-center gap-2 text-slate-500 mt-2">
          <HelpCircle className="w-4 h-4" />
          <p className="text-sm">{instruction}</p>
        </div>
      </div>

      {/* The Sort Grid */}
      <div className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {options.map((option) => {
            const isSelected = selectedId === option.id;
            
            // Visual Logic
            let containerClass = "border-slate-200 hover:border-blue-400 hover:shadow-md";
            let bgClass = "bg-white";
            let icon = null;

            if (hasSubmitted) {
              if (option.isOddOneOut) {
                // This is the correct answer (the odd one)
                if (isSelected) {
                   // User found it!
                   containerClass = "border-green-500 ring-2 ring-green-200";
                   bgClass = "bg-green-50";
                   icon = <CheckCircle className="absolute top-2 right-2 text-green-600 w-6 h-6 z-10" />;
                } else {
                   // User missed it, highlight it anyway
                   containerClass = "border-green-300 border-dashed";
                   bgClass = "bg-green-50/50 opacity-70";
                }
              } else {
                // This is one of the matching pairs (Incorrect to click)
                if (isSelected) {
                   // User wrongly clicked a matching pair
                   containerClass = "border-red-500 ring-2 ring-red-200";
                   bgClass = "bg-red-50";
                   icon = <XCircle className="absolute top-2 right-2 text-red-600 w-6 h-6 z-10" />;
                } else {
                   // Irrelevant item, fade it out
                   bgClass = "bg-slate-50 opacity-50";
                }
              }
            } else if (isSelected) {
               containerClass = "border-blue-500 ring-1 ring-blue-200";
            }

            return (
              <button
                key={option.id}
                onClick={() => handleSelect(option.id, option.audioUrl)}
                className={`
                  relative flex flex-col items-center p-4 rounded-xl border-2 
                  transition-all duration-200 text-left group
                  ${containerClass} ${bgClass}
                `}
              >
                {icon}
                
                {/* Image Container */}
                <div className="w-full aspect-square mb-3 rounded-lg overflow-hidden bg-slate-100 relative">
                   <img 
                     src={option.imageUrl} 
                     alt={option.word}
                     className="object-cover w-full h-full transform group-hover:scale-105 transition-transform duration-500"
                   />
                </div>

                {/* Word Label */}
                <div className="flex items-center justify-between w-full">
                  <span className="text-lg font-bold text-slate-700 capitalize">
                    {option.word}
                  </span>
                  {option.audioUrl && (
                    <Volume2 className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Feedback Footer */}
      {hasSubmitted && (
        <div className={`
          p-4 border-t flex items-center justify-between animate-in slide-in-from-bottom-2 fade-in
          ${options.find(o => o.id === selectedId)?.isOddOneOut ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}
        `}>
          <div>
             {options.find(o => o.id === selectedId)?.isOddOneOut ? (
               <div>
                 <p className="text-green-800 font-bold">Correct!</p>
                 <p className="text-green-700 text-xs">That word starts with a different sound.</p>
               </div>
             ) : (
               <div>
                 <p className="text-red-800 font-bold">Try again!</p>
                 <p className="text-red-700 text-xs">That word starts with the same sound as the others.</p>
               </div>
             )}
          </div>
          
          <button
            onClick={handleNext}
            className="flex items-center px-6 py-2 bg-slate-800 text-white text-sm font-semibold rounded-lg hover:bg-slate-900 transition-colors shadow-lg"
          >
            Continue <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        </div>
      )}
    </div>
  );
};

export default SoundSort;