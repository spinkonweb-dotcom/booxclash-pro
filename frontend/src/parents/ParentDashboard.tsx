import React, { useState, useEffect, useCallback } from 'react'; // Import useCallback
// Removed GraduationCap from this import
import { Users, Settings as SettingsIcon, BarChart3 } from 'lucide-react'; // Renamed Settings icon
import ProgressOverview from './ProgressOverview';
import Students from './Students';
import SettingsComponent from './Settings'; // Import Settings component

// Import API and Utils
import { fetchMyChildren } from './api';
import { generateActivityFeed, findFocusStudent } from './dashboardUtils';
import { ApiStudent, ActivityFeedItem } from './dashboardTypes';

// A simple loading component
const DashboardLoading: React.FC = () => (
  <div className="flex justify-center items-center h-64">
    <svg className="animate-spin h-8 w-8 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
    <span className="ml-3 text-lg text-gray-600">Loading Dashboard Data...</span>
  </div>
);

// A simple error component
const DashboardError: React.FC<{ message: string }> = ({ message }) => (
  <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-6 rounded-xl shadow-md" role="alert">
    <p className="font-bold text-xl">Error</p>
    <p>{message}</p>
  </div>
);

const ParentDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'progress' | 'students' | 'settings'>('progress');
  
  // --- State for API Data ---
  const [students, setStudents] = useState<ApiStudent[]>([]);
  const [activityFeed, setActivityFeed] = useState<ActivityFeedItem[]>([]);
  const [focusStudent, setFocusStudent] = useState<ApiStudent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- **FIX 1: Created a stable, reusable function for loading data** ---
  const loadDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const apiStudents = await fetchMyChildren();
      
      // Process and set data
      setStudents(apiStudents);
      setActivityFeed(generateActivityFeed(apiStudents));
      setFocusStudent(findFocusStudent(apiStudents));

    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, []); // Empty dependency array means this function never changes
  
  // --- Data Fetching Effect ---
  useEffect(() => {
    // --- **FIX 2: Call the new function on initial mount** ---
    loadDashboardData();
  }, [loadDashboardData]); // Runs once on component mount

  // --- Navigation Component ---
  const NavItem: React.FC<{ tab: typeof activeTab, icon: React.ReactNode, label: string }> = ({ tab, icon, label }) => {
    const isActive = activeTab === tab;
    return (
      <button
        onClick={() => setActiveTab(tab)}
        className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold transition-colors duration-200 ${
          isActive
            ? 'bg-indigo-600 text-white shadow-md'
            : 'text-gray-600 hover:bg-gray-200'
        }`}
      >
        {icon}
        <span>{label}</span>
      </button>
    );
  };

  // --- Content Rendering ---
  const renderContent = () => {
    if (isLoading) {
      return <DashboardLoading />;
    }
    
    if (error) {
      return <DashboardError message={error} />;
    }
    
    switch (activeTab) {
      case 'progress':
        return (
          <ProgressOverview 
            students={students} 
            activityFeed={activityFeed} 
            focusStudent={focusStudent} 
          />
        );
      case 'students':
        // --- **FIX 3: Pass the REAL `loadDashboardData` function** ---
        // Removed the broken placeholder
        return <Students students={students} refreshData={loadDashboardData} />;
      case 'settings':
        return <SettingsComponent />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      {/* --- HEADER UPDATED --- */}
      <header className="bg-white shadow-md rounded-xl p-4 mb-8">
        {/* Use flex-col on mobile, flex-row on desktop */}
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          
          {/* Column 1: Logo (Left) */}
          <div className="md:w-1/3">
            <a href="/" className="flex items-center">
              {/* Using a placeholder logo. Replace 'src' with your actual logo path. */}
              <img src="/images/logo.webp" alt="Booxclash Logo" className="h-10 w-auto" />
            </a>
          </div>

          {/* Column 2: Title (Center)
          <div className="md:w-1/3 text-center">
            <h1 className="text-xl md:text-xl font-extrabold text-gray-900">
              Dashboard
            </h1>
          </div> */}

          {/* Column 3: Nav Items (Right) */}
          <div className=" flex md:justify-end w-full">
            <div className="flex space-x-3 ">
              <NavItem tab="progress" icon={<BarChart3 className="w-5 h-5" />} label="Progress Overview" />
              <NavItem tab="students" icon={<Users className="w-5 h-5" />} label="Students" />
              <NavItem tab="settings" icon={<SettingsIcon className="w-5 h-5" />} label="Settings" />
            </div>
          </div>
          
        </div>
      </header>

      <main>
        {renderContent()}
      </main>

      <footer className="mt-12 text-center text-gray-500 text-sm">
        &copy; {new Date().getFullYear()} Parent Tracker. All rights reserved.
      </footer>
    </div>
  );
};

export default ParentDashboard;