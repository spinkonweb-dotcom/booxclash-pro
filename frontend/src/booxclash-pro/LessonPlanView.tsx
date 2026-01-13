import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, CloudUpload, Printer, Loader2 } from 'lucide-react'; 
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { db, auth } from './firebase'; 
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'; 

export default function LessonPlanView() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [saving, setSaving] = useState(false);
  
  // 1. EXTRACT DATA
  const { lessonData, meta } = location.state || {};
  // Fallback: If school is inside lessonData (from Python), use it. Otherwise use meta.
  const schoolName = lessonData?.schoolName || meta?.school || "Primary School";
  const planData = lessonData; 

  // 2. SAFETY CHECK
  useEffect(() => {
    if (!planData || !meta) {
      console.warn("Missing lesson data, redirecting...");
      navigate('/teacher-dashboard'); 
    }
  }, [planData, meta, navigate]);

  if (!planData) return null; 

  const handleSaveToCloud = async () => {
    if (!auth.currentUser) return alert("You must be logged in to save.");
    
    setSaving(true);
    try {
        await addDoc(collection(db, "generated_lesson_plans"), {
            userId: auth.currentUser.uid,
            ...meta, 
            school: schoolName, // Ensure school is saved correctly
            planData: planData, 
            createdAt: serverTimestamp(),
            type: "Lesson Plan"
        });
        alert("Lesson Plan saved to your Dashboard!");
    } catch (err: any) {
        console.error("Error saving document:", err);
        alert(`Failed to save: ${err.message}`);
    } finally {
        setSaving(false);
    }
  };

  // ---------------------------------------------------------
  // 🖨️ PDF GENERATOR - MATCHING THE PREVIEW EXACTLY
  // ---------------------------------------------------------
  const handleDownloadPDF = () => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    let yPos = 20;

    // --- 1. HEADER ---
    doc.setFont("times", "bold");
    doc.setFontSize(14);
    doc.text(`${(meta.subject || "SUBJECT").toUpperCase()} LESSON PLAN`, pageWidth / 2, yPos, { align: "center" });

    // --- 2. METADATA GRID ---
    yPos += 12;
    doc.setFontSize(10); // Standard readable size
    doc.setFont("times", "normal");
    
    const leftX = margin;
    const rightX = pageWidth / 2 + 10;
    const lineHeight = 6;

    // We use a helper to ensure null values don't crash the PDF
    const txt = (str: any) => str || "";

    // Left Column
    doc.text(`Teacher: ${txt(planData.teacherName || meta.teacherName || auth.currentUser?.displayName)}`, leftX, yPos);
    doc.text(`Grade: ${txt(meta.grade)}`, leftX, yPos + lineHeight);
    doc.text(`Subject: ${txt(meta.subject)}`, leftX, yPos + lineHeight * 2);
    doc.text(`Topic: ${txt(planData.topic || meta.topic)}`, leftX, yPos + lineHeight * 3);
    doc.text(`Sub-topic: ${txt(planData.subtopic)}`, leftX, yPos + lineHeight * 4);
    
    // Right Column
    doc.text(`School: ${txt(schoolName)}`, rightX, yPos);
    doc.text(`Time: ${txt(planData.time)}`, rightX, yPos + lineHeight);
    doc.text(`Duration: ${txt(planData.duration || "40 minutes")}`, rightX, yPos + lineHeight * 2);
    
    const boys = meta.boys || planData.enrolment?.boys || 0;
    const girls = meta.girls || planData.enrolment?.girls || 0;
    const total = parseInt(boys) + parseInt(girls);
    
    doc.text(`Enrolment: Boys: ${boys}   Girls: ${girls}   Total: ${total}`, rightX, yPos + lineHeight * 3);
    doc.text(`Date: ${txt(planData.date || meta.startDate || "..................")}`, rightX, yPos + lineHeight * 4);

    yPos += 35; // Move down after metadata

    // --- 3. TEXT BLOCKS (Rationale, etc.) ---
    const drawBlock = (label: string, content: string) => {
        if (!content) return; 
        
        doc.setFont("times", "bold");
        doc.text(label, margin, yPos);
        const labelWidth = doc.getTextWidth(label);
        
        doc.setFont("times", "normal");
        // Split text to fit page width minus margins
        const splitText = doc.splitTextToSize(content, pageWidth - margin - labelWidth - 15);
        doc.text(splitText, margin + labelWidth + 2, yPos);
        
        // Calculate new Y position based on number of lines
        yPos += (splitText.length * 5) + 3;
    };

    drawBlock("Rationale: ", planData.rationale);
    drawBlock("Specific Competence: ", planData.competence);
    drawBlock("Expected Standard: ", planData.standard);
    drawBlock("Pre-Requisite Knowledge: ", planData.prerequisite);
    drawBlock("Teaching/Learning Aids: ", planData.materials);
    drawBlock("References: ", planData.references || `Zambian Syllabus Grade ${meta.grade}`);

    yPos += 5; // Extra spacing before table

    // --- 4. TABLE GENERATION ---
    const tableHeaders = [['STAGE', 'TEACHER ACTIVITIES', 'LEARNER ACTIVITY', 'METHOD', 'TIME']];
    
    // Prepare rows
    const stepsData = Array.isArray(planData.steps) ? planData.steps : [];
    const tableBody = stepsData.map((step: any) => [
        { content: step.stage || "", styles: { fontStyle: 'bold' } },
        step.teacherActivity || "",
        step.learnerActivity || "",
        step.method || "",
        step.time || ""
    ]);

    autoTable(doc, {
        startY: yPos,
        head: tableHeaders,
        body: tableBody,
        theme: 'grid', // Gives the distinct black borders
        styles: {
            font: "times",
            fontSize: 9,
            lineColor: [0, 0, 0], // Black borders
            lineWidth: 0.1,
            textColor: [0, 0, 0], // Black text
            cellPadding: 3,
            valign: 'top',
            overflow: 'linebreak' // Crucial for bullet points wrapping
        },
        headStyles: {
            fillColor: [240, 240, 240], // Light gray header
            textColor: [0, 0, 0],
            fontStyle: 'bold',
            lineWidth: 0.1,
            lineColor: [0, 0, 0]
        },
        columnStyles: {
            0: { cellWidth: 22, fontStyle: 'bold' }, // Stage
            1: { cellWidth: 60 }, // Teacher (Wider)
            2: { cellWidth: 60 }, // Learner (Wider)
            3: { cellWidth: 30 }, // Method
            4: { cellWidth: 18 }  // Time
        },
        didDrawPage: (data) => {
             // Update yPos for whatever comes after the table
             yPos = data.cursor?.y || yPos; 
        }
    });

    // --- 5. FOOTER (Evaluation) ---
    // Ensure we don't write over the table if it broke pages
    let finalY = (doc as any).lastAutoTable.finalY + 10;
    
    // Check if we need a new page for the footer
    if (finalY > 270) {
        doc.addPage();
        finalY = 20;
    }
    
    doc.setFont("times", "bold");
    doc.text("Evaluation: ", margin, finalY);
    // Draw lines for evaluation
    doc.setLineWidth(0.1);
    doc.line(margin + 20, finalY, pageWidth - margin, finalY); // First line next to "Evaluation:"
    doc.line(margin, finalY + 8, pageWidth - margin, finalY + 8); // Second line
    
    // --- 6. SAVE FILENAME ---
    // Clean the subtopic to be filename-safe
    const safeSubtopic = (planData.subtopic || "Lesson").replace(/[^a-z0-9]/gi, '_').substring(0, 30);
    const filename = `LessonPlan_Grade${meta.grade}_${safeSubtopic}.pdf`;
    
    doc.save(filename);
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans pb-20">
      
      {/* Top Navigation */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-20 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/teacher-dashboard')} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
             <h1 className="font-bold text-slate-800 leading-tight">Lesson Plan Preview</h1>
             <p className="text-xs text-slate-500">{schoolName} • {meta.subject}</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button onClick={handleSaveToCloud} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-slate-100 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-200 disabled:opacity-50 transition-colors">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <CloudUpload size={16} />}
            {saving ? "Saving..." : "Save"}
          </button>
          
          <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 shadow-md transition-colors">
            <Printer size={16} /> Print / PDF
          </button>
        </div>
      </div>

      {/* 📄 PAPER PREVIEW (HTML) */}
      {/* This strictly mimics the Times New Roman / Word Doc styling */}
      <div className="max-w-[210mm] mx-auto my-8 bg-white shadow-2xl p-[20mm] min-h-[297mm] text-black font-serif text-[11pt] leading-snug">
        
        {/* Header */}
        <div className="text-center mb-6">
            <h3 className="text-lg font-bold uppercase underline decoration-1 underline-offset-4">
                {meta.subject} LESSON PLAN
            </h3>
        </div>

        {/* Metadata Grid */}
        <div className="flex justify-between mb-6">
            <div className="space-y-1 w-1/2">
                <p><strong>Teacher:</strong> {planData.teacherName || meta.teacherName}</p>
                <p><strong>Grade:</strong> {meta.grade}</p>
                <p><strong>Subject:</strong> {meta.subject}</p>
                <p><strong>Topic:</strong> {planData.topic}</p>
                <p><strong>Sub-topic:</strong> {planData.subtopic}</p>
            </div>
            <div className="space-y-1 w-1/2 text-right">
                <p><strong>School:</strong> {schoolName}</p>
                <p><strong>Time:</strong> {planData.time}</p>
                <p><strong>Duration:</strong> {planData.duration || "40 min"}</p>
                <p><strong>Enrolment:</strong> 
                   B: {meta.boys || planData.enrolment?.boys || 0} / 
                   G: {meta.girls || planData.enrolment?.girls || 0} / 
                   Total: {parseInt(meta.boys || 0) + parseInt(meta.girls || 0)}
                </p>
                <p><strong>Date:</strong> {planData.date || "......................"}</p>
            </div>
        </div>

        {/* Text Blocks */}
        <div className="space-y-3 mb-6 text-justify">
            {[
                { label: "Rationale", content: planData.rationale },
                { label: "Specific Competence", content: planData.competence },
                { label: "Expected Standard", content: planData.standard },
                { label: "Pre-Requisite Knowledge", content: planData.prerequisite },
                { label: "Teaching/Learning Aids", content: planData.materials },
                { label: "References", content: planData.references },
            ].map((block, idx) => (
                block.content && (
                    <div key={idx} className="flex gap-2">
                        <strong className="whitespace-nowrap">{block.label}:</strong>
                        <span>{block.content}</span>
                    </div>
                )
            ))}
        </div>

        {/* The Table */}
        <table className="w-full border-collapse border border-black mb-8 text-[10pt]">
            <thead>
                <tr>
                    {['STAGE', 'TEACHER ACTIVITIES', 'LEARNER ACTIVITY', 'METHOD', 'TIME'].map((h, i) => (
                        <th key={i} className="border border-black p-2 text-left bg-gray-100 font-bold uppercase">
                            {h}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {(planData.steps || []).map((step: any, idx: number) => (
                    <tr key={idx}>
                        <td className="border border-black p-2 font-bold align-top whitespace-nowrap">{step.stage}</td>
                        {/* pre-line ensures \n renders as new line */}
                        <td className="border border-black p-2 align-top whitespace-pre-line">{step.teacherActivity}</td>
                        <td className="border border-black p-2 align-top whitespace-pre-line">{step.learnerActivity}</td>
                        <td className="border border-black p-2 align-top">{step.method}</td>
                        <td className="border border-black p-2 align-top">{step.time}</td>
                    </tr>
                ))}
            </tbody>
        </table>

        {/* Evaluation Footer */}
        <div className="mt-8">
            <div className="flex gap-2 items-end">
                <strong>Evaluation:</strong>
                <div className="flex-1 border-b border-black h-5"></div>
            </div>
            <div className="w-full border-b border-black h-8"></div>
        </div>

      </div>
    </div>
  );
}