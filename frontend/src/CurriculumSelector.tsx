import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";  

interface ChildData {
  _id?: string;
  childName: string;
  childGrade: number;
  avatarUrl?: string;
  parentId?: string;
  curriculum?: string;
  subject?: string;
}

const CurriculumSelector: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [child, setChild] = useState<ChildData | null>(null);
  
  const [selectionStep, setSelectionStep] = useState<'curriculum' | 'subject'>('curriculum');
  const [selectedCurriculum, setSelectedCurriculum] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stateWrapper = location.state?.child as any;
    const actualChild: ChildData | undefined = stateWrapper?.child ? stateWrapper.child : stateWrapper;

    if (actualChild) {
      setChild(actualChild);
      sessionStorage.setItem("childData", JSON.stringify(actualChild));
    } else {
      const savedData = sessionStorage.getItem("childData");
      if (savedData) {
        setChild(JSON.parse(savedData));
      } else {
        navigate("/child-setup");
      }
    }
  }, [location.state, navigate]);

  const handleCurriculumClick = (curriculumType: string) => {
    setSelectedCurriculum(curriculumType);
    setSelectionStep('subject');
  };

  const handleSubjectClick = async (subjectType: string) => {
    const token = sessionStorage.getItem("token");
    if (!child?._id || !selectedCurriculum) {
      setError("An error occurred. Please start over.");
      return;
    }
    if (!token) {
        setError("You are not logged in. Please log in again.");
        return;
    }

    setSelectedSubject(subjectType);
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/api/children/${child._id}`, {
        method: 'PATCH',
        headers: { 
            'Content-Type': 'application/json',
            // --- THIS HEADER IS THE FIX ---
            // You must send the parent's token to authorize the request
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          curriculum: selectedCurriculum,
          subject: subjectType 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save selection. Please try again.');
      }

      const data = await response.json();
      const updatedChild: ChildData = data.child;

      sessionStorage.setItem("childData", JSON.stringify(updatedChild));
      navigate(`/FoundationDashboard/${updatedChild.curriculum}/${updatedChild.subject}/${updatedChild.childGrade}`, {
        state: { child: updatedChild },
      });

    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
      setSelectedSubject(null);
    }
  };

  if (!child) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-gray-600 text-lg">
        Loading child information...
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-orange-50 to-white p-6">
      <div className="flex flex-col items-center mb-8 text-center">
        {child.avatarUrl ? (
          <img
            src={child.avatarUrl}
            alt={`${child.childName}'s avatar`}
            className="w-24 h-24 rounded-full border-4 border-orange-400 shadow-md mb-4"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-gray-300 mb-4 flex items-center justify-center text-gray-600">
            No Avatar
          </div>
        )}
        <h2 className="text-3xl font-bold text-gray-800 mb-1">
          Welcome, {child.childName}!
        </h2>
        <p className="text-lg text-gray-600">
          You are in <span className="font-semibold">Grade {child.childGrade}</span>.
          {selectionStep === 'curriculum' 
            ? " Please select a curriculum to begin."
            : " Now, please select a subject."
          }
        </p>
      </div>

      {selectionStep === 'curriculum' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-fade-in">
          <button
            onClick={() => handleCurriculumClick("local")}
            className="px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold shadow-lg transition-all duration-200"
          >
            Local Curriculum
          </button>
          <button
            onClick={() => handleCurriculumClick("cambridge")}
            className="px-8 py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold shadow-lg transition-all duration-200"
          >
            Cambridge Curriculum
          </button>
        </div>
      )}

      {selectionStep === 'subject' && (
        <div className="w-full max-w-md animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <button
              onClick={() => handleSubjectClick("math-science")}
              disabled={isLoading}
              className="px-8 py-4 bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold shadow-lg transition-all duration-200 disabled:bg-gray-400"
            >
              {isLoading && selectedSubject === 'math-science' ? "Saving..." : "Math/Science"}
            </button>
            <button
              onClick={() => handleSubjectClick("reading")}
              disabled={isLoading}
              className="px-8 py-4 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-semibold shadow-lg transition-all duration-200 disabled:bg-gray-400"
            >
              {isLoading && selectedSubject === 'reading' ? "Saving..." : "Reading"}
            </button>
          </div>
          <button 
            onClick={() => setSelectionStep('curriculum')}
            className="mt-6 flex items-center justify-center gap-2 text-gray-600 hover:text-black w-full"
            disabled={isLoading}
          >
            <ArrowLeft size={18} /> Go Back
          </button>
        </div>
      )}

      {error && <p className="mt-4 text-red-600 font-semibold">{error}</p>}
    </div>
  );
};

export default CurriculumSelector;
