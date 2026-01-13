import { useState, useEffect } from 'react';
import { X, Layers, BookOpen, Calendar, FileText, Hash, Clock, Users, Search, ChevronDown } from 'lucide-react';
import { auth, db } from './firebase'; 
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore'; 

export type ModalType = 'scheme' | 'lesson' | 'weekly' | 'worksheet' | null;

interface GenerationModalProps {
  isOpen: boolean;
  type: ModalType;
  onClose: () => void;
  onGenerate: (data: any) => void;
}
const API_BASE =
  import.meta.env?.VITE_API_BASE ||
  (window.location.hostname === 'localhost'
    ? 'http://localhost:8000'
    : 'https://booxclash-pro.onrender.com');

export default function GenerationModal({ isOpen, type, onClose, onGenerate }: GenerationModalProps) {
  
  // Unified Form State
  const [formData, setFormData] = useState({
    teacherName: '', 
    school: '',
    term: 'Term 1',
    subject: '',
    grade: '',
    weeks: 12,           
    weekNumber: 1,       
    days: 5,             
    startDate: new Date().toISOString().split('T')[0],
    startTime: '08:00',
    endTime: '08:40',
    boys: 0,
    girls: 0,
    topic: '',              
    lessonTitle: '',        
    objectives: [] as string[] 
  });

  // --- NEW STATE: Weekly Plan Lookup ---
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [availableDays, setAvailableDays] = useState<any[]>([]);
  const [selectedDayIndex, setSelectedDayIndex] = useState<string>("");

  // 1️⃣ INITIALIZE ON OPEN
  useEffect(() => {
    if (isOpen) {
       setAvailableDays([]);
       setSelectedDayIndex("");
       
       const fetchUserProfile = async () => {
           const user = auth.currentUser;
           if (user) {
               try {
                   const userDoc = await getDoc(doc(db, "users", user.uid));
                   const userData = userDoc.exists() ? userDoc.data() : {};
                   
                   // ✅ CUSTOM LOGIC FOR LESSON PLANS
                   if (type === 'lesson') {
                       setFormData(prev => ({
                           ...prev,
                           teacherName: "____________________", // Set to dashes
                           startDate: "____________________",   // Set to dashes
                           // ✅ UPDATED: School is now set to dashes for Lesson Plans
                           school: "____________________" 
                       }));
                   } else {
                       // Logic for other tools (Schemes, Weekly, etc.)
                       setFormData(prev => ({
                           ...prev,
                           teacherName: userData.name || "",
                           school: userData.school || "",
                           startDate: new Date().toISOString().split('T')[0]
                       }));
                   }
               } catch (e) {
                   console.error("Error fetching profile:", e);
               }
           }
       };

       fetchUserProfile();
    }
  }, [isOpen, type]);

  if (!isOpen || !type) return null;

  // --- LOGIC: FETCH WEEKLY PLAN & SCHEME TOPIC ---
  const fetchWeeklyPlan = async () => {
    if (!formData.grade || !formData.subject || !formData.weekNumber) {
        alert("Please enter Grade, Subject, and Week Number first.");
        return;
    }

    setLoadingPlan(true);
    setAvailableDays([]);
    const user = auth.currentUser;
    
    if (!user) {
        alert("Please log in first.");
        setLoadingPlan(false);
        return;
    }

    // 1️⃣ FETCH MAIN TOPIC FROM SAVED SCHEMES (Firestore)
    try {
        const schemesRef = collection(db, "generated_schemes");
        const q = query(
            schemesRef,
            where("userId", "==", user.uid),
            where("subject", "==", formData.subject),
            where("grade", "==", formData.grade),
            where("term", "==", formData.term)
        );

        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
            const schemeDoc = querySnapshot.docs[0].data();
            const schemeList = schemeDoc.schemeData || [];
            
            const targetWeek = parseInt(formData.weekNumber.toString());
            const weekItem = schemeList.find((w: any) => 
                w.week_number === targetWeek || 
                (w.week && w.week.toString().startsWith(`Week ${targetWeek}`))
            );
            
            if (weekItem && weekItem.topic) {
                setFormData(prev => ({ ...prev, topic: weekItem.topic }));
            }
        }
    } catch (error) {
        console.error("❌ [Scheme Lookup] Error:", error);
    }

    // 2️⃣ FETCH WEEKLY PLAN (Python API)
    try {
        const payload = {
            grade: formData.grade,
            subject: formData.subject,
            term: formData.term,
            weekNumber: parseInt(formData.weekNumber.toString())
        };

        const response = await fetch(`${API_BASE}/api/v1/get-weekly-plan`, { 
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-User-ID': user.uid
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            if (response.status === 404) {
                alert(`No local Weekly Plan found for Grade ${formData.grade} ${formData.subject} Week ${formData.weekNumber}.`);
            }
            return;
        }

        const planData = await response.json();

        if (planData && Array.isArray(planData.days)) {
            setAvailableDays(planData.days);
            
            setFormData(prev => ({
                ...prev,
                // ✅ For Lesson Plans, we keep the dashes. For others, we take from plan.
                school: type === 'lesson' ? prev.school : (planData.school || prev.school), 
                term: planData.meta?.term || prev.term,
                topic: prev.topic || planData.meta?.main_topic || ""
            }));
        }

    } catch (error) {
        console.error("Error fetching plan:", error);
    } finally {
        setLoadingPlan(false);
    }
  };

  // --- LOGIC: AUTO-FILL FROM SELECTED DAY ---
  const handleDaySelect = (indexStr: string) => {
      setSelectedDayIndex(indexStr);
      const idx = parseInt(indexStr);
      
      if (!isNaN(idx) && availableDays[idx]) {
          const dayData = availableDays[idx];
          
          setFormData(prev => ({
              ...prev,
              lessonTitle: dayData.subtopic || "", 
              objectives: dayData.objectives || [],
              // ✅ Keep dashes for Lesson Plans, auto-fill date for others
              startDate: type === 'lesson' ? prev.startDate : (dayData.date || prev.startDate)
          }));
      }
  };

  const handleGenerateClick = () => {
    onGenerate(formData);
  };

  // --- CONFIGURATION ---
  const config = {
    scheme: {
      title: "New Scheme of Work",
      desc: "Generate a termly breakdown based on the syllabus.",
      icon: <Layers size={18} />,
      color: "bg-emerald-600 hover:bg-emerald-500",
      btnText: "Generate Scheme"
    },
    lesson: {
      title: "New Lesson Plan",
      desc: "Create a detailed lesson from your Weekly Plan.",
      icon: <BookOpen size={18} />,
      color: "bg-blue-600 hover:bg-blue-500",
      btnText: "Generate Lesson"
    },
    weekly: {
      title: "New Weekly Forecast",
      desc: "Auto-generate daily plans from your Scheme of Work.",
      icon: <Calendar size={18} />,
      color: "bg-purple-600 hover:bg-purple-500",
      btnText: "Generate Forecast"
    },
    worksheet: {
      title: "New Worksheet",
      desc: "Create exercises and quizzes for your class.",
      icon: <FileText size={18} />,
      color: "bg-orange-600 hover:bg-orange-500",
      btnText: "Create Worksheet"
    }
  };

  const currentConfig = config[type];
  
  // ✅ REMOVED 'lesson' so inputs are HIDDEN
  const showSchool = ['scheme', 'weekly', 'worksheet'].includes(type); 
  const showDate = ['scheme', 'weekly'].includes(type); 
  const showTerm = ['scheme', 'weekly'].includes(type);
  
  const showWeeks = ['scheme'].includes(type);
  const showDays = ['weekly'].includes(type);
  const showWeekNum = ['weekly', 'lesson'].includes(type); 
  const showLogistics = ['lesson'].includes(type);
  const showTopic = ['worksheet', 'lesson'].includes(type); 
  const showLessonTitle = ['worksheet', 'lesson'].includes(type); 

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="bg-slate-950 p-6 border-b border-slate-800 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white">{currentConfig.title}</h2>
            <p className="text-slate-400 text-sm">{currentConfig.desc}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto custom-scrollbar">

          {/* 1. School Name Input (Hidden for Lesson) */}
          {showSchool && (
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">School Name</label>
              <input 
                type="text" 
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:ring-2 focus:ring-slate-600 outline-none"
                placeholder="e.g. Lusaka High School"
                value={formData.school}
                onChange={(e) => setFormData({...formData, school: e.target.value})}
              />
            </div>
          )}

          {/* 2. Subject & Grade */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Subject</label>
              <input 
                type="text" 
                placeholder="e.g. Mathematics"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:ring-2 focus:ring-slate-600 outline-none"
                value={formData.subject}
                onChange={(e) => setFormData({...formData, subject: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Grade / Class</label>
              <input 
                type="text" 
                placeholder="e.g. 5"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:ring-2 focus:ring-slate-600 outline-none"
                value={formData.grade}
                onChange={(e) => setFormData({...formData, grade: e.target.value})}
              />
            </div>
          </div>

          {/* 3. Week Number & Plan Fetcher */}
          {showWeekNum && (
            <div className="space-y-3">
               <div className="flex items-end gap-2">
                   <div className="flex-1">
                       <label className="block text-sm font-medium text-purple-400 mb-1 flex items-center gap-1">
                         <Hash size={14} /> Week Number
                       </label>
                       <input 
                         type="number" 
                         className="w-full bg-slate-950 border border-purple-500/50 rounded-lg p-3 text-white focus:ring-2 focus:ring-purple-600 outline-none"
                         placeholder="e.g. 2"
                         min={1} max={15}
                         value={formData.weekNumber}
                         onChange={(e) => setFormData({...formData, weekNumber: parseInt(e.target.value) || 1})}
                       />
                   </div>
                   
                   {/* FETCH BUTTON FOR LESSONS */}
                   {type === 'lesson' && (
                       <button 
                         onClick={fetchWeeklyPlan}
                         disabled={loadingPlan}
                         className="mb-[2px] px-4 py-3 bg-purple-900/30 border border-purple-500/50 text-purple-300 rounded-lg hover:bg-purple-900/50 transition-colors flex items-center gap-2"
                       >
                          {loadingPlan ? <Clock size={18} className="animate-spin" /> : <Search size={18} />}
                          {loadingPlan ? "Loading..." : "Find Plan"}
                       </button>
                   )}
               </div>
               
               {/* DAY SELECTOR (Visible only after fetch) */}
               {availableDays.length > 0 && type === 'lesson' && (
                   <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700 animate-in fade-in slide-in-from-top-2">
                       <label className="block text-xs font-bold text-slate-300 mb-2 uppercase tracking-wide">
                           Select a Lesson from Week {formData.weekNumber}
                       </label>
                       <div className="relative">
                           <select 
                               className="w-full appearance-none bg-slate-900 border border-slate-600 rounded-md p-2 text-white text-sm focus:border-blue-500 outline-none cursor-pointer"
                               value={selectedDayIndex}
                               onChange={(e) => handleDaySelect(e.target.value)}
                           >
                               <option value="">-- Select Day --</option>
                               {availableDays.map((day: any, idx: number) => (
                                   <option key={idx} value={idx}>
                                       {day.day} - {day.subtopic || "No Topic"}
                                   </option>
                               ))}
                           </select>
                           <ChevronDown size={14} className="absolute right-3 top-3 text-slate-400 pointer-events-none" />
                       </div>
                   </div>
               )}
            </div>
          )}

          {/* 4. Lesson Logistics */}
          {showLogistics && (
            <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 space-y-4">
                <div className="flex items-center gap-2 text-slate-300 font-medium pb-2 border-b border-slate-800">
                    <Users size={16} /> Enrolment
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs text-slate-500 mb-1 block">Boys</label>
                        <input type="number" className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm"
                            value={formData.boys} onChange={(e) => setFormData({...formData, boys: parseInt(e.target.value) || 0})}
                        />
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 mb-1 block">Girls</label>
                        <input type="number" className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm"
                            value={formData.girls} onChange={(e) => setFormData({...formData, girls: parseInt(e.target.value) || 0})}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2 text-slate-300 font-medium pt-2 pb-2 border-b border-slate-800">
                    <Clock size={16} /> Timing
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs text-slate-500 mb-1 block">Start Time</label>
                        <input type="time" className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm [color-scheme:dark]"
                            value={formData.startTime} onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 mb-1 block">End Time</label>
                        <input type="time" className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm [color-scheme:dark]"
                            value={formData.endTime} onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                        />
                    </div>
                </div>
            </div>
          )}

          {/* 5. Term & Dates (Hidden for Lesson) */}
          {(showTerm || showDate) && (
            <div className="grid grid-cols-2 gap-4">
              {showTerm && (
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Term</label>
                  <select 
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white"
                    value={formData.term}
                    onChange={(e) => setFormData({...formData, term: e.target.value})}
                  >
                    <option>Term 1</option>
                    <option>Term 2</option>
                    <option>Term 3</option>
                  </select>
                </div>
              )}
              {showDate && (
                 <div>
                   <label className="block text-sm font-medium text-slate-400 mb-1">
                      Start Date
                   </label>
                   <input 
                     type="date" 
                     className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white [color-scheme:dark]"
                     value={formData.startDate}
                     onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                   />
                 </div>
              )}
            </div>
          )}

          {/* 6. Extra Fields */}
          <div className="grid grid-cols-2 gap-4">
             {showWeeks && (
                <div>
                   <label className="block text-sm font-medium text-slate-400 mb-1">Total Weeks</label>
                   <input type="number" className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white"
                     value={formData.weeks} onChange={(e) => setFormData({...formData, weeks: parseInt(e.target.value) || 0})}
                   />
                </div>
             )}
             {showDays && (
                <div>
                   <label className="block text-sm font-medium text-slate-400 mb-1">Days / Week</label>
                   <input type="number" max={7} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white"
                     value={formData.days} onChange={(e) => setFormData({...formData, days: parseInt(e.target.value) || 0})}
                   />
                </div>
             )}
          </div>

          {/* 7. Topic/Title */}
          {(showTopic || showLessonTitle) && (
             <div className="space-y-4 bg-slate-950/30 p-4 border border-slate-800 rounded-xl">
               <div className="flex items-center gap-2 mb-2">
                    <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></div>
                    <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Lesson Focus</span>
               </div>
               
               {showTopic && (
                 <div>
                   <label className="block text-sm font-medium text-slate-400 mb-1">Main Topic</label>
                   <input type="text" className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white"
                     placeholder="e.g. Algebra"
                     value={formData.topic} 
                     onChange={(e) => setFormData({...formData, topic: e.target.value})}
                   />
                 </div>
               )}
               {showLessonTitle && (
                 <div>
                   <label className="block text-sm font-medium text-slate-400 mb-1">Sub-topic / Lesson Title</label>
                   <input type="text" className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white"
                     placeholder="e.g. Solving Linear Equations"
                     value={formData.lessonTitle} 
                     onChange={(e) => setFormData({...formData, lessonTitle: e.target.value})}
                   />
                 </div>
               )}
             </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-800 bg-slate-950 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-slate-400 hover:text-white font-medium transition-colors">
            Cancel
          </button>
          <button 
            onClick={handleGenerateClick}
            className={`px-6 py-2 ${currentConfig.color} text-white font-bold rounded-lg shadow-lg transition-all active:scale-95 flex items-center gap-2`}
          >
            {currentConfig.icon}
            {currentConfig.btnText}
          </button>
        </div>

      </div>
    </div>
  );
}