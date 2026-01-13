import { useState, useEffect } from 'react';
import {
  BookOpen,
  Clock,
  Trophy,
  LogOut,
  Sparkles,
  History,
  BrainCircuit
} from 'lucide-react';
import { auth, db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import BooxClashPro from './BooxClashPro';

type Mode = 'tutor' | 'exam';

export default function StudentDashboard() {
  const [studentName, setStudentName] = useState<string>('Student');
  const [loading, setLoading] = useState<boolean>(true);
  const [activeMode, setActiveMode] = useState<Mode | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (auth.currentUser) {
        const docRef = doc(db, 'users', auth.currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setStudentName(docSnap.data().name || 'Student');
        }
      }
      setLoading(false);
    };
    fetchProfile();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    window.location.href = '/';
  };

  // 🚀 Once a mode is selected, enter BooxClashPro
  if (activeMode) {
    return <BooxClashPro initialMode={activeMode} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans p-6 md:p-8">

      {/* Header */}
      <header className="flex justify-between items-center mb-10 max-w-5xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">
            Hi, {loading ? '...' : studentName.split(' ')[0]} 👋
          </h1>
          <p className="text-slate-400">
            Ready to learn something new today?
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center hover:bg-red-900/20 hover:border-red-900 text-slate-400 hover:text-red-400 transition-all"
        >
          <LogOut size={18} />
        </button>
      </header>

      {/* Mode Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">

        {/* Study Mode */}
        <div className="group relative bg-slate-900 rounded-[2.5rem] p-8 border border-slate-800 hover:border-blue-600 transition-all duration-300 shadow-2xl overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

          <div className="relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center mb-6 shadow-lg shadow-blue-900/40">
              <BookOpen className="text-white" size={32} />
            </div>

            <h2 className="text-2xl font-bold text-white mb-3">
              Study Mode
            </h2>

            <p className="text-slate-400 mb-8 leading-relaxed">
              Interactive AI tutoring. Ask questions, get summaries,
              and learn topics at your own pace.
            </p>

            <button
              onClick={() => setActiveMode('tutor')}
              className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-lg shadow-blue-900/20"
            >
              Start Studying <BrainCircuit size={20} />
            </button>
          </div>
        </div>

        {/* Exam Mode */}
        <div className="group relative bg-slate-900 rounded-[2.5rem] p-8 border border-slate-800 hover:border-red-600 transition-all duration-300 shadow-2xl overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

          <div className="relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-red-600 flex items-center justify-center mb-6 shadow-lg shadow-red-900/40">
              <Clock className="text-white" size={32} />
            </div>

            <h2 className="text-2xl font-bold text-white mb-3">
              Exam Mode
            </h2>

            <p className="text-slate-400 mb-8 leading-relaxed">
              Test your knowledge with timed quizzes.
              Get instant grading and detailed corrections.
            </p>

            <button
              onClick={() => setActiveMode('exam')}
              className="w-full py-4 rounded-xl bg-red-700 hover:bg-red-600 text-white font-bold flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-lg shadow-red-900/20"
            >
              Take an Exam <Trophy size={20} />
            </button>
          </div>
        </div>

      </div>

      {/* Stats */}
      <div className="max-w-5xl mx-auto mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
            <History size={14} /> Total Sessions
          </div>
          <div className="text-3xl font-bold text-white">0</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
            <Sparkles size={14} /> Topics Mastered
          </div>
          <div className="text-3xl font-bold text-white">0</div>
        </div>
      </div>
    </div>
  );
}
