import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Timer, Award, ArrowRight } from 'lucide-react';

// --- Types ---

export interface DashRound {
  id: string;
  audioUrl: string;      // The sound to identify (e.g., "/m/")
  correctLetter: string; // The correct answer (e.g., "M")
  distractors: string[]; // Wrong answers (e.g., ["S", "T"])
}

export interface PhonicsDashProps {
  title?: string;
  timePerRound?: number; // milliseconds, default 5000 (5s)
  rounds?: DashRound[];
  onComplete: (success: boolean) => void;
}

// --- Component ---

const PhonicsDash: React.FC<PhonicsDashProps> = ({
  title = "Phonics Dash",
  timePerRound = 5000,
  rounds,
  onComplete,
}) => {
  // Game State
  const [isPlaying, setIsPlaying] = useState(false); // Has the game started?
  const [roundIndex, setRoundIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  // Round State
  const [timeLeft, setTimeLeft] = useState(timePerRound);
  const [shuffledOptions, setShuffledOptions] = useState<string[]>([]);
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [roundStatus, setRoundStatus] = useState<'active' | 'success' | 'failure' | 'timeout'>('active');

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<number | null>(null);

  // --- Safety Guard ---
  if (!rounds || rounds.length === 0) {
    return <div className="p-8 text-center text-slate-400">Loading Dash...</div>;
  }

  const currentRound = rounds[roundIndex];

  // --- Helpers ---

  // Shuffle letters (Fisher-Yates shuffle)
  const shuffle = (array: string[]) => {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
  };

  const playAudio = useCallback(() => {
    if (!currentRound) return;
    if (audioRef.current) audioRef.current.pause();
    
    audioRef.current = new Audio(currentRound.audioUrl);
    audioRef.current.play().catch(e => console.error("Audio play failed", e));
  }, [currentRound]);

  // --- Game Logic ---

  // 1. Setup Round
  useEffect(() => {
    if (isPlaying && !isFinished && currentRound) {
      // Prepare options
      const options = shuffle([currentRound.correctLetter, ...currentRound.distractors]);
      setShuffledOptions(options);
      
      // Reset state
      setSelectedLetter(null);
      setRoundStatus('active');
      setTimeLeft(timePerRound);
      
      // Play sound
      playAudio();
    }
  }, [roundIndex, isPlaying, isFinished, currentRound, timePerRound, playAudio]);

  // 2. Timer Loop
  useEffect(() => {
    if (!isPlaying || isFinished || roundStatus !== 'active') return;

    const tickRate = 50; // Update every 50ms
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

  // 3. Handlers

  const handleStart = () => {
    setIsPlaying(true);
  };

  const handleTimeout = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setRoundStatus('timeout');
    
    // Auto advance after short delay
    setTimeout(() => nextRound(), 1500);
  };

  const handleSelect = (letter: string) => {
    if (roundStatus !== 'active') return; // Prevent double clicking
    if (timerRef.current) clearInterval(timerRef.current); // Stop timer

    setSelectedLetter(letter);

    if (letter === currentRound.correctLetter) {
      setScore(s => s + 1);
      setRoundStatus('success');
    } else {
      setRoundStatus('failure');
    }

    // Auto advance
    setTimeout(() => nextRound(), 1000);
  };

  const nextRound = () => {
    if (roundIndex < rounds.length - 1) {
      setRoundIndex(prev => prev + 1);
    } else {
      finishGame();
    }
  };

  const finishGame = () => {
    setIsFinished(true);
    // You might want to define "success" as getting > 80% correct
    const passed = score >= Math.ceil(rounds.length * 0.7); 
    onComplete(passed);
  };

  // --- Renders ---

  // 1. Start Screen
  if (!isPlaying) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8 text-center border-2 border-indigo-100">
        <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6 text-indigo-600">
          <Timer className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black text-slate-800 mb-2">{title}</h2>
        <p className="text-slate-500 mb-8">
          Listen to the sound and click the matching letter before time runs out!
        </p>
        <button
          onClick={handleStart}
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-95 text-lg flex items-center justify-center"
        >
          <Play className="w-5 h-5 mr-2" /> Start Speed Round
        </button>
      </div>
    );
  }

  // 2. Finished Screen
  if (isFinished) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8 text-center border-2 border-slate-100">
        <h2 className="text-2xl font-bold text-slate-800 mb-6">Round Complete!</h2>
        <div className="flex justify-center mb-6">
          <div className="relative">
            <Award className="w-24 h-24 text-yellow-400" />
            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xl font-black text-yellow-700">
              {score}/{rounds.length}
            </span>
          </div>
        </div>
        <p className="text-slate-500 mb-8">
          You identified {score} sounds correctly.
        </p>
        <button
          onClick={() => onComplete(true)} // Or handle replay
          className="w-full py-3 bg-slate-800 text-white font-bold rounded-lg hover:bg-slate-900 transition-colors flex items-center justify-center"
        >
          Finish Lesson <ArrowRight className="w-4 h-4 ml-2" />
        </button>
      </div>
    );
  }

  // 3. Gameplay Screen
  const progressPercent = (timeLeft / timePerRound) * 100;
  let timerColor = 'bg-green-500';
  if (progressPercent < 60) timerColor = 'bg-yellow-500';
  if (progressPercent < 30) timerColor = 'bg-red-500';

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg overflow-hidden border border-slate-200 font-sans">
      
      {/* Timer Bar */}
      <div className="h-2 w-full bg-slate-100">
        <div 
          className={`h-full transition-all duration-75 ease-linear ${timerColor}`} 
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="p-6">
        {/* HUD */}
        <div className="flex justify-between items-center mb-8 text-sm font-bold text-slate-400 uppercase tracking-widest">
          <span>Question {roundIndex + 1}/{rounds.length}</span>
          <span>Score: {score}</span>
        </div>

        {/* Audio Replay */}
        <div className="flex justify-center mb-10">
          <button
            onClick={playAudio}
            className="w-20 h-20 bg-indigo-50 hover:bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 transition-colors ring-4 ring-indigo-50/50"
          >
            <Play className="w-8 h-8 ml-1" />
          </button>
        </div>

        {/* Options Grid */}
        <div className="grid grid-cols-3 gap-4">
          {shuffledOptions.map((letter, idx) => {
            let btnClass = "bg-white border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-indigo-50";
            
            // Logic for coloring buttons after selection
            if (roundStatus !== 'active') {
              if (letter === currentRound.correctLetter) {
                // Always highlight the correct one at the end
                btnClass = "bg-green-500 border-green-600 text-white shadow-md scale-105";
              } else if (letter === selectedLetter && selectedLetter !== currentRound.correctLetter) {
                // Highlight the wrong one if user clicked it
                btnClass = "bg-red-500 border-red-600 text-white opacity-50";
              } else {
                // Fade out others
                btnClass = "bg-slate-50 border-slate-100 text-slate-300";
              }
            }

            return (
              <button
                key={idx}
                onClick={() => handleSelect(letter)}
                disabled={roundStatus !== 'active'}
                className={`
                  h-24 text-4xl font-black rounded-xl border-b-4 border-2 transition-all duration-200
                  ${btnClass}
                  active:border-b-0 active:translate-y-1
                `}
              >
                {letter}
              </button>
            );
          })}
        </div>
        
        {/* Status Text */}
        <div className="h-8 mt-6 text-center">
            {roundStatus === 'timeout' && <span className="text-red-500 font-bold animate-pulse">Time's Up!</span>}
            {roundStatus === 'success' && <span className="text-green-500 font-bold">Fast!</span>}
        </div>
      </div>
    </div>
  );
};

export default PhonicsDash;