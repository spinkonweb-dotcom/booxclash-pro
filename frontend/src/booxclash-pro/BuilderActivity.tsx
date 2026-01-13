"use client";
import { useState } from 'react';
import { CheckCircle2, GripVertical, Shuffle, X } from 'lucide-react';

export interface BuilderData {
  title: string;
  instruction: string;
  steps: { id: string; label: string }[]; // The correct order (for validation)
  options: { id: string; label: string }[]; // The shuffled options
}

export const BuilderActivity = ({ data, onClose }: { data: BuilderData; onClose: () => void }) => {
  // We keep the "pool" of available options and the "sequence" the user builds
  const [pool, setPool] = useState(data.options);
  const [sequence, setSequence] = useState<{ id: string; label: string }[]>([]);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isWrong, setIsWrong] = useState(false);

  // Add item to sequence
  const addToSequence = (item: { id: string; label: string }) => {
    setSequence([...sequence, item]);
    setPool(pool.filter((i) => i.id !== item.id));
    setIsWrong(false);
  };

  // Remove item from sequence
  const removeFromSequence = (item: { id: string; label: string }) => {
    setPool([...pool, item]);
    setSequence(sequence.filter((i) => i.id !== item.id));
    setIsWrong(false);
  };

  const checkAnswer = () => {
    // 1. Check length
    if (sequence.length !== data.steps.length) {
      setIsWrong(true);
      return;
    }

    // 2. Check Order
    for (let i = 0; i < data.steps.length; i++) {
      if (sequence[i].id !== data.steps[i].id) {
        setIsWrong(true);
        return;
      }
    }

    setIsSuccess(true);
  };

  return (
    <div className="absolute inset-0 bg-slate-900 z-20 flex flex-col animate-in fade-in">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/95">
        <div>
          <h2 className="text-lg font-bold text-blue-400 flex items-center gap-2">
            <Shuffle className="w-5 h-5" /> {data.title}
          </h2>
          <p className="text-xs text-slate-400">{data.instruction}</p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 flex flex-col p-6 gap-6 overflow-y-auto">
        
        {/* DROP ZONE (Sequence) */}
        <div className={`flex-1 border-2 border-dashed rounded-2xl p-4 transition-all ${
          isSuccess ? 'border-emerald-500 bg-emerald-900/10' : 
          isWrong ? 'border-red-500 bg-red-900/10' : 'border-slate-700 bg-slate-800/30'
        }`}>
          <h3 className="text-xs uppercase font-bold text-slate-500 mb-4 tracking-widest">
            Your Sequence ({sequence.length}/{data.steps.length})
          </h3>
          
          <div className="space-y-2">
            {sequence.length === 0 && (
              <div className="text-center py-10 text-slate-600 italic">
                Tap options below to add them here in order.
              </div>
            )}
            {sequence.map((item, idx) => (
              <div key={item.id} onClick={() => !isSuccess && removeFromSequence(item)} 
                className="bg-slate-800 border border-slate-600 p-3 rounded-xl flex items-center gap-3 cursor-pointer hover:border-red-400 group animate-in slide-in-from-bottom-2">
                <span className="bg-slate-900 text-slate-400 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                  {idx + 1}
                </span>
                <span className="flex-1 font-medium">{item.label}</span>
                {!isSuccess && <X size={14} className="opacity-0 group-hover:opacity-100 text-red-400"/>}
              </div>
            ))}
          </div>
        </div>

        {/* POOL ZONE */}
        {!isSuccess && (
          <div>
             <h3 className="text-xs uppercase font-bold text-slate-500 mb-2 tracking-widest">Available Options</h3>
             <div className="flex flex-wrap gap-2">
               {pool.map((item) => (
                 <button key={item.id} onClick={() => addToSequence(item)}
                   className="bg-blue-900/20 border border-blue-900/50 hover:bg-blue-800/30 hover:border-blue-500 text-blue-100 px-4 py-2 rounded-lg text-sm transition-all flex items-center gap-2">
                   <GripVertical size={14} className="opacity-50"/> {item.label}
                 </button>
               ))}
             </div>
          </div>
        )}

        {/* SUCCESS MESSAGE */}
        {isSuccess && (
          <div className="text-center p-4 bg-emerald-500/20 border border-emerald-500/50 rounded-xl animate-in zoom-in">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-2"/>
            <h3 className="text-xl font-bold text-white">Correct Sequence!</h3>
            <p className="text-emerald-200 text-sm">You solved the logic puzzle.</p>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div className="p-4 border-t border-slate-800">
        {!isSuccess && (
          <button 
            onClick={checkAnswer}
            className={`w-full py-3 rounded-xl font-bold text-white transition-all ${
              isWrong ? 'bg-red-600 animate-shake' : 'bg-blue-600 hover:bg-blue-500'
            }`}
          >
            {isWrong ? 'Incorrect - Try Again' : 'Check Sequence'}
          </button>
        )}
        {isSuccess && (
           <button onClick={onClose} className="w-full py-3 rounded-xl font-bold bg-slate-800 text-white hover:bg-slate-700">
             Close Activity
           </button>
        )}
      </div>
    </div>
  );
};