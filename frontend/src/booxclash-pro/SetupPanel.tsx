import React, { useState, useEffect } from 'react';
import {
  User,
  BookOpen,
  GraduationCap,
  PlayCircle,
  Loader2,
  Clock,
} from 'lucide-react';

/* =====================
   Types
===================== */

type Mode = 'tutor' | 'exam';

interface Profile {
  name: string;
  grade: string;
  country: string;
  subject: string;
}

interface SetupPanelProps {
  onStart: (profile: Profile, mode: Mode) => void;
  loading: boolean;
  initialMode?: Mode;
}

/* =====================
   Component
===================== */

const SetupPanel: React.FC<SetupPanelProps> = ({
  onStart,
  loading = false,
  initialMode = 'tutor',
}) => {
  const [mode, setMode] = useState<Mode>(initialMode);

  const [profile, setProfile] = useState<Profile>({
    name: '',
    grade: '12',
    country: 'Zambia',
    subject: 'Biology',
  });

  const subjects: Record<'primary' | 'secondary', string[]> = {
    primary: ['Mathematics', 'Integrated Science', 'Social Studies', 'English'],
    secondary: ['Physics', 'Biology', 'Chemistry', 'Mathematics', 'Geography'],
  };

  const isPrimary = parseInt(profile.grade, 10) <= 7;
  const availableSubjects = isPrimary ? subjects.primary : subjects.secondary;

  // Auto-select first subject if current selection is invalid for the grade
  useEffect(() => {
    if (!availableSubjects.includes(profile.subject)) {
      setProfile((p) => ({ ...p, subject: availableSubjects[0] }));
    }
  }, [profile.grade, availableSubjects, profile.subject]);

  /* =====================
       Handlers
  ===================== */

  const handleStart = () => {
    if (!profile.name.trim()) {
      alert('Please enter your name to continue.');
      return;
    }
    //Pass data up to BooxClashPro.tsx to handle the Backend API call
    onStart(profile, mode);
  };

  /* =====================
       Render
  ===================== */

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans">
      <div className="bg-slate-900 border border-slate-800 p-8 md:p-12 rounded-[2rem] shadow-2xl w-full max-w-md relative overflow-hidden">
        
        {/* Background Decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

        <div className="relative z-10">
          <div className="text-center mb-8">
            <div
              className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl transform -rotate-3 transition-colors ${
                mode === 'exam'
                  ? 'bg-gradient-to-br from-red-600 to-red-800'
                  : 'bg-gradient-to-br from-blue-600 to-blue-800'
              }`}
            >
              {mode === 'exam' ? (
                <GraduationCap className="text-white w-10 h-10" />
              ) : (
                <BookOpen className="text-white w-10 h-10" />
              )}
            </div>

            <h1 className="text-3xl font-bold text-white mb-2">
              {mode === 'exam' ? 'Start Exam' : 'Setup Class'}
            </h1>
            <p className="text-slate-400 text-sm">
              Configure your AI session settings
            </p>
          </div>

          {/* Mode Toggle */}
          <div className="bg-slate-950 p-1 rounded-xl flex mb-6 border border-slate-800">
            {(['tutor', 'exam'] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 capitalize transition-all ${
                  mode === m
                    ? m === 'exam'
                      ? 'bg-red-900/80 text-white shadow-lg'
                      : 'bg-slate-800 text-white shadow-lg'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {m === 'exam' ? <Clock size={16} /> : <BookOpen size={16} />}
                {m} Mode
              </button>
            ))}
          </div>

          {/* Form */}
          <div className="space-y-5">
            <div className="relative group">
              <User
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
              />
              <input
                value={profile.name}
                onChange={(e) =>
                  setProfile({ ...profile, name: e.target.value })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-4 pl-12 pr-4 text-white outline-none focus:border-blue-500 transition-colors placeholder:text-slate-600"
                placeholder="Student Name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <select
                value={profile.grade}
                onChange={(e) =>
                  setProfile({ ...profile, grade: e.target.value })
                }
                className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-white outline-none focus:border-blue-500 transition-colors"
              >
                {[5, 6, 7, 8, 9, 10, 11, 12].map((g) => (
                  <option key={g} value={g}>
                    Grade {g}
                  </option>
                ))}
              </select>

              <select
                value={profile.subject}
                onChange={(e) =>
                  setProfile({ ...profile, subject: e.target.value })
                }
                className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-white outline-none focus:border-blue-500 transition-colors"
              >
                {availableSubjects.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleStart}
              disabled={loading}
              className={`w-full mt-8 py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all ${
                mode === 'exam'
                  ? 'bg-red-700 hover:bg-red-600'
                  : 'bg-blue-600 hover:bg-blue-500'
              } ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  Enter {mode === 'exam' ? 'Exam' : 'Classroom'}
                  <PlayCircle size={18} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetupPanel;