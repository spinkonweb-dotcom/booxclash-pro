import React, { useState, useRef, useEffect } from 'react';
import { Volume2, CheckCircle, XCircle, Play, ArrowRight } from 'lucide-react';

// --- Types ---

export interface MinimalPairOption {
  id: string;
  word: string;     
  imageUrl: string; 
  isCorrect: boolean; 
}

export interface PhonemeMatchProps {
  title?: string;
  instruction?: string;
  audioUrl: string; 
  // Allow options to be undefined initially to prevent crashes
  options?: [MinimalPairOption, MinimalPairOption] | MinimalPairOption[]; 
  onComplete: (success: boolean) => void;
}

// --- Component ---

const PhonemeMatch1: React.FC<PhonemeMatchProps> = ({
  title = "Phoneme Match",
  instruction = "Listen to the word and select the matching image.",
  audioUrl,
  options,
  onComplete,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // --- SAFETY GUARD: Prevent crash if options are missing ---
  if (!options || options.length < 2) {
    return (
      <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-300">
        <p>Loading activity data...</p>
      </div>
    );
  }
  // --------------------------------------------------------

  // Initialize Audio
  useEffect(() => {
    // Only create audio if url is provided
    if (!audioUrl) return;

    audioRef.current = new Audio(audioUrl);
    
    const handleEnded = () => setIsPlaying(false);
    audioRef.current.addEventListener('ended', handleEnded);

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeEventListener('ended', handleEnded);
      }
    };
  }, [audioUrl]);

  const handlePlayAudio = () => {
    if (audioRef.current) {
      setIsPlaying(true);
      audioRef.current.play().catch(e => console.error("Audio play failed:", e));
    }
  };

  const handleSelect = (optionId: string) => {
    if (hasSubmitted) return; 

    setSelectedId(optionId);
    setHasSubmitted(true);

    // We know options exists here due to the Safety Guard above
    
    // Optional: Play feedback sound here
  };

  const handleNext = () => {
    const selectedOption = options.find((opt) => opt.id === selectedId);
    onComplete(selectedOption?.isCorrect || false);
    setSelectedId(null);
    setHasSubmitted(false);
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg overflow-hidden border border-slate-200 font-sans">
      {/* Header */}
      <div className="bg-slate-50 p-6 text-center border-b border-slate-100">
        <h2 className="text-xl font-bold text-slate-800">{title}</h2>
        <p className="text-slate-500 text-sm mt-1">{instruction}</p>
      </div>

      <div className="p-6 space-y-8">
        {/* Audio Player Control */}
        <div className="flex justify-center">
          <button
            onClick={handlePlayAudio}
            disabled={isPlaying}
            className={`
              flex items-center justify-center w-20 h-20 rounded-full 
              transition-all duration-300 shadow-md
              ${isPlaying 
                ? 'bg-blue-100 text-blue-500 scale-105' 
                : 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-110 active:scale-95'
              }
            `}
            aria-label="Play word audio"
          >
            {isPlaying ? (
              <Volume2 className="w-10 h-10 animate-pulse" />
            ) : (
              <Play className="w-10 h-10 ml-1" />
            )}
          </button>
        </div>

        {/* Minimal Pair Options (The Grid) */}
        <div className="grid grid-cols-2 gap-4">
          {options.map((option) => {
            const isSelected = selectedId === option.id;
            
            // Determine styles based on state
            let borderClass = "border-slate-200 hover:border-blue-400";
            let bgClass = "bg-white hover:bg-slate-50";
            let icon = null;

            if (hasSubmitted) {
              if (isSelected && option.isCorrect) {
                borderClass = "border-green-500 ring-2 ring-green-200";
                bgClass = "bg-green-50";
                icon = <CheckCircle className="text-green-600 w-6 h-6 absolute top-2 right-2" />;
              } else if (isSelected && !option.isCorrect) {
                borderClass = "border-red-500 ring-2 ring-red-200";
                bgClass = "bg-red-50";
                icon = <XCircle className="text-red-600 w-6 h-6 absolute top-2 right-2" />;
              } else if (!isSelected && option.isCorrect) {
                borderClass = "border-green-300 border-dashed";
                bgClass = "bg-green-50/50 opacity-70";
              } else {
                bgClass = "bg-slate-50 opacity-50";
              }
            } else if (isSelected) {
               borderClass = "border-blue-500 ring-1 ring-blue-200";
            }

            return (
              <button
                key={option.id}
                onClick={() => handleSelect(option.id)}
                disabled={hasSubmitted}
                className={`
                  relative flex flex-col items-center p-4 rounded-xl border-2 
                  transition-all duration-200 cursor-pointer
                  ${borderClass} ${bgClass}
                `}
              >
                {icon}
                <div className="w-24 h-24 mb-3 relative rounded-md overflow-hidden bg-slate-200">
                  <img 
                    src={option.imageUrl} 
                    alt={option.word} 
                    className="object-cover w-full h-full"
                  />
                </div>
                <span className="text-lg font-medium text-slate-700">
                  {option.word}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Feedback & Navigation Footer */}
      {hasSubmitted && (
        <div className={`
          p-4 border-t flex items-center justify-between animate-in slide-in-from-bottom-2 fade-in
          ${options.find(o => o.id === selectedId)?.isCorrect ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}
        `}>
          <div className="text-sm font-medium">
             {options.find(o => o.id === selectedId)?.isCorrect ? (
               <span className="text-green-800">Correct! Well done.</span>
             ) : (
               <span className="text-red-800">Not quite. Try focusing on the vowel length.</span>
             )}
          </div>
          
          <button
            onClick={handleNext}
            className="flex items-center px-4 py-2 bg-slate-800 text-white text-sm font-semibold rounded-lg hover:bg-slate-900 transition-colors"
          >
            Continue <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        </div>
      )}
    </div>
  );
};

export default PhonemeMatch1;