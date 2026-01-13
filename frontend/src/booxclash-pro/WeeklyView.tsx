import { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Loader2, CloudUpload, FileText, 
  Calendar, GraduationCap, Printer, CheckCircle2,
  FileDown, Info
} from 'lucide-react'; 
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { db, auth } from './firebase'; 
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'; 

// Brand Constants
const BRAND_PRIMARY: [number, number, number] = [79, 70, 229]; // Indigo-600
const BRAND_ACCENT = 'bg-indigo-600 hover:bg-indigo-700';

export default function WeeklyView() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  const { planData, meta } = location.state || {};

  useEffect(() => {
    if (!planData || !meta) {
      navigate('/teacher-dashboard'); 
    }
  }, [planData, meta, navigate]);

  if (!planData) return null; 

  // --- HELPERS ---
  const schoolName = meta.school || planData.school || "Global Academy";
  const startDate = meta.startDate ? new Date(meta.startDate) : new Date();
  
  const formattedStartDate = startDate.toLocaleDateString('en-GB');
  const getFormattedEndDate = () => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + 4); 
    return d.toLocaleDateString('en-GB');
  };

  const handleSaveToCloud = async () => {
    if (!auth.currentUser) return;
    setSaving(true);
    try {
        await addDoc(collection(db, "generated_weekly_plans"), {
            userId: auth.currentUser.uid,
            ...meta, 
            school: schoolName,
            planData: planData, 
            createdAt: serverTimestamp(),
            type: "Weekly Forecast"
        });
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
        alert(`Failed to save: ${err.message}`);
    } finally {
        setSaving(false);
    }
  };

  // --- PROFESSIONAL PDF GENERATOR ---
  const handleDownloadPDF = useCallback(() => {
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // 1. Brand Header
    doc.setFillColor(248, 250, 252);
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(22);
    doc.text(schoolName.toUpperCase(), 14, 18);
    
    doc.setFontSize(9);
    doc.setTextColor(79, 70, 229); // Indigo
    doc.text("WEEKLY FORECAST & CURRICULUM TRACKING", 14, 25);

    // 2. Info Grid
    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85);
    doc.text(`Subject: ${meta.subject}`, 14, 34);
    doc.text(`Grade: ${meta.grade} | Week: ${meta.weekNumber}`, pageWidth / 2, 34, { align: "center" });
    doc.text(`Dates: ${formattedStartDate} - ${getFormattedEndDate()}`, pageWidth - 14, 34, { align: "right" });

    // 3. Table Construction
    const tableBody = (planData.days || []).map((day: any, index: number) => {
        const dayName = (day.day || `Day ${index + 1}`).toString().toUpperCase();
        const outcomes = (day.objectives || []).map((o: string) => `• ${o}`).join("\n");
        const aids = `Standard: ${planData.materials?.slice(0,2).join(", ") || "N/A"}\nLocal: Sticks, Stones, Bottle tops`;

        return [
            index === 0 ? meta.weekNumber : "",
            `${dayName}\n\n${day.subtopic}\n\n(Assessment Integrated)`,
            outcomes,
            aids,
            `Grade ${meta.grade} Syllabus\nPupil's Book`,
            ""
        ];
    });

    autoTable(doc, {
        startY: 45,
        head: [['WK', 'TOPIC / CONTENT', 'SPECIFIC OUTCOMES', 'LEARNING AIDS', 'REFERENCES', 'REMARKS']],
        body: tableBody,
        theme: 'grid',
        headStyles: { fillColor: BRAND_PRIMARY, fontSize: 10, fontStyle: 'bold', halign: 'center' },
        styles: { fontSize: 8.5, cellPadding: 4, valign: 'top' },
        columnStyles: { 0: { cellWidth: 12, halign: 'center' }, 1: { cellWidth: 55, fontStyle: 'bold' }, 2: { cellWidth: 80 } },
    });

    // 4. SIGNATURE FOOTER (Matching your standard)
    // @ts-ignore
    const finalY = doc.lastAutoTable.finalY || 150;
    const footerY = Math.min(finalY + 25, pageHeight - 30);

    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.8);
    doc.line(14, footerY, 100, footerY);
    doc.line(pageWidth - 100, footerY, pageWidth - 14, footerY);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("INSTRUCTOR SIGNATURE", 14, footerY + 6);
    doc.text("DEPARTMENT HEAD / SUPERVISOR", pageWidth - 14, footerY + 6, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text("DATE: ____ / ____ / 202 __", 14, footerY + 12);
    doc.text("STAMP / DATE: ____ / ____ / 202 __", pageWidth - 14, footerY + 12, { align: "right" });

    doc.save(`${meta.subject}_Week${meta.weekNumber}_Forecast.pdf`);
  }, [planData, meta, schoolName, formattedStartDate]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans pb-20">
      
      {/* --- MODERN NAVBAR --- */}
      <nav className="bg-white/70 backdrop-blur-xl border-b border-slate-200 px-8 py-5 sticky top-0 z-50 flex justify-between items-center">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate('/teacher-dashboard')} className="p-3 hover:bg-slate-100 rounded-2xl text-slate-400 hover:text-indigo-600 transition-all">
            <ArrowLeft size={22} />
          </button>
          <div className="h-10 w-[1px] bg-slate-200 hidden md:block" />
          <div>
             <h1 className="font-black text-slate-900 text-lg leading-none">{meta.subject}</h1>
             <p className="text-xs font-bold text-indigo-500 mt-1 uppercase tracking-wider">
                WEEK {meta.weekNumber} • {meta.grade} • {meta.term}
             </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={handleSaveToCloud} 
            disabled={saving || saveSuccess}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all ${
              saveSuccess ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : saveSuccess ? <CheckCircle2 size={18} /> : <CloudUpload size={18} />}
            <span className="hidden sm:inline">{saving ? "Syncing..." : saveSuccess ? "Saved" : "Save to Cloud"}</span>
          </button>

          <button 
            onClick={handleDownloadPDF} 
            className={`flex items-center gap-2 px-6 py-3 ${BRAND_ACCENT} text-white rounded-2xl text-sm font-black shadow-lg shadow-indigo-200 transition-all active:scale-95`}
          >
            <FileDown size={18} /> <span>EXPORT PDF</span>
          </button>
        </div>
      </nav>

      {/* --- UI PREVIEW (MODERN PAPER) --- */}
      <main className="max-w-[1200px] mx-auto py-12 px-6">
        <div className="bg-white shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] rounded-[2.5rem] overflow-hidden border border-slate-100">
            
            {/* PREVIEW HEADER */}
            <div className="bg-slate-50 p-10 border-b border-slate-100">
                <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                    <div>
                        <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight leading-none">{schoolName}</h2>
                        <p className="text-indigo-600 font-black text-sm tracking-[0.2em] mt-3 uppercase">Weekly Forecast & Lesson Plan</p>
                    </div>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                        <div className="text-slate-400 font-bold">WEEK BEGINNING:</div>
                        <div className="text-slate-900 font-bold">{formattedStartDate}</div>
                        <div className="text-slate-400 font-bold">WEEK ENDING:</div>
                        <div className="text-slate-900 font-bold">{getFormattedEndDate()}</div>
                    </div>
                </div>
            </div>

            {/* PREVIEW TABLE */}
            <div className="p-2">
                <table className="w-full border-collapse text-xs">
                    <thead>
                        <tr className="bg-indigo-600 text-white uppercase tracking-widest font-black">
                            <th className="p-4 w-12 border border-indigo-700">WK</th>
                            <th className="p-4 w-1/4 text-left border border-indigo-700">Topic / Content</th>
                            <th className="p-4 w-1/3 text-left border border-indigo-700">Specific Outcomes</th>
                            <th className="p-4 text-left border border-indigo-700">Learning Aids</th>
                            <th className="p-4 text-left border border-indigo-700">Refs</th>
                        </tr>
                    </thead>
                    <tbody>
                        {planData.days?.map((day: any, index: number) => (
                            <tr key={index} className="hover:bg-slate-50 transition-colors">
                                <td className="p-4 text-center align-top border border-slate-100 font-black text-slate-300">
                                    {index === 0 ? meta.weekNumber : ""}
                                </td>
                                <td className="p-4 align-top border border-slate-100">
                                    <span className="inline-block px-2 py-1 bg-indigo-50 text-indigo-600 rounded-md font-black text-[10px] mb-2">
                                        {(day.day || `DAY ${index+1}`).toUpperCase()}
                                    </span>
                                    <div className="font-bold text-slate-900 text-sm leading-tight">{day.subtopic}</div>
                                    <div className="text-[10px] text-slate-400 mt-2 font-bold italic">Assessment Integrated</div>
                                </td>
                                <td className="p-4 align-top border border-slate-100">
                                    <ul className="space-y-2">
                                        {(day.objectives || []).map((obj: string, i: number) => (
                                            <li key={i} className="flex gap-2 text-slate-600">
                                                <span className="text-indigo-400 font-bold">•</span>
                                                {obj}
                                            </li>
                                        ))}
                                    </ul>
                                </td>
                                <td className="p-4 align-top border border-slate-100 text-slate-500">
                                    <div className="mb-3">
                                        <p className="text-[10px] font-black text-slate-300 uppercase mb-1">Standard</p>
                                        <p className="leading-tight font-medium text-slate-600">{planData.materials?.slice(0,2).join(", ")}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-300 uppercase mb-1">Local</p>
                                        <p className="leading-tight italic">Sticks, Stones, Bottle tops</p>
                                    </div>
                                </td>
                                <td className="p-4 align-top border border-slate-100 text-slate-400 italic">
                                    Grade {meta.grade} Syllabus<br/>Pupil's Book
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* SIGNATURE AREA (PREVIEW) */}
            <div className="p-12 mt-8 grid grid-cols-2 gap-24">
                <div className="border-t-2 border-slate-900 pt-4">
                    <p className="font-black text-[11px] uppercase text-slate-900 tracking-tighter">Instructor Signature</p>
                    <p className="text-[10px] text-slate-400 mt-2 font-mono">DATE: ____/____/202__</p>
                </div>
                <div className="border-t-2 border-slate-900 pt-4 text-right">
                    <p className="font-black text-[11px] uppercase text-slate-900 tracking-tighter">Department Head / Supervisor</p>
                    <p className="text-[10px] text-slate-400 mt-2 font-mono">STAMP/DATE: ____/____/202__</p>
                </div>
            </div>
        </div>
      </main>
    </div>
  );
}