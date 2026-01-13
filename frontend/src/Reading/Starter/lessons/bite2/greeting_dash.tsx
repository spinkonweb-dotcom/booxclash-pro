import React, { useState, useEffect, useRef } from 'react';
import { Clock, Play, Award, RotateCcw, ArrowRight, Zap } from 'lucide-react';

// --- Types ---

export interface DashOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface DashRound {
  id: string;
  imageUrl: string;      // Visual context (Sunrise, Night sky, etc.)
  timeLabel: string;     // The prompt (e.g. "7:00 AM")
  options: DashOption[]; // The choices
}

export interface GreetingDashProps {
  title?: string;
  timePerRound?: number; // ms, default 5000
  rounds?: DashRound[];
  onComplete: (success: boolean) => void;
}

// --- Component ---

const GreetingDash: React.FC<GreetingDashProps> = ({
  title = "Greeting Dash",
  timePerRound = 5000,
  rounds,
  onComplete,
}) => {
  // Game State
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [roundIndex, setRoundIndex] = useState(0);
  const [score, setScore] = useState(0);
  
  // Round State
  const [timeLeft, setTimeLeft] = useState(timePerRound);
  const [roundStatus, setRoundStatus] = useState<'active' | 'success' | 'failure' | 'timeout'>('active');
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);

  const timerRef = useRef<number | null>(null);

  // --- Safety Guard ---
  if (!rounds || rounds.length === 0) {
    return <div className="p-8 text-center text-slate-400">Loading Dash...</div>;
  }

  const currentRound = rounds[roundIndex];

  // --- Timer Logic ---

  useEffect(() => {
    if (!isPlaying || isFinished || roundStatus !== 'active') return;

    const tickRate = 50;
    timerRef.current = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) {
          handleTimeout();
          return 0;
        }
        return prev - tickRate;
      });
    }, tickRate);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, isFinished, roundStatus]);

  // --- Handlers ---

  const handleStart = () => {
    setIsPlaying(true);
    setRoundIndex(0);
    setScore(0);
    setIsFinished(false);
    resetRound();
  };

  const resetRound = () => {
    setTimeLeft(timePerRound);
    setRoundStatus('active');
    setSelectedOptionId(null);
  };

  const handleTimeout = () => {
    setRoundStatus('timeout');
    setTimeout(nextRound, 1000);
  };

  const handleSelect = (option: DashOption) => {
    if (roundStatus !== 'active') return;

    setSelectedOptionId(option.id);
    
    if (option.isCorrect) {
      setScore(s => s + 1);
      setRoundStatus('success');
    } else {
      setRoundStatus('failure');
    }

    // Auto advance
    setTimeout(nextRound, 800); // 0.8s delay to see feedback
  };

  const nextRound = () => {
    if (roundIndex < rounds.length - 1) {
      setRoundIndex(prev => prev + 1);
      resetRound();
    } else {
      finishGame();
    }
  };

  const finishGame = () => {
    setIsFinished(true);
    setIsPlaying(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  // --- Renders ---

  // 1. Start Screen
  if (!isPlaying && !isFinished) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg border-2 border-slate-100 overflow-hidden text-center p-8">
        <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6 text-yellow-600">
          <Zap className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black text-slate-800 mb-2">{title}</h2>
        <p className="text-slate-500 mb-8">
          Look at the time and pick the right greeting before the timer runs out!
        </p>
        <button
          onClick={handleStart}
          className="w-full py-4 bg-yellow-500 hover:bg-yellow-600 text-white font-black text-lg rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          <Play className="w-6 h-6" /> Start Dash
        </button>
      </div>
    );
  }

  // 2. Result Screen
  if (isFinished) {
    const passed = score >= Math.ceil(rounds.length * 0.7);
    return (
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg border-2 border-slate-100 overflow-hidden text-center p-8">
        <h2 className="text-2xl font-bold text-slate-800 mb-6">Dash Complete!</h2>
        
        <div className="flex justify-center mb-6">
          <div className="relative">
            <Award className={`w-24 h-24 ${passed ? 'text-yellow-400' : 'text-slate-300'}`} />
            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xl font-black text-white drop-shadow-md">
              {score}/{rounds.length}
            </span>
          </div>
        </div>

        <p className="text-slate-500 mb-8 font-medium">
          {passed 
            ? "Speedy work! You've mastered greetings." 
            : "Good effort! Try again to get faster."}
        </p>

        <div className="space-y-3">
          <button
            onClick={() => onComplete(passed)}
            className="w-full py-3 bg-slate-800 text-white font-bold rounded-lg hover:bg-slate-900 transition-colors flex items-center justify-center"
          >
            Continue <ArrowRight className="w-4 h-4 ml-2" />
          </button>
          {!passed && (
             <button
             onClick={handleStart}
             className="w-full py-3 text-slate-500 font-bold rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-center"
           >
             <RotateCcw className="w-4 h-4 ml-2 mr-2" /> Try Again
           </button>
          )}
        </div>
      </div>
    );
  }

  // 3. Gameplay Screen
  const progressPercent = (timeLeft / timePerRound) * 100;
  let timerColor = 'bg-green-500';
  if (progressPercent < 50) timerColor = 'bg-yellow-500';
  if (progressPercent < 20) timerColor = 'bg-red-600';

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-xl overflow-hidden font-sans border border-slate-200">
      
      {/* Timer Bar */}
      <div className="h-3 w-full bg-slate-100">
        <div 
          className={`h-full transition-all duration-75 ease-linear ${timerColor}`} 
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Hero Image Section */}
      <div className="relative h-56 bg-slate-900 overflow-hidden">
        <img 
          src={currentRound.imageUrl} 
          alt="Time context" 
          className="w-full h-full object-cover opacity-80"
        />
        
        {/* Time Stamp Overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center drop-shadow-lg">
          <div className="bg-black/40 backdrop-blur-sm px-6 py-3 rounded-2xl border border-white/20 flex items-center gap-3">
            <Clock className="w-8 h-8 text-white" />
            <span className="text-4xl font-black text-white tracking-widest">
              {currentRound.timeLabel}
            </span>
          </div>
        </div>

        {/* HUD */}
        <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md border border-white/10">
          {score} pts
        </div>
      </div>

      {/* Interaction Zone */}
      <div className="p-6 bg-slate-50">
        <div className="grid grid-cols-1 gap-3">
          {currentRound.options.map((option) => {
            const isSelected = selectedOptionId === option.id;
            
            // Button Styling Logic
            let btnClass = "bg-white border-b-4 border-slate-200 text-slate-700 hover:border-blue-300 hover:translate-y-[1px]";
            
            if (roundStatus !== 'active') {
              if (option.isCorrect) {
                 // Always reveal correct answer at end of round
                 btnClass = "bg-green-500 border-green-700 text-white shadow-md";
              } else if (isSelected && !option.isCorrect) {
                 // Highlight user error
                 btnClass = "bg-red-500 border-red-700 text-white opacity-80";
              } else {
                 // Fade others
                 btnClass = "bg-slate-100 border-slate-200 text-slate-300";
              }
            }

            return (
              <button
                key={option.id}
                onClick={() => handleSelect(option)}
                disabled={roundStatus !== 'active'}
                className={`
                  w-full py-4 text-xl font-bold rounded-xl transition-all duration-100
                  ${btnClass}
                  ${roundStatus === 'active' ? 'active:border-b-0 active:translate-y-1' : ''}
                `}
              >
                {option.text}
              </button>
            );
          })}
        </div>
        
        {/* Status Message */}
        <div className="h-6 mt-4 text-center text-sm font-bold uppercase tracking-widest">
           {roundStatus === 'timeout' && <span className="text-red-500 animate-pulse">Time's Up!</span>}
           {roundStatus === 'failure' && <span className="text-red-500">Oops!</span>}
           {roundStatus === 'success' && <span className="text-green-500">Fast!</span>}
        </div>
      </div>
    </div>
  );
};

export default GreetingDash;