import React from 'react';
import { X, Clock, Mic, AlertCircle } from 'lucide-react';

/* =====================
   Types
===================== */

export interface ExamQuestion {
  id?: string | number;
  text?: string;
  question?: string;
  image?: string;
  A?: string;
  B?: string;
  C?: string;
  D?: string;
}

interface ExamPaperProps {
  questions: ExamQuestion[];
  onClose: () => void;
  status?: 'idle' | 'connecting' | 'connected' | 'error';
}

/* =====================
   Component
===================== */

const ExamPaper: React.FC<ExamPaperProps> = ({
  questions,
  onClose,
  status = 'idle',
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-100 flex flex-col font-sans animate-in fade-in duration-300">
      {/* TOP BAR */}
      <div className="bg-white border-b px-6 py-4 flex justify-between items-center shadow-sm z-40">
        <div>
          <h2 className="text-xl font-bold text-red-900 tracking-tight">
            OFFICIAL EXAMINATION
          </h2>
          <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">
            Strict Supervision Active
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-slate-100 px-4 py-2 rounded-full font-mono font-bold text-slate-700 flex items-center gap-2 border">
            <Clock size={16} className="text-red-600 animate-pulse" />
            00:45:00
          </div>

          <button
            onClick={onClose}
            className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>
      </div>

      {/* FLOATING INVIGILATOR ORB */}
      <div className="fixed top-24 right-6 z-50 flex flex-col items-end gap-2 pointer-events-none">
        <div
          className={`w-16 h-16 rounded-full shadow-2xl flex items-center justify-center border-4 backdrop-blur-sm transition-all duration-500
          ${
            status === 'connected'
              ? 'bg-red-600/90 border-red-500 animate-pulse shadow-red-900/50'
              : 'bg-slate-800/90 border-slate-700'
          }`}
        >
          <Mic className="text-white w-6 h-6" />
        </div>

        <div className="bg-black/70 text-white text-[10px] px-2 py-1 rounded-md backdrop-blur">
          Invigilator Active
        </div>
      </div>

      {/* SCROLLABLE PAPER */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg flex gap-3 text-yellow-800 text-sm">
            <AlertCircle size={20} />
            <p>
              Voice monitoring is active. Speaking during the exam may be flagged
              as malpractice.
            </p>
          </div>

          {questions.length === 0 ? (
            <div className="text-center py-20 text-slate-400">
              Loading questions...
            </div>
          ) : (
            questions.map((q, idx) => (
              <div
                key={q.id ?? idx}
                className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-slate-200"
              >
                <div className="flex gap-4">
                  <span className="text-2xl font-bold text-slate-200 select-none">
                    Q{idx + 1}
                  </span>

                  <div className="flex-1">
                    <p className="text-lg text-slate-900 font-medium mb-6 leading-relaxed">
                      {q.text ?? q.question}
                    </p>

                    {q.image && (
                      <div className="mb-6 p-2 border rounded-lg bg-slate-50 inline-block">
                        <img
                          src={q.image}
                          alt="Diagram"
                          className="max-h-64 object-contain"
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-1 gap-3">
                      {(['A', 'B', 'C', 'D'] as const).map((opt) => (
                        <label
                          key={opt}
                          className="relative flex items-center gap-4 p-4 border rounded-lg hover:bg-slate-50 cursor-pointer transition-all group"
                        >
                          <input
                            type="radio"
                            name={`q_${q.id ?? idx}`}
                            className="peer hidden"
                          />

                          {/* Custom Radio */}
                          <div className="w-6 h-6 rounded-full border-2 border-slate-300 peer-checked:border-red-500 peer-checked:bg-red-500 flex items-center justify-center transition-all">
                            <div className="w-2 h-2 rounded-full bg-white" />
                          </div>

                          <span className="font-bold text-slate-400 w-4">
                            {opt}.
                          </span>
                          <span className="text-slate-700 font-medium">
                            {q[opt]}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ExamPaper;
