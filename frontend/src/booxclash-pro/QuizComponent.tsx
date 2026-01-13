"use client";

import { useState } from 'react';
import { CheckCircle, XCircle, Trophy, ArrowRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- TYPES ---
interface Question {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
}

interface QuizData {
  title?: string;
  questions: Question[];
}

export interface Mistake {
  question: string;
  userAnswer: string;
  correctAnswer: string;
}

interface QuizProps {
  data: QuizData;
  onComplete: (score: number, total: number, mistakes: Mistake[]) => void;
  onReward?: (amount: number, streak: boolean) => void;
  onMistake?: () => void;
  onClose: () => void;
}

export default function QuizComponent({ data, onComplete, onReward, onMistake, onClose }: QuizProps) {
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [isAnswered, setIsAnswered] = useState(false);
  
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [combo, setCombo] = useState(0);

  // ✅ NEW: Handle Close logic
  // This ensures that if the user closes early, we still send whatever mistakes 
  // they made so far to the AI for analysis.
  const handleSafeClose = () => {
    if (onComplete) {
        // Send current progress even if incomplete
        onComplete(score, data.questions.length, mistakes);
    }
    onClose();
  };

  if (!data || !data.questions || data.questions.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-4">
            <p>No questions available.</p>
            <button onClick={onClose} className="text-white bg-slate-800 px-4 py-2 rounded-lg">Close</button>
        </div>
    );
  }

  const currentQ = data.questions[currentQIndex];

  const handleOptionClick = (option: string) => {
    if (isAnswered) return;
    
    setSelectedOption(option);
    setIsAnswered(true);

    const isCorrect = option === currentQ.correctAnswer;
    
    if (isCorrect) {
      const newCombo = combo + 1;
      setCombo(newCombo);
      setScore(s => s + 1);

      const xpAmount = 20 + (newCombo > 1 ? (newCombo * 5) : 0);
      if (onReward) onReward(xpAmount, true);

    } else {
      setCombo(0);
      if (onMistake) onMistake();
      
      setMistakes(prev => [...prev, {
          question: currentQ.question,
          userAnswer: option,
          correctAnswer: currentQ.correctAnswer
      }]);
    }

    // Auto-advance
    setTimeout(() => {
      if (currentQIndex < data.questions.length - 1) {
        setCurrentQIndex((prev) => prev + 1);
        setSelectedOption(null);
        setIsAnswered(false);
      } else {
        finishQuiz(isCorrect ? score + 1 : score);
      }
    }, 1800);
  };

  const finishQuiz = (finalScore: number) => {
      setShowResult(true);
      if (onComplete) {
          onComplete(finalScore, data.questions.length, mistakes);
      }
  };

  // --- RESULT SCREEN ---
  if (showResult) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-white p-6 text-center animate-in fade-in zoom-in duration-500 relative overflow-hidden">
        {/* Close triggers the safe close (redundant here but good for consistency) */}
        <button 
            onClick={handleSafeClose} 
            className="absolute top-4 right-4 p-2 bg-slate-800/50 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-full transition-all z-50"
        >
            <X size={24} />
        </button>

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-900 to-slate-900 -z-10" />
        
        <div className="relative mb-8">
             <div className="absolute inset-0 bg-yellow-500 blur-3xl opacity-20 rounded-full animate-pulse" />
             <Trophy className="relative w-32 h-32 text-yellow-400 drop-shadow-2xl" />
        </div>
        
        <h2 className="text-4xl font-black mb-2 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-yellow-200 to-yellow-500">
            QUEST COMPLETE
        </h2>
        
        <div className="flex flex-col items-center justify-center bg-slate-800/80 backdrop-blur-md p-8 rounded-3xl border border-slate-700 w-full max-w-xs mb-8 shadow-xl">
            <div className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 mb-2">
            {score}
            <span className="text-3xl text-slate-500 font-bold ml-2">/ {data.questions.length}</span>
            </div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest bg-slate-900 px-3 py-1 rounded-full border border-slate-800">Final Score</div>
        </div>
        
        {mistakes.length > 0 ? (
            <div className="text-sm text-red-300 animate-pulse bg-red-900/20 px-4 py-2 rounded-lg border border-red-500/30">
                Sending {mistakes.length} mistakes to AI for review...
            </div>
        ) : (
            <div className="text-sm text-emerald-300 animate-pulse bg-emerald-900/20 px-4 py-2 rounded-lg border border-emerald-500/30">
                Perfect Score! Telling AI to advance lesson...
            </div>
        )}

        <button onClick={handleSafeClose} className="mt-8 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 px-8 rounded-full transition-colors flex items-center gap-2">
            Close Results <ArrowRight size={16} />
        </button>
      </div>
    );
  }

  // --- QUESTION SCREEN ---
  return (
    <div className="h-full flex flex-col justify-center max-w-2xl mx-auto p-6 text-white relative">
      
      {/* ✅ UPDATED CLOSE BUTTON: Uses handleSafeClose */}
      <button 
        onClick={handleSafeClose}
        className="absolute top-0 right-0 p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-full transition-all"
        title="Close Quiz"
      >
        <X size={24} />
      </button>

      {/* Combo Indicator */}
      <AnimatePresence>
        {combo > 1 && (
            <motion.div 
                initial={{ scale: 0, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0 }}
                className="absolute top-2 right-12 bg-gradient-to-r from-orange-500 to-red-600 text-white text-xs font-black italic px-3 py-1 rounded-full shadow-lg z-10 rotate-3 border border-white/20"
            >
                {combo}x COMBO!
            </motion.div>
        )}
      </AnimatePresence>

      {/* Progress Bar */}
      <div className="mb-6 mt-8">
         <div className="flex justify-between items-end mb-2">
            <span className="text-[10px] font-black tracking-[0.2em] text-blue-400 uppercase">
                QUESTION {currentQIndex + 1} / {data.questions.length}
            </span>
         </div>
         <div className="w-full bg-slate-800/50 h-1.5 rounded-full overflow-hidden">
            <motion.div 
                className="bg-blue-500 h-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                initial={{ width: 0 }}
                animate={{ width: `${((currentQIndex + 1) / data.questions.length) * 100}%` }}
                transition={{ duration: 0.5 }}
            />
         </div>
      </div>

      {/* Question */}
      <h3 className="text-2xl font-bold mb-8 leading-tight drop-shadow-sm">
        {currentQ.question}
      </h3>

      {/* Options */}
      <div className="grid gap-3">
        {currentQ.options.map((option, idx) => {
          const isSelected = selectedOption === option;
          const isCorrect = option === currentQ.correctAnswer;
          
          let buttonStyle = "bg-slate-800/80 border-slate-700/50 hover:bg-slate-700/80 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10";
          
          if (isAnswered) {
             if (isCorrect) {
                 buttonStyle = "bg-emerald-500/20 border-emerald-500 text-emerald-100 shadow-[0_0_15px_rgba(16,185,129,0.3)]";
             } else if (isSelected && !isCorrect) {
                 buttonStyle = "bg-red-500/20 border-red-500 text-red-100 opacity-50";
             } else {
                 buttonStyle = "bg-slate-800/30 border-slate-700/30 opacity-30 blur-[1px]";
             }
          } else if (isSelected) {
            buttonStyle = "bg-blue-600 border-blue-500";
          }

          return (
            <motion.button
              key={idx}
              whileHover={!isAnswered ? { scale: 1.02, x: 4 } : {}}
              whileTap={!isAnswered ? { scale: 0.98 } : {}}
              onClick={() => handleOptionClick(option)}
              disabled={isAnswered}
              className={`p-4 rounded-2xl border-2 text-left font-medium transition-all duration-200 flex justify-between items-center group relative overflow-hidden ${buttonStyle}`}
            >
              <div className="flex items-center gap-4 z-10 relative">
                  <span className={`flex items-center justify-center w-8 h-8 rounded-lg text-sm font-black shadow-inner ${isAnswered && isCorrect ? 'bg-emerald-500 text-white' : 'bg-slate-900/50 text-slate-400'}`}>
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="font-semibold">{option}</span>
              </div>
              
              {isAnswered && isCorrect && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="bg-emerald-500 rounded-full p-1">
                      <CheckCircle className="text-white" size={18} strokeWidth={3} />
                  </motion.div>
              )}
              {isAnswered && isSelected && !isCorrect && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                      <XCircle className="text-red-400" size={24} />
                  </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}