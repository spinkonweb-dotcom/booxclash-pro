"use client";

import { useState, useEffect } from 'react';
import { UploadCloud, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function AdminUpload() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [resultMsg, setResultMsg] = useState("");
  
  // New: specific loading text that changes over time
  const [loadingText, setLoadingText] = useState("Initializing...");

  // Cycle through messages to keep user entertained/informed
  useEffect(() => {
    if (!loading) return;
    
    const messages = [
        "🚀 Uploading PDF to Server...",
        "📄 Extracting text from pages...",
        "🧠 Sending to AI for Analysis...",
        "🔍 AI is identifying Grades & Topics...",
        "💾 Saving extracted data to Database...",
        "✨ Almost done..."
    ];
    
    let i = 0;
    setLoadingText(messages[0]);
    
    const interval = setInterval(() => {
        i = (i + 1) % messages.length;
        setLoadingText(messages[i]);
    }, 2500); // Change message every 2.5 seconds

    return () => clearInterval(interval);
  }, [loading]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
        setStatus("error: Please select a file");
        return;
    }

    console.log("🚀 [Client] Starting Upload Process...");
    console.log(`📂 [Client] Selected File: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);

    setLoading(true);
    setStatus("processing"); 
    setResultMsg("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      console.log("⏳ [Client] Sending request to Backend...");
      
      const res = await fetch("http://127.0.0.1:8000/api/v1/admin/upload-syllabus", {
        method: "POST",
        body: formData,
      });

      console.log(`📡 [Client] Response Status: ${res.status}`);
      const data = await res.json();
      console.log("📦 [Client] Response Data:", data);
      
      if (res.ok) {
        setStatus("success");
        setResultMsg(data.message || "Upload successful!");
        setFile(null); // Clear file after success
      } else {
        setStatus(`error: ${data.detail || "Unknown Server Error"}`);
        console.error("❌ [Client] Server Error Detail:", data);
      }
    } catch (err) {
      console.error("❌ [Client] Network Error:", err);
      setStatus("error: Connection failed. Is the Backend running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-white font-sans">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
        
        <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-blue-600/20 rounded-lg">
                <UploadCloud className="text-blue-500 w-8 h-8" />
            </div>
            <div>
                <h1 className="text-2xl font-bold">Auto Syllabus Parser</h1>
                <p className="text-slate-500 text-sm">Upload PDF - AI extracts Grades 5-12</p>
            </div>
        </div>

        <form onSubmit={handleUpload} className="space-y-6">
            
            {/* File Input */}
            <div className="border-2 border-dashed border-slate-800 rounded-xl p-10 flex flex-col items-center justify-center text-center hover:bg-slate-800/50 transition-colors cursor-pointer relative group">
                <input 
                    type="file" 
                    accept=".pdf"
                    onChange={(e) => {
                        setFile(e.target.files ? e.target.files[0] : null);
                        setStatus(null); // Reset status on new selection
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                />
                
                {file ? (
                    <div className="flex flex-col items-center gap-2 text-blue-400">
                        <FileText size={40} className="animate-pulse" />
                        <span className="font-medium truncate max-w-[200px] text-lg">{file.name}</span>
                        <span className="text-xs text-slate-500">Ready to analyze</span>
                    </div>
                ) : (
                    <>
                        <div className="p-4 bg-slate-800 rounded-full mb-3 group-hover:scale-110 transition-transform">
                             <UploadCloud size={24} className="text-slate-400" />
                        </div>
                        <p className="text-slate-300 font-medium">Click to Upload Syllabus PDF</p>
                        <p className="text-xs text-slate-600 mt-1">Supports Primary & Secondary (Grades 5-12)</p>
                    </>
                )}
            </div>

            {/* Submit Button */}
            <button 
                type="submit" 
                disabled={loading}
                className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                    loading ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20'
                }`}
            >
                {loading ? (
                    <div className="flex items-center gap-2">
                        <Loader2 className="animate-spin" /> 
                        <span className="animate-pulse">{loadingText}</span>
                    </div>
                ) : (
                    'Process Syllabus'
                )}
            </button>

            {/* Status Messages */}
            {status === 'success' && (
                <div className="flex flex-col gap-1 text-green-400 bg-green-900/20 p-4 rounded-lg border border-green-900/50 text-sm">
                    <div className="flex items-center gap-2 font-bold">
                        <CheckCircle size={16} /> Analysis Complete!
                    </div>
                    <p className="opacity-80 pl-6">{resultMsg}</p>
                </div>
            )}
            
            {status?.startsWith('error') && (
                <div className="flex items-center gap-2 text-red-400 bg-red-900/20 p-4 rounded-lg border border-red-900/50 text-sm">
                    <AlertCircle size={16} /> {status.replace('error:', '')}
                </div>
            )}

        </form>
      </div>
    </div>
  );
}