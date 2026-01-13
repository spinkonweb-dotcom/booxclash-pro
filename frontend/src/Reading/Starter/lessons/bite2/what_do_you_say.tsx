import React, { useState } from 'react';
import { Clock, MapPin, ArrowRight, MessageCircle, User, Check, X } from 'lucide-react';

// --- Types ---

export interface DialogueOption {
  id: string;
  text: string;        // e.g., "Good evening"
  isCorrect: boolean;  
  feedback: string;    // e.g., "Correct! It's morning." or "Not quite, it's 8 AM."
}

export interface Scenario {
  id: string;
  timeLabel: string;   // e.g., "8:00 AM"
  locationLabel: string; // e.g., "Classroom"
  situationText: string; // e.g., "You walk into class and see your teacher."
  avatarUrl?: string;    // Optional: Image of the person you are talking to
  options: DialogueOption[];
}

export interface WhatDoYouSayProps {
  title?: string;
  scenarios: Scenario[];
  onComplete: (success: boolean) => void;
}

// --- Component ---

const WhatDoYouSay: React.FC<WhatDoYouSayProps> = ({
  title = "What Do You Say?",
  scenarios,
  onComplete,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Safety Guard
  if (!scenarios || scenarios.length === 0) {
    return <div className="p-8 text-center text-slate-400">Loading scenarios...</div>;
  }

  const currentScenario = scenarios[currentIndex];
  const isLastSlide = currentIndex === scenarios.length - 1;

  // --- Handlers ---

  const handleSelect = (option: DialogueOption) => {
    if (hasSubmitted) return;
    
    setSelectedOptionId(option.id);
    setHasSubmitted(true);
  };

  const handleNext = () => {
    if (isLastSlide) {
      onComplete(true);
    } else {
      // Reset for next slide
      setSelectedOptionId(null);
      setHasSubmitted(false);
      setCurrentIndex(prev => prev + 1);
    }
  };

  // Helper to find selected option data for the footer
  const selectedOptionData = currentScenario.options.find(o => o.id === selectedOptionId);

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden font-sans flex flex-col min-h-[500px]">
      
      {/* Header */}
      <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
        <h2 className="font-bold text-slate-800">{title}</h2>
        <div className="text-xs font-bold bg-slate-200 text-slate-600 px-2 py-1 rounded-md">
          {currentIndex + 1} / {scenarios.length}
        </div>
      </div>

      {/* --- SCENE CONTEXT CARD --- */}
      <div className="bg-slate-900 text-white p-6 pb-12 relative">
        {/* Context Tags */}
        <div className="flex gap-4 mb-4 text-xs font-bold uppercase tracking-wider text-slate-400">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4 text-blue-400" /> {currentScenario.timeLabel}
          </div>
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4 text-green-400" /> {currentScenario.locationLabel}
          </div>
        </div>

        {/* The Situation Text */}
        <p className="text-lg font-medium leading-relaxed">
          {currentScenario.situationText}
        </p>

        {/* Avatar (Person you are talking to) */}
        <div className="absolute -bottom-8 right-6">
          <div className="w-20 h-20 rounded-full border-4 border-white bg-slate-200 overflow-hidden shadow-lg">
             {currentScenario.avatarUrl ? (
               <img src={currentScenario.avatarUrl} alt="Person" className="w-full h-full object-cover" />
             ) : (
               <div className="w-full h-full flex items-center justify-center bg-slate-300">
                 <User className="w-10 h-10 text-slate-500" />
               </div>
             )}
          </div>
        </div>
      </div>

      {/* --- INTERACTION AREA --- */}
      <div className="flex-1 p-6 pt-12 bg-white">
        <div className="space-y-3">
          {currentScenario.options.map((option) => {
            const isSelected = selectedOptionId === option.id;
            
            // Style Logic
            let containerClass = "border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50 text-slate-700";
            let icon = <MessageCircle className="w-5 h-5 text-slate-400" />;

            if (hasSubmitted) {
              if (isSelected && option.isCorrect) {
                // User picked Correct
                containerClass = "border-green-500 bg-green-50 text-green-800 ring-1 ring-green-500";
                icon = <Check className="w-5 h-5 text-green-600" />;
              } else if (isSelected && !option.isCorrect) {
                // User picked Wrong
                containerClass = "border-red-500 bg-red-50 text-red-800 ring-1 ring-red-500";
                icon = <X className="w-5 h-5 text-red-600" />;
              } else if (!isSelected && option.isCorrect) {
                 // Show the correct answer they missed
                 containerClass = "border-green-200 bg-green-50/50 text-slate-400 opacity-70";
              } else {
                 // Fade out others
                 containerClass = "opacity-40 border-slate-100";
              }
            } else if (isSelected) {
               containerClass = "border-blue-500 bg-blue-50 ring-1 ring-blue-200";
            }

            return (
              <button
                key={option.id}
                onClick={() => handleSelect(option)}
                disabled={hasSubmitted}
                className={`
                  w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all duration-200
                  ${containerClass}
                  ${!hasSubmitted ? 'active:scale-98' : ''}
                `}
              >
                <div className="shrink-0">{icon}</div>
                <span className="font-bold text-lg">"{option.text}"</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* --- FEEDBACK FOOTER --- */}
      {hasSubmitted && (
        <div className={`
          p-4 border-t flex flex-col gap-3 animate-in slide-in-from-bottom-2
          ${selectedOptionData?.isCorrect ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}
        `}>
          <div className="flex gap-3">
            <div className={`mt-1 p-1 rounded-full h-fit ${selectedOptionData?.isCorrect ? 'bg-green-200 text-green-700' : 'bg-red-200 text-red-700'}`}>
               {selectedOptionData?.isCorrect ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
            </div>
            <div>
              <p className={`font-bold ${selectedOptionData?.isCorrect ? 'text-green-800' : 'text-red-800'}`}>
                {selectedOptionData?.isCorrect ? "Excellent!" : "Not quite."}
              </p>
              <p className="text-sm text-slate-600">
                {selectedOptionData?.feedback}
              </p>
            </div>
          </div>

          <button
            onClick={handleNext}
            className="w-full mt-2 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg flex items-center justify-center transition-colors"
          >
            {isLastSlide ? "Finish Lesson" : "Continue"} <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        </div>
      )}

    </div>
  );
};

export default WhatDoYouSay;