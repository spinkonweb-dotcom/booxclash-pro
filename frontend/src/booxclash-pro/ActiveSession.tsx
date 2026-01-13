import React, { useRef, useEffect, useState } from 'react';
import { 
  Mic, Loader2, Square, 
  ImageIcon, X, Flame
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useClassroom } from './hooks/useClassroom';
import ExamPaper from './ExamPaper';
import { BuilderActivity } from './BuilderActivity'; 
import QuizComponent from './QuizComponent';

/* =====================
   Types
===================== */

interface StudentProfile {
  name: string;
  grade: string;
  country?: string;
  subject: string;
}

type Mode = 'tutor' | 'exam';

interface ActiveSessionProps {
  systemPrompt: string;
  signedUrl: string;
  studentProfile: StudentProfile;
  mode: Mode;
  onExit: () => void;
}

interface Reward {
  id: number;
  amount: number;
}

// Auto-detect API Base for Quiz submission
const API_BASE =
  import.meta.env?.VITE_API_BASE ||
  (window.location.hostname === 'localhost'
    ? 'http://localhost:8000'
    : 'https://booxclash-pro.onrender.com');

/* =====================
   Gamified HUD
===================== */
const GameHUD: React.FC<{
  level: number;
  xp: number;
  xpToNextLevel: number;
  streak: number;
  latestReward: Reward | null;
}> = ({ level, xp, xpToNextLevel, streak, latestReward }) => (
  <div className="flex items-center justify-between bg-slate-900/80 backdrop-blur-md p-3 rounded-2xl border border-slate-700 mb-4 shadow-lg sticky top-0 z-50">
    <div className="flex items-center gap-4 flex-1">
      <div className="relative">
        <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-600 rounded-xl flex items-center justify-center font-black text-xl text-white shadow-lg rotate-3 border-2 border-white/20">
          {level}
        </div>
        <div className="absolute -bottom-2 -right-2 bg-slate-900 text-[10px] px-2 py-0.5 rounded-full border border-slate-600 font-bold uppercase text-slate-400">
          Lvl
        </div>
      </div>

      <div className="flex-1 max-w-md">
        <div className="flex justify-between text-xs font-bold text-slate-400 mb-1">
          <span>XP Progress</span>
          <span>{xp} / {xpToNextLevel}</span>
        </div>
        <div className="h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50 relative">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${(xp / xpToNextLevel) * 100}%` }}
            transition={{ type: "spring", bounce: 0, duration: 0.8 }}
            className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
          />
          <div className="absolute inset-0 bg-white/10 w-full animate-[shimmer_2s_infinite] -skew-x-12" />
        </div>
      </div>
    </div>

    <div className="flex items-center gap-4">
      <AnimatePresence>
        {latestReward && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            key={latestReward.id}
            className="text-emerald-400 font-bold text-sm flex items-center gap-1"
          >
            +{latestReward.amount} XP
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${streak > 2 ? 'bg-orange-500/10 border-orange-500/50 text-orange-400' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
        <Flame className={`w-5 h-5 ${streak > 2 ? 'animate-pulse fill-orange-500' : ''}`} />
        <div className="flex flex-col leading-none">
          <span className="font-black text-lg">{streak}</span>
          <span className="text-[10px] uppercase font-bold opacity-70">Streak</span>
        </div>
      </div>
    </div>
  </div>
);

/* =====================
   Main Component
===================== */

const ActiveSession: React.FC<ActiveSessionProps> = ({
  systemPrompt,
  signedUrl,
  studentProfile,
  mode,
  onExit
}) => {
  const {
    status,
    notes,
    activeTool,
    setActiveTool,
    endSession,
    sendText, 
  } = useClassroom(studentProfile, mode, signedUrl, systemPrompt);

  const notesEndRef = useRef<HTMLDivElement | null>(null);

  /* --- Game state --- */
  const [xp, setXp] = useState<number>(120);
  const [level, setLevel] = useState<number>(3);
  const [streak, setStreak] = useState<number>(0);
  const [latestReward, setLatestReward] = useState<Reward | null>(null);

  // --- NEW: Image Loading State ---
  const [isImageLoading, setIsImageLoading] = useState(true);

  // Reset image loading state whenever the active tool changes
  useEffect(() => {
    if (activeTool?.type === 'image') {
      setIsImageLoading(true);
    }
  }, [activeTool]);

  const xpToNextLevel = level * 100 + 150;

  const handleReward = (amount: number, isStreakIncrement: boolean = true) => {
    setXp(prev => {
      const newTotal = prev + amount;
      if (newTotal >= xpToNextLevel) {
        setLevel(l => l + 1);
        return newTotal - xpToNextLevel;
      }
      return newTotal;
    });
    if (isStreakIncrement) setStreak(s => s + 1);

    const rewardId = Date.now();
    setLatestReward({ id: rewardId, amount });
    setTimeout(() => setLatestReward(null), 2000);
  };

  const handleMistake = () => setStreak(0);

  const handleQuizCompletion = async (
    score: number,
    total: number,
    mistakes: any[]
  ) => {
    handleReward(score * 50, false);

    const payload = {
      topic: studentProfile.subject || "General Knowledge",
      grade: studentProfile.grade || "8",
      score,
      total_questions: total,
      mistakes
    };

    try {
      const response = await fetch(`${API_BASE}/api/v1/submit-quiz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      console.log("✅ Backend Response:", data);

      if (sendText && data.feedback) {
        sendText(`SYSTEM_INSTRUCTION: The student just finished the quiz. Feedback: "${data.feedback}". Please present this feedback to the student.`);
      }

    } catch (error) {
      console.error("❌ Failed to submit quiz:", error);
      sendText?.(`SYSTEM_INSTRUCTION: Student finished quiz with score ${score}/${total}. Backend analysis failed.`);
    }
  };

  useEffect(() => {
    notesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [notes]);

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white p-4 md:p-6 font-sans flex flex-col md:flex-row gap-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0B0F19] to-black">
      {/* LEFT PANEL */}
      <div className="w-full md:w-[45%] lg:w-[40%] flex flex-col relative h-[500px] md:h-auto">
        <GameHUD level={level} xp={xp} xpToNextLevel={xpToNextLevel} streak={streak} latestReward={latestReward} />

        <div className="flex-1 bg-slate-900/50 backdrop-blur-sm rounded-3xl border border-slate-800 shadow-2xl overflow-hidden relative flex flex-col ring-1 ring-white/5">
          
          {/* --- ACTIVE TOOL VIEW SWITCHER --- */}
          {activeTool?.type === 'exam' ? (
            <ExamPaper questions={activeTool.data} onClose={() => setActiveTool(null)} />
          
          ) : activeTool?.type === 'image' ? (
            <div className="absolute inset-0 bg-black/95 z-20 flex flex-col animate-in fade-in zoom-in-95 duration-300">
              <button 
                onClick={() => setActiveTool(null)} 
                className="absolute top-4 right-4 p-2 bg-slate-800/80 text-white rounded-full hover:bg-red-500 transition-colors z-50 backdrop-blur-md"
              >
                <X size={20}/>
              </button>
              
              {/* IMAGE CONTAINER */}
              <div className="flex-1 flex items-center justify-center p-6 relative">
                
                {/* 🌀 LOADING SPINNER */}
                {isImageLoading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10">
                    <Loader2 size={48} className="animate-spin text-blue-500" />
                    <span className="text-blue-400 font-medium animate-pulse text-sm">Rendering Visual...</span>
                  </div>
                )}

                <img 
                  // ✅ FIX 1: Check both 'image' and 'url' keys
                  src={activeTool.data?.image || activeTool.data?.url} 
                  alt="Educational Visual"
                  
                  // ✅ FIX 2: Stop spinner on success
                  onLoad={() => {
                    console.log("✅ Image loaded successfully");
                    setIsImageLoading(false);
                  }}
                  
                  // ✅ FIX 3: Stop spinner on error (prevents infinite loading)
                  onError={(e) => {
                    console.error("❌ Image failed to load", e);
                    setIsImageLoading(false);
                  }}
                  
                  className={`rounded-xl shadow-2xl border border-slate-700 max-h-full max-w-full object-contain transition-all duration-700 ${
                    isImageLoading ? 'opacity-0 scale-95 blur-sm' : 'opacity-100 scale-100 blur-0'
                  }`}
                />
              </div>

              {/* CAPTION - Only show after load */}
              <div className={`bg-slate-900/90 p-4 border-t border-slate-800 text-center text-sm font-medium text-slate-300 transition-opacity duration-500 ${isImageLoading ? 'opacity-0' : 'opacity-100'}`}>
                <ImageIcon size={16} className="inline mr-2 text-purple-400"/> 
                {activeTool.data?.caption || "Visual Aid"}
              </div>
            </div>

          ) : activeTool?.type === 'quiz' ? (
            <QuizComponent 
              data={activeTool.data} 
              onReward={handleReward}
              onMistake={handleMistake}
              onClose={() => setActiveTool(null)}
              onComplete={handleQuizCompletion} 
            />
          
          ) : activeTool?.type === 'builder' ? (
            <BuilderActivity data={activeTool.data} onClose={() => setActiveTool(null)} />
          
          ) : (
            // DEFAULT VIEW (MIC)
            <div className="flex-1 flex flex-col items-center justify-center p-8 relative z-10 overflow-hidden">
              <div className={`w-48 h-48 rounded-full flex items-center justify-center mb-8 transition-all duration-500 shadow-[0_0_60px_-15px_rgba(59,130,246,0.5)] border-4 ${status === 'connected' ? (mode === 'exam' ? 'bg-red-600 border-red-400 animate-pulse' : 'bg-gradient-to-br from-blue-600 to-indigo-600 border-blue-400') : 'bg-slate-800 border-slate-700'}`}>
                {status === 'connecting' ? <Loader2 size={64} className="animate-spin text-blue-200" /> : <Mic size={64} className="text-white drop-shadow-md" />}
              </div>
              {status === 'connected' && (
                <button onClick={() => { endSession(); onExit(); }} className="group relative px-8 py-3 bg-red-500/10 text-red-400 border border-red-500/30 rounded-full font-bold flex items-center gap-2 hover:bg-red-500 hover:text-white transition-all overflow-hidden">
                  <Square size={18}/> End Session
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANEL (TRANSCRIPT) */}
      <div className="w-full md:w-[55%] lg:w-[60%] bg-slate-900/50 backdrop-blur-sm rounded-3xl border border-slate-800 flex flex-col overflow-hidden shadow-xl h-[400px] md:h-auto">
        <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
          {notes.map((note) => (
            <div key={note.id} className="group flex gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex flex-col items-center">
                <div className={`w-2.5 h-2.5 rounded-full mt-2 shadow-[0_0_10px_rgba(255,255,255,0.3)] ${mode === 'exam' ? 'bg-red-500' : 'bg-blue-400'}`} />
                <div className="w-0.5 flex-1 bg-slate-800/50 my-1 group-last:hidden" />
              </div>
              <div className="bg-slate-800/60 border border-slate-700/50 p-4 rounded-2xl rounded-tl-none flex-1 shadow-sm text-slate-200 text-[15px] leading-relaxed hover:bg-slate-800 transition-colors">
                {note.text}
              </div>
            </div>
          ))}
          <div ref={notesEndRef} />
        </div>
      </div>
    </div>
  );
};

export default ActiveSession;