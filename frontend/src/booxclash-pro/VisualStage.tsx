"use client";

import React from 'react';
import { LiveProvider, LiveError, LivePreview } from 'react-live';
import * as LucideIcons from 'lucide-react';
import * as FramerMotion from 'framer-motion';
import * as Recharts from 'recharts'; // ✅ ADDED: Allows AI to draw graphs/charts
import QuizComponent from './QuizComponent.tsx';
import { BrainCircuit, Loader2 } from 'lucide-react';

// --- SCOPE CONFIGURATION ---
// The AI "thinks" these libraries are available globally.
const scope = { 
  React, 
  ...React,          // Inject useState, useEffect, useRef
  ...LucideIcons,    // Inject all icons
  ...FramerMotion,   // Inject animations
  ...Recharts,       // Inject charts (LineChart, BarChart, etc.)
  motion: FramerMotion.motion,
  AnimatePresence: FramerMotion.AnimatePresence 
};

interface VisualStageProps {
  mode: 'idle' | 'image' | 'simulation' | 'quiz';
  content: any; 
  // ✅ UPDATED: Matches the new handler in BooxClashPro (score, total)
  onQuizComplete?: (score: number, total: number) => void;
}

export default function VisualStage({ mode, content, onQuizComplete }: VisualStageProps) {
  
  // --- CODE CLEANER ---
  // Removes standard JS imports so the browser doesn't crash on `import ...`
  const transformCode = (code: string) => {
    return code
      .replace(/^import .*$/gm, '') 
      .replace(/.*require\(.*\).*$/gm, '')
      .replace(/^export default .*$/gm, '')
      .replace(/^export .*$/gm, '')
      .replace(/^["']use (client|strict)["'];?$/gm, '')
      .trim();
  };

  // 1. Idle State
  if (mode === 'idle') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-4 animate-pulse">
        <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center border border-slate-700/50">
          <BrainCircuit size={40} className="text-slate-600" />
        </div>
        <p className="text-sm font-medium tracking-wide">AI VISUAL ENGINE STANDBY</p>
      </div>
    );
  }

  // 2. Image State
  if (mode === 'image') {
    return (
      <div className="h-full w-full flex items-center justify-center bg-black p-4 relative overflow-hidden">
        {/* Loading Spinner underneath (visible if image takes a sec to render) */}
        <div className="absolute inset-0 flex items-center justify-center text-slate-700">
             <Loader2 className="animate-spin w-8 h-8" />
        </div>
        
        <FramerMotion.motion.img 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          src={content} 
          alt="AI Generated Context" 
          className="relative z-10 max-h-full max-w-full rounded-xl shadow-2xl border border-slate-800 object-contain" 
        />
      </div>
    );
  }

  // 3. Simulation State (The React Compiler)
  if (mode === 'simulation') {
    return (
      <div className="h-full w-full bg-slate-900/50 overflow-hidden relative flex flex-col">
        <LiveProvider 
          code={content} 
          scope={scope} 
          noInline={true} 
          transformCode={transformCode}
        >
          {/* Main Rendering Area */}
          <div className="flex-1 overflow-auto p-4 md:p-8 flex items-center justify-center bg-slate-950">
             {/* Container specifically styled so white-bg components look good */}
             <div className="w-full max-w-4xl min-h-[400px] flex items-center justify-center">
                <LivePreview Component={React.Fragment} />
             </div>
          </div>
          
          {/* Error Bar (Only shows if AI generated bad code) */}
          <LiveError className="shrink-0 p-4 bg-red-900/90 text-red-100 text-xs font-mono border-t border-red-700 max-h-32 overflow-auto whitespace-pre-wrap" />
        </LiveProvider>
      </div>
    );
  }

  // 4. Quiz State
  if (mode === 'quiz') {
    return (
      <div className="h-full w-full bg-slate-900 overflow-y-auto custom-scrollbar">
        <QuizComponent 
          data={content}
          onComplete={onQuizComplete || (() => { })} onClose={function (): void {
            throw new Error('Function not implemented.');
          } }        />
      </div>
    );
  }

  return null;
}