import React from 'react';

// --- Types ---
export interface SchemeRow {
  month?: string;
  monthSpan?: number;
  week?: string;
  weekSpan?: number;
  topic?: string;
  topicSpan?: number;
  period?: string;
  content?: string[];
  outcomes?: string[];
  references?: string[];
  isSpecialRow?: boolean; 
}

interface SchemesOfWorkProps {
  schoolName?: string;
  termInfo?: string;
  subject?: string;
  grade?: string;
  startDate?: string;
  data: SchemeRow[];
}

const SchemesOfWork: React.FC<SchemesOfWorkProps> = ({
  schoolName = "Global Academy",
  termInfo = "First Term",
  subject = "Subject",
  grade = "Grade",
  data = [],
}) => {

  return (
    <div className="w-full bg-white text-slate-800 font-sans shadow-inner print:shadow-none">
      
      {/* 1. Header Section - Matches PDF Style */}
      <div className="bg-slate-50 p-8 border-b border-slate-200">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{schoolName}</h1>
            <p className="text-indigo-600 font-bold text-sm tracking-widest mt-1">
              {subject.toUpperCase()} • GRADE {grade.toUpperCase()}
            </p>
          </div>
          <div className="text-right">
            <p className="text-slate-500 text-xs font-bold uppercase">{termInfo}</p>
            <p className="text-slate-400 text-[10px] mt-1">Prepared: {new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* 2. The Table - Matches PDF AutoTable Configuration */}
      <div className="p-1">
        <table className="w-full border-collapse table-fixed text-[11px] leading-relaxed">
          <thead>
            <tr className="bg-indigo-600 text-white uppercase tracking-wider">
              <th className="border border-indigo-700 p-3 w-[80px] text-center font-bold">Month</th>
              <th className="border border-indigo-700 p-3 w-[120px] text-center font-bold">Week</th>
              <th className="border border-indigo-700 p-3 w-[180px] text-left font-bold">Topic</th>
              <th className="border border-indigo-700 p-3 text-left font-bold">Learning Content</th>
              <th className="border border-indigo-700 p-3 text-left font-bold">Expected Outcomes</th>
              <th className="border border-indigo-700 p-3 w-[120px] text-left font-bold">Resources</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {data.length === 0 ? (
               <tr>
                 <td colSpan={6} className="p-12 text-center text-slate-400 italic bg-slate-50">
                   Waiting for syllabus data generation...
                 </td>
               </tr>
            ) : (
              data.map((row, index) => (
                <tr key={index} className={row.isSpecialRow ? "bg-slate-50" : "hover:bg-indigo-50/30 transition-colors"}>
                  
                  {/* Month Cell */}
                  <td className="border border-slate-200 p-3 text-center font-bold text-slate-600 align-top">
                    {row.month}
                  </td>

                  {/* Week Cell (Contains the Date Range) */}
                  <td className="border border-slate-200 p-3 text-center align-top">
                    <div className="font-bold text-slate-900">{row.week}</div>
                  </td>

                  {/* Body Content */}
                  {row.isSpecialRow ? (
                    <td colSpan={4} className="border border-slate-200 p-4 text-center font-black text-indigo-600 uppercase tracking-[0.2em] italic">
                       --- {row.topic || "REVISION & ASSESSMENT"} ---
                    </td>
                  ) : (
                    <>
                      {/* Topic */}
                      <td className="border border-slate-200 p-3 font-bold text-slate-800 align-top">
                        {row.topic}
                      </td>
                      
                      {/* Content List - Styled to match PDF "• " join */}
                      <td className="border border-slate-200 p-3 align-top text-slate-600">
                        <div className="space-y-1">
                          {(row.content ?? []).map((item, i) => (
                            <div key={i} className="flex gap-2">
                              <span className="text-indigo-400">•</span>
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                      </td>

                      {/* Outcomes List */}
                      <td className="border border-slate-200 p-3 align-top text-slate-600">
                        <div className="space-y-1">
                          {(row.outcomes ?? []).map((item, i) => (
                            <div key={i} className="flex gap-2">
                              <span className="text-indigo-400">•</span>
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                      </td>

                      {/* References */}
                      <td className="border border-slate-200 p-3 align-top text-slate-500 italic text-[10px]">
                        {(row.references ?? []).map((item, i) => (
                          <div key={i} className="mb-1">{item}</div>
                        ))}
                      </td>
                    </>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 3. Footer Signatures */}
      <div className="p-12 grid grid-cols-2 gap-24">
        <div className="border-t-2 border-slate-900 pt-3">
          <p className="font-black text-[10px] uppercase tracking-tighter text-slate-900">Teacher's Signature</p>
          <p className="text-[10px] text-slate-400 mt-2 font-mono">DATE: ____/____/202__</p>
        </div>
        <div className="border-t-2 border-slate-900 pt-3 text-right">
          <p className="font-black text-[10px] uppercase tracking-tighter text-slate-900">Department Head / Supervisor</p>
          <p className="text-[10px] text-slate-400 mt-2 font-mono">STAMP/DATE: ____/____/202__</p>
        </div>
      </div>
    </div>
  );
};

export default SchemesOfWork;