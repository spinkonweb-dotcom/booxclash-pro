import { useState, useEffect } from 'react';
import { 
  BookOpen, Calendar, FileText, Layers, LogOut, 
  Plus, Briefcase, Clock, ChevronRight, Loader2,
  Zap, Crown 
} from 'lucide-react';
import { auth, db } from './firebase'; 
import { 
  doc, getDoc, collection, query, where, getDocs 
} from 'firebase/firestore';
import { signOut, onAuthStateChanged } from 'firebase/auth'; 
import { useNavigate } from 'react-router-dom';

import GenerationModal, { ModalType } from './Modals';

const API_BASE_URL =
  import.meta.env?.VITE_API_BASE ||
  (window.location.hostname === 'localhost'
    ? 'http://localhost:8000'
    : 'https://booxclash-pro.onrender.com');

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const [teacherName, setTeacherName] = useState("Teacher");
  const [loading, setLoading] = useState(true);
  
  // ✅ Credits State
  const [credits, setCredits] = useState<number | null>(null);

  // --- RECENT GENERATIONS STATE ---
  const [recentDocs, setRecentDocs] = useState<any[]>([]);
  const [loadingRecents, setLoadingRecents] = useState(true);
  
  // FILTER STATE
  const [activeFilter, setActiveFilter] = useState<'all' | 'lesson' | 'weekly' | 'scheme'>('all');

  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [isGenerating, setIsGenerating] = useState(false); 

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const uid = user.uid;

        // A. Fetch Name & Credits
        try {
            const userDoc = await getDoc(doc(db, "users", uid));
            if (userDoc.exists()) {
              const data = userDoc.data();
              setTeacherName(data.name || "Teacher");
              setCredits(data.credits !== undefined ? data.credits : 2); 
            }
        } catch (error) {
            console.error("Error fetching user profile:", error);
        }

        // B. Fetch Recent Generations
        try {
            const schemesRef = collection(db, "generated_schemes");
            const weeklyRef = collection(db, "generated_weekly_plans");
            const lessonsRef = collection(db, "generated_lesson_plans");

            const [schemeSnaps, weeklySnaps, lessonSnaps] = await Promise.all([
                getDocs(query(schemesRef, where("userId", "==", uid))),
                getDocs(query(weeklyRef, where("userId", "==", uid))),
                getDocs(query(lessonsRef, where("userId", "==", uid)))
            ]);

            const schemes = schemeSnaps.docs.map(d => ({ 
                ...d.data(), 
                id: d.id, 
                type: 'scheme' 
            }));
            
            const weeklyPlans = weeklySnaps.docs.map(d => ({ 
                ...d.data(), 
                id: d.id, 
                type: 'weekly' 
            }));

            const lessonPlans = lessonSnaps.docs.map(d => ({ 
                ...d.data(), 
                id: d.id, 
                type: 'lesson' 
            }));

            const allDocs = [...schemes, ...weeklyPlans, ...lessonPlans].sort((a: any, b: any) => {
                const dateA = a.createdAt?.seconds || 0;
                const dateB = b.createdAt?.seconds || 0;
                return dateB - dateA;
            });

            setRecentDocs(allDocs);

        } catch (error) {
            console.error("Error fetching recent docs:", error);
        }
      } else {
        navigate('/');
      }
      
      setLoading(false);
      setLoadingRecents(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  const handleModalSubmit = async (formData: any) => {
    const toolType = activeModal; 
    setActiveModal(null); 
    
    // 1. Client-Side Credit Check
    if (credits !== null && credits <= 0) {
        navigate('/upgrade');
        return;
    }
    
    // 2. Start Generation
    if (toolType === 'weekly' || toolType === 'lesson' || toolType === 'scheme') { 
        setIsGenerating(true); 
        try {
            const user = auth.currentUser;
            if (!user) throw new Error("User not authenticated");
            const token = await user.getIdToken();

            let payload = {};

            // 3. Construct Payload based on Type
            if (toolType === 'weekly') {
                payload = {
                    tool_name: "generate_weekly",
                    student: { 
                        grade: formData.grade,
                        subject: formData.subject,
                        name: teacherName,
                        uid: user.uid 
                    },
                    arguments: {
                        school: formData.school,
                        term: formData.term,
                        weekNumber: formData.weekNumber, 
                        days: formData.days,
                        startDate: formData.startDate
                    }
                };
            } else if (toolType === 'lesson') {
                 // ✅ FIXED: Pass 'name' explicitly in arguments to override the student default
                 payload = {
                    tool_name: "generate_lesson",
                    student: {
                        grade: formData.grade,
                        subject: formData.subject,
                        name: teacherName, // Default fallback
                        uid: user.uid 
                    },
                    arguments: {
                        // 🔑 This ensures the dashes/blank name from Modal is used
                        name: formData.teacherName, 
                        // school: formData.school,
                        topic: formData.topic,
                        lessonTitle: formData.lessonTitle || "General Lesson",
                        startDate: formData.startDate, 
                        weekNumber: formData.weekNumber,
                        term: formData.term,
                        startTime: formData.startTime || "08:00",
                        endTime: formData.endTime || "08:40",
                        boys: parseInt(formData.boys || "0"),
                        girls: parseInt(formData.girls || "0"),
                        objectives: formData.objectives || []
                    }
                };
            } else if (toolType === 'scheme') {
                setIsGenerating(true); 
                try {
                    const user = auth.currentUser;
                    if (!user) throw new Error("User not authenticated");
                    const token = await user.getIdToken();

                    const endpoint = `${API_BASE_URL}/api/v1/generate-scheme`; 
                    const payload = {
                        schoolName: formData.school, 
                        term: formData.term,
                        subject: formData.subject,
                        grade: formData.grade,
                        weeks: parseInt(formData.weeks || "13"),
                        startDate: formData.startDate,
                        uid: user.uid
                    };

                    const response = await fetch(endpoint, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${token}`,
                            "X-User-ID": user.uid
                        },
                        body: JSON.stringify(payload)
                    });

                    if (response.status === 402 || response.status === 403) {
                        setIsGenerating(false);
                        navigate('/upgrade');
                        return;
                    }
                    
                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.detail || "Scheme generation failed");
                    }

                    const result = await response.json();
                    
                    // STOP LOADING BEFORE NAVIGATING
                    setIsGenerating(false);

                    navigate('/schemes', { 
                        state: { 
                            schemeData: result, 
                            ...formData 
                        } 
                    });

                    return; 
                } catch (error) {
                    setIsGenerating(false);
                    console.error("Generation Error:", error);
                    alert("Failed to generate. Please try again.");
                }
            }

            // SHARED FETCH FOR WEEKLY & LESSON
            const response = await fetch(`${API_BASE_URL}/api/v1/agent`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                    "X-User-ID": user.uid 
                },
                body: JSON.stringify(payload)
            });

            // Handle Payment/Credit Errors
            if (response.status === 402 || response.status === 403) {
                navigate('/upgrade');
                return;
            }

            const result = await response.json();
            if (!response.ok) throw new Error(result.detail || "Generation failed");

            // 5. Navigate on Success
            if (toolType === 'weekly') {
                navigate('/weekly-view', { state: { planData: result.data, meta: formData } });
            } else if (toolType === 'lesson') {
                navigate('/lesson-view', { state: { lessonData: result.data, meta: formData } });
            } 

        } catch (error) {
            console.error("Generation Error:", error);
            alert("Failed to generate. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    } else {
        alert(`${toolType?.toUpperCase()} coming soon!`);
    }
  };

  const handleOpenRecent = (docData: any) => {
    if (docData.type === 'scheme') {
        navigate('/schemes', { 
            state: { ...docData, existingData: docData.schemeData } 
        });
    } else if (docData.type === 'weekly') {
        navigate('/weekly-view', {
            state: { planData: docData.planData, meta: docData }
        });
    } else if (docData.type === 'lesson') {
        navigate('/lesson-view', {
            state: { lessonData: docData.planData || docData.lessonData, meta: docData }
        });
    }
  };

  const getDocIcon = (type: string) => {
    if (type === 'weekly') return <Calendar size={20} />;
    if (type === 'lesson') return <BookOpen size={20} />;
    return <Layers size={20} />;
  };

  const getDocColor = (type: string) => {
    if (type === 'weekly') return 'bg-purple-900/20 text-purple-400';
    if (type === 'lesson') return 'bg-blue-900/20 text-blue-400';
    return 'bg-emerald-900/20 text-emerald-500';
  };

  const getFilteredDocs = () => {
    if (activeFilter === 'all') return recentDocs; 
    return recentDocs.filter(doc => doc.type === activeFilter);
  };

  const tools = [
    {
      title: "Schemes of Work",
      desc: "Generate termly or yearly curriculum breakdowns.",
      icon: <Layers size={32} className="text-emerald-400" />,
      color: "bg-emerald-900/20 border-emerald-800 hover:border-emerald-500",
      action: () => setActiveModal('scheme') 
    },
    {
      title: "Lesson Plans",
      desc: "Create detailed 40-min step-by-step guides.",
      icon: <BookOpen size={32} className="text-blue-400" />,
      color: "bg-blue-900/20 border-blue-800 hover:border-blue-500",
      action: () => setActiveModal('lesson')
    },
    {
      title: "Weekly Forecasts",
      desc: "Plan your week's topics and objectives.",
      icon: <Calendar size={32} className="text-purple-400" />,
      color: "bg-purple-900/20 border-purple-800 hover:border-purple-500",
      action: () => setActiveModal('weekly')
    },
    {
      title: "Worksheets",
      desc: "Generate quizzes and homework exercises.",
      icon: <FileText size={32} className="text-orange-400" />,
      color: "bg-orange-900/20 border-orange-800 hover:border-orange-500",
      action: () => setActiveModal('worksheet')
    }
  ];

  const FilterButton = ({ label, value }: { label: string, value: typeof activeFilter }) => (
    <button
        onClick={() => setActiveFilter(value)}
        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            activeFilter === value 
            ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' 
            : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700'
        }`}
    >
        {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans p-6 md:p-8 relative">
      
      {isGenerating && (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center">
            <Loader2 size={48} className="text-emerald-500 animate-spin mb-4" />
            <h2 className="text-xl font-bold text-white">Generating AI Plan...</h2>
            <p className="text-slate-400">Consulting your Curriculum</p>
        </div>
      )}

      <GenerationModal 
        isOpen={!!activeModal} 
        type={activeModal} 
        onClose={() => setActiveModal(null)} 
        onGenerate={handleModalSubmit}
      />

      <header className="flex flex-col md:flex-row md:justify-between items-center mb-12 gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-800 flex items-center justify-center shadow-lg shadow-emerald-900/20">
            <Briefcase className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Teacher Dashboard</h1>
            <p className="text-slate-500 text-sm">Welcome back, {loading ? "..." : teacherName}</p>
          </div>
        </div>

        {/* ✅ NEW: Action Buttons (Credits + Logout) */}
        <div className="flex items-center gap-3 w-full md:w-auto">
            {/* Credit Display */}
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
                <Zap size={16} className={credits && credits > 0 ? "text-yellow-400" : "text-slate-600"} />
                <span className="font-mono font-bold">{credits ?? "-"}</span>
                <span className="text-xs text-slate-500 hidden sm:inline">Generations</span>
            </div>

            {/* Upgrade Button */}
            <button 
                onClick={() => navigate('/upgrade')}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-lg shadow-emerald-900/20"
            >
                <Crown size={16} />
                <span>Upgrade</span>
            </button>

            <button 
                onClick={handleLogout}
                className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-red-900/20 hover:text-red-400 hover:border-red-900 transition-all"
                title="Sign Out"
            >
                <LogOut size={20} />
            </button>
        </div>
      </header>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
        {tools.map((tool, idx) => (
          <button 
            key={idx}
            onClick={tool.action}
            className={`group text-left p-8 rounded-3xl border transition-all duration-300 relative overflow-hidden ${tool.color}`}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-white/10 transition-colors" />
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div className="mb-6 bg-slate-950/50 w-fit p-4 rounded-2xl border border-white/5">
                {tool.icon}
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2 group-hover:translate-x-1 transition-transform">{tool.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{tool.desc}</p>
              </div>
              <div className="mt-6 flex items-center gap-2 text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0 text-white">
                Create New <Plus size={16} />
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Recent Generations Section */}
      <div className="mt-12 max-w-5xl mx-auto pb-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Clock size={18} className="text-slate-500" /> 
                Recent Generations
            </h2>
            
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                <FilterButton label="All" value="all" />
                <FilterButton label="Lesson Plans" value="lesson" />
                <FilterButton label="Forecasts" value="weekly" />
                <FilterButton label="Schemes" value="scheme" />
            </div>
        </div>
        
        {loadingRecents ? (
            <div className="flex justify-center p-8 text-slate-500">
                <Loader2 className="animate-spin" />
            </div>
        ) : getFilteredDocs().length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {getFilteredDocs().map((doc) => (
                <button 
                  key={doc.id}
                  onClick={() => handleOpenRecent(doc)}
                  className="flex items-center justify-between bg-slate-900 border border-slate-800 p-4 rounded-xl hover:border-emerald-500/50 hover:bg-slate-800 transition-all group text-left animate-in fade-in slide-in-from-bottom-2 duration-300"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${getDocColor(doc.type)}`}>
                      {getDocIcon(doc.type)}
                    </div>
                    
                    <div>
                      <h3 className="font-bold text-slate-200">{doc.subject}</h3>
                      <p className="text-xs text-slate-500 flex items-center gap-2">
                        {doc.type === 'weekly' ? 'Weekly Forecast' : doc.type === 'lesson' ? 'Lesson Plan' : 'Scheme of Work'} 
                        <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
                        Grade {doc.grade}
                      </p>
                      <p className="text-[10px] text-slate-600 mt-1">
                          {doc.type === 'lesson' 
                            ? `Date: ${doc.date || doc.createdAt?.toDate().toLocaleDateString()}` 
                            : (doc.type === 'weekly' ? `Week ${doc.weekNumber}` : doc.term)}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="text-slate-600 group-hover:text-emerald-500 transition-colors" size={20} />
                </button>
              ))}
            </div>
        ) : (
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 text-center text-slate-500">
              <p>No documents found for this category.</p>
            </div>
        )}
      </div>
    </div>
  );
}