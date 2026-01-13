import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import "./index.css";
import HomePage from './HomePage';
import Signup from './SignUp';
import Login from './Login';
import Dashboard from './Admin/Dashboard';
import AboutUs from './AboutUs';
import Contact from './Contact';
import KnockoutGame from './Games/KnockoutGame';
import Lessons from './Lessons';
import Game from './Game';
import KnockoutHome from './Games/KnockoutHome';
import ChildSetup from './ChildSetup';
import CurriculumSelector from './CurriculumSelector';
import DynamicDashboardRouter from './DynamicDashboardRouter';
import ChildSelector from './ChildSelector';
import ParentDashboard from './parents/ParentDashboard';
import SignupBooxclashPro from './booxclash-pro/SignupBooxclashPro';
import TeacherDashboard from './booxclash-pro/TeacherDashboard';
import StudentDashboard from './booxclash-pro/StudentDashboard';
import Schemes from './booxclash-pro/Schemes';
import WeeklyView from './booxclash-pro/WeeklyView';
import LessonPlanView from './booxclash-pro/LessonPlanView';
import UpgradePage from './booxclash-pro/Upgrade';

// --- NEW "GATEKEEPER" COMPONENT ---
// This component automatically routes the user based on their login state.
const AppEntry: React.FC = () => {
    const parentToken = sessionStorage.getItem("token");
    const childDataJSON = sessionStorage.getItem("childData");

    if (parentToken && childDataJSON) {
        // CASE 1: Parent is logged in AND a child was already selected.
        // Go straight to that child's dashboard for the "ever open" experience.
        const child = JSON.parse(childDataJSON);
        return <Navigate to={`/FoundationDashboard/${child.curriculum}/${child.subject}/${child.childGrade}`} replace />;
    } else if (parentToken) {
        // CASE 2: Parent is logged in but NO child was selected.
        // Go to the child selection screen.
        return <Navigate to="/child-selector" replace />;
    } else {
        // CASE 3: No one is logged in.
        // Go to the public homepage or login screen.
        return <Navigate to="/home" replace />;
    }
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* --- UPDATED ROUTES --- */}
        {/* The root path "/" now uses our gatekeeper to auto-redirect */}
        <Route path="/" element={<AppEntry />} />
        
        {/* Publicly accessible routes */}
        <Route path="/home" element={<HomePage />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/home-booxclash-pro" element={<SignupBooxclashPro />} />
        <Route path="/teacher-dashboard" element={<TeacherDashboard />} />
        <Route path="/student-portal" element={<StudentDashboard />} />
        <Route path="/schemes" element={<Schemes />} />
        <Route path="/lesson-view" element={<LessonPlanView />} />
        <Route path="/upgrade" element={<UpgradePage />} />
        {/* Authenticated/Protected routes */}
        <Route path="/dashboard/admin" element={<Dashboard />} />
        <Route path="/parent-dashboard" element={<ParentDashboard />} />
        <Route path="/child-setup" element={<ChildSetup />} />
        <Route path="/child-selector" element={<ChildSelector />} />
        <Route path="/curriculum-selector" element={<CurriculumSelector />} />
        
        {/* The dynamic dashboard route for the child's game */}
        <Route 
          path="/FoundationDashboard/:curriculumType/:subject/:grade"
          element={<DynamicDashboardRouter />}
        />

        {/* Game routes (can be public or protected as needed) */}
        <Route path="/knockout-lobby" element={<KnockoutGame />} />
        <Route path="/knockout-home" element={<KnockoutHome />} />
        <Route path="/lessons" element={<Lessons />} />
        <Route path="/games" element={<Game />} />
        <Route path="/weekly-view" element={<WeeklyView />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);