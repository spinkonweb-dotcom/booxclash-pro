import React, { useState } from 'react';
import { Zap } from 'lucide-react';
import { ApiStudent } from './dashboardTypes';
import { fetchAiRecommendation } from './api'; // Import our new API call

interface AiRecommendationCardProps {
  focusStudent: ApiStudent | null;
}

const AiRecommendationCard: React.FC<AiRecommendationCardProps> = ({ focusStudent }) => {
  const [recommendation, setRecommendation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const generateRecommendation = async () => {
    if (!focusStudent) {
      setError("Focus student data not available.");
      return;
    }

    setLoading(true);
    setRecommendation(null);
    setError(null);

    // --- Build prompt from API data ---
    const lastFiveLessons = focusStudent.lessonsCompleted
      .slice(-5) // Get just the last 5
      .map(l => l.title) // Get their titles
      .join(', '); // Join them with a comma

    const studentDataPrompt = `
        Student Name: ${focusStudent.childName}
        Subject: ${focusStudent.subject}
        Grade: ${focusStudent.childGrade}
        Current Points: ${focusStudent.points}
        Total Lessons Completed: ${focusStudent.lessonsCompleted.length}
        Recent Lessons Completed: ${lastFiveLessons || 'None yet.'}
    `;

    try {
      // This function now calls your backend and gets HTML
      const htmlText = await fetchAiRecommendation(studentDataPrompt);
      setRecommendation(htmlText);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-full py-10">
          <svg className="animate-spin h-6 w-6 text-indigo-500 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-indigo-500">Analyzing data and generating plan...</span>
        </div>
      );
    }
    
    if (error) {
      return <p className="text-red-600 text-center py-4">Error: {error}</p>;
    }
    
    // --- THIS IS THE UPDATED BLOCK ---
    if (recommendation) {
      // The old .split('\n').map(...) is removed.
      // We now render the 'recommendation' string as HTML.
      return (
        <div className="pt-4 space-y-3">
          {/* This will render the <strong> and colored <div> tags from the backend */}
          <div 
            className="text-gray-700 space-y-2 prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: recommendation }} 
          />
          
          <div className="text-right pt-3">
            <button 
              onClick={() => setRecommendation(null)}
              className="text-xs text-indigo-500 hover:text-indigo-700"
            >
              Clear Recommendation
            </button>
          </div>
        </div>
      );
    }

    if (!focusStudent) {
        return (
            <div className="text-center py-6">
                <p className="text-gray-600">No student data available to analyze.</p>
            </div>
        );
    }

    return (
      <div className="text-center py-6">
        <p className="text-gray-600 mb-4">
          Analyze the progress for <span className="font-bold">{focusStudent.childName}</span> and get an immediate, personalized action plan.
        </p>
        <button
          onClick={generateRecommendation}
          className="bg-indigo-500 text-white font-semibold py-2 px-6 rounded-full shadow-md hover:bg-indigo-600 transition duration-150 flex items-center justify-center mx-auto"
        >
          <Zap className="w-5 h-5 mr-2" />
          Generate Action Plan
        </button>
      </div>
    );
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-2xl border-l-4 border-indigo-500 transition-all">
      <h3 className="text-xl font-bold text-gray-800 mb-2 flex items-center">
        <Zap className="w-5 h-5 mr-2 text-indigo-500 fill-indigo-100" />
        AI Intervention Recommendation
      </h3>
      <p className="text-sm text-gray-500 mb-4 border-b pb-2">
        {focusStudent 
          ? `Focusing on ${focusStudent.childName} (${focusStudent.lessonsCompleted.length} lessons in ${focusStudent.subject})`
          : 'No student selected'
        }
      </p>
      {renderContent()}
    </div>
  );
};

export default AiRecommendationCard;