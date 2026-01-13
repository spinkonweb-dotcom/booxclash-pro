import { useEffect, useState, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Printer, Loader2, 
  CloudUpload, CheckCircle2, AlertCircle, FileDown,
  Globe, Layout
} from 'lucide-react'; 
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { db, auth } from './firebase'; 
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'; 
import { onAuthStateChanged } from 'firebase/auth'; 

import SchemesOfWork, { SchemeRow } from './SchemesOfWork';

const API_BASE =
  import.meta.env?.VITE_API_BASE ||
  (window.location.hostname === 'localhost'
    ? 'http://localhost:8000'
    : 'https://booxclash-pro.onrender.com');

const BRAND_PRIMARY: [number, number, number] = [79, 70, 229]; 
const BRAND_ACCENT = 'bg-indigo-600 hover:bg-indigo-700';

export default function Schemes() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedData, setGeneratedData] = useState<SchemeRow[]>([]);
  
  const hasFetched = useRef(false);

  const { 
    school, schoolName, term, subject, grade, 
    weeks, startDate, schemeData, existingData 
  } = location.state || {};

  const displaySchool = school || schoolName || "Global Academy";
  const displayGrade = grade?.toString() || "N/A";

  useEffect(() => {
    if (!location.state) {
      navigate('/teacher-dashboard');
      return;
    }

    if (schemeData && Array.isArray(schemeData)) {
      setGeneratedData(schemeData);
      setLoading(false);
      return;
    }

    if (existingData && Array.isArray(existingData)) {
      setGeneratedData(existingData);
      setLoading(false);
      return;
    }

    if (hasFetched.current) return;
    hasFetched.current = true;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setError("Please sign in to view this curriculum.");
        setLoading(false);
        return;
      }

      try {
        const token = await user.getIdToken();
        const response = await fetch(`${API_BASE}/api/v1/generate-scheme`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`, 
            'X-User-ID': user.uid               
          },
          body: JSON.stringify({
            schoolName: displaySchool,
            term,
            subject,
            grade: displayGrade, 
            weeks: parseInt(weeks || "13"),
            startDate 
          }),
        });

        if (response.status === 402 || response.status === 403) {
          navigate('/upgrade');
          return;
        }

        if (!response.ok) throw new Error("Could not reach the AI Syllabus engine.");

        const data = await response.json();
        setGeneratedData(data);
      } catch (err: any) {
        setError(err.message || "Connection failure.");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [location.state, navigate, displaySchool, term, subject, displayGrade, weeks, startDate, schemeData, existingData]);

  // --- PDF GENERATION WITH IMAGE-MATCHED FOOTER ---
  const handleDownloadPDF = useCallback(() => {
    if (!generatedData.length) return;

    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // 1. Header Styling
    doc.setFillColor(248, 250, 252);
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(22);
    doc.text("SCHEME OF WORK", 14, 18);

    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85);
    
    // ✅ BOLD School Name Requirement
    doc.setFont("helvetica", "bold");
    doc.text(`School: ${displaySchool}`, 14, 34);
    
    doc.setFont("helvetica", "normal");
    doc.text(`${subject} | Grade ${displayGrade}`, pageWidth / 2, 34, { align: "center" });
    doc.text(`Term: ${term} | Prepared: ${new Date().toLocaleDateString()}`, pageWidth - 14, 34, { align: "right" });

    // 2. Table
    const tableBody: string[][] = generatedData.map(row => [
      row.month || "", 
      row.week || "", 
      row.topic || "",
      Array.isArray(row.content) ? row.content.join("\n• ") : (row.content || ""),
      Array.isArray(row.outcomes) ? row.outcomes.join("\n• ") : (row.outcomes || ""),
      Array.isArray(row.references) ? row.references.join("\n") : (row.references || "")
    ]);

    autoTable(doc, {
      head: [["Month", "Week", "Topic", "Learning Content", "Expected Outcomes", "Resources"]],
      body: tableBody,
      startY: 42,
      theme: 'grid',
      headStyles: { 
        fillColor: BRAND_PRIMARY, 
        fontSize: 10, 
        fontStyle: 'bold',
        halign: 'center',
        cellPadding: 4
      },
      styles: { fontSize: 8.5, cellPadding: 3, valign: 'top' },
      columnStyles: { 0: { cellWidth: 20 }, 1: { cellWidth: 35 }, 4: { cellWidth: 55 } },
      didParseCell: (data) => {
        if (generatedData[data.row.index]?.isSpecialRow) {
          data.cell.styles.fillColor = [241, 245, 249];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    });

    // 3. ✅ SIGNATURE FOOTER (Matching Image)
    // @ts-ignore
    const finalY = (doc as any).lastAutoTable.finalY || 150;
    let footerY = finalY + 25;

    // Check for page overflow
    if (footerY + 20 > pageHeight) {
       doc.addPage();
       footerY = 40; // Reset Y on new page
    }

    // Drawing the Thick Black Lines
    doc.setDrawColor(15, 23, 42); // Slate-900 (Deep Black/Navy)
    doc.setLineWidth(0.8);
    doc.line(14, footerY, 120, footerY); // Left Line
    doc.line(pageWidth - 120, footerY, pageWidth - 14, footerY); // Right Line

    // Signature Labels (Bold)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text("TEACHER'S SIGNATURE", 14, footerY + 6);
    doc.text("DEPARTMENT HEAD / SUPERVISOR", pageWidth - 14, footerY + 6, { align: "right" });

    // Date Placeholders (Slate Grey)
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // Slate-400
    doc.text("DATE:  ____ / ____ / 202 __", 14, footerY + 12);
    doc.text("STAMP / DATE:  ____ / ____ / 202 __", pageWidth - 14, footerY + 12, { align: "right" });

    doc.save(`${subject}_Scheme_of_Work.pdf`);
  }, [generatedData, displaySchool, subject, displayGrade, term]);

  const handleSaveToCloud = async () => {
    if (!auth.currentUser || saving) return;
    setSaving(true);
    try {
      await addDoc(collection(db, "generated_schemes"), {
        userId: auth.currentUser.uid,
        schoolName: displaySchool, term, subject, grade: displayGrade,
        weeks, startDate, schemeData: generatedData, 
        createdAt: serverTimestamp(), type: "scheme"
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert("Save failed.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-2">Architecting Curriculum</h2>
            <p className="text-indigo-400 flex items-center gap-2 justify-center">
              <Globe size={16} className="animate-pulse" /> Synchronizing Global Standards...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white p-10 rounded-[2rem] shadow-2xl max-w-md w-full text-center border border-slate-100">
          <AlertCircle size={48} className="text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900">System Interruption</h2>
          <p className="text-slate-500 mt-2 mb-8">{error}</p>
          <button onClick={() => navigate('/teacher-dashboard')} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold">Return to Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans">
      <nav className="bg-white/70 backdrop-blur-xl border-b border-slate-200 px-8 py-5 sticky top-0 z-50 flex justify-between items-center">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate('/teacher-dashboard')} className="p-3 hover:bg-slate-100 rounded-2xl text-slate-400 hover:text-indigo-600 transition-all">
            <ArrowLeft size={22} />
          </button>
          <div className="h-10 w-[1px] bg-slate-200 hidden md:block" />
          <div>
             <h1 className="font-black text-slate-900 text-lg leading-none">{subject}</h1>
             <p className="text-xs font-bold text-indigo-500 mt-1 flex items-center gap-1">
                <Layout size={12} /> GRADE {displayGrade} • {term?.toUpperCase()}
             </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => window.print()} className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-600 hover:bg-slate-50 transition-all">
            <Printer size={20} />
          </button>

          <button 
            onClick={handleSaveToCloud} 
            disabled={saving || saveSuccess}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all ${
              saveSuccess ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-white border border-slate-200 text-slate-700'
            }`}
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : saveSuccess ? <CheckCircle2 size={18} /> : <CloudUpload size={18} />}
            <span className="hidden sm:inline">{saving ? "Syncing..." : saveSuccess ? "Synced" : "Save to Cloud"}</span>
          </button>

          <button 
            onClick={handleDownloadPDF} 
            className={`flex items-center gap-2 px-6 py-3 ${BRAND_ACCENT} text-white rounded-2xl text-sm font-black shadow-lg shadow-indigo-200 transition-all active:scale-95`}
          >
            <FileDown size={18} /> <span>EXPORT PDF</span>
          </button>
        </div>
      </nav>

      <main className="max-w-[1200px] mx-auto py-12 px-6">
        <div className="bg-white shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] rounded-[2.5rem] overflow-hidden border border-slate-100 p-2">
          <SchemesOfWork 
            schoolName={displaySchool}
            termInfo={term}
            subject={subject}
            grade={displayGrade}
            data={generatedData}
            startDate={startDate}
          />
        </div>
      </main>
    </div>
  );
}