import { useState } from "react";
import {
  User,
  BookOpen,
  Gamepad2,
  FlaskConical,
  LogOut,
  Menu,
  X,
  Palette,
} from "lucide-react";

import Profile from "./Profile.tsx"; // Corrected: Added .tsx extension
// Removed: PlacementTest is no longer administered
// import Games from "./Games.tsx"; // Corrected: Added .tsx extension
import StudentsLabHome from "./vsl/StudentsLabHome.tsx"; // Corrected: Added .tsx extension
import SubjectSelection from "./SubjectSelection.tsx"; // Corrected: Added .tsx extension
import KnockoutGame from "../Games/KnockoutHome.tsx";

interface SidebarProps {
  onStartLesson: (details: {
    subject: string;
    level: number;
    topic: string;
    curriculum: "Local" | "Cambridge";
  }) => void;
  userLevel: number;
  token: string;
}


const themes = {
  purple: {
    name: "Purple Focus",
    primary: "from-purple-900 via-purple-800 to-indigo-900",
    secondary: "from-purple-600 to-indigo-600",
    accent: "bg-purple-600",
    accentHover: "hover:bg-purple-700",
    text: "text-purple-700",
    lightText: "text-purple-300",
    cardBg: "bg-white/95",
    border: "border-purple-200",
    glowEffect: "shadow-purple-500/20",
  },
  green: {
    name: "Nature Green",
    primary: "from-emerald-900 via-green-800 to-teal-900",
    secondary: "from-emerald-600 to-green-600",
    accent: "bg-emerald-600",
    accentHover: "hover:bg-emerald-700",
    text: "text-emerald-700",
    lightText: "text-emerald-300",
    cardBg: "bg-white/95",
    border: "border-emerald-200",
    glowEffect: "shadow-emerald-500/20",
  },
  blue: {
    name: "Ocean Blue",
    primary: "from-blue-900 via-cyan-800 to-blue-900",
    secondary: "from-blue-600 to-cyan-600",
    accent: "bg-blue-600",
    accentHover: "hover:bg-blue-700",
    text: "text-blue-700",
    lightText: "text-blue-300",
    cardBg: "bg-white/95",
    border: "border-blue-200",
    glowEffect: "shadow-blue-500/20",
  },
};

type MenuItem =
  | "Profile"
  | "Hands On Learning"
  | "Games"
  | "Subscription"
  | "Virtual Science Lab"
  | "Stats"
  | "Logout";

const menuItems: { key: MenuItem; label: string; icon: any; color: string }[] = [
  { key: "Profile", label: "Profile", icon: User, color: "text-purple-600" },
  { key: "Hands On Learning", label: "Hands On Learning", icon: BookOpen, color: "text-blue-600" },
  { key: "Games", label: "Games", icon: Gamepad2, color: "text-orange-500" },
  { key: "Virtual Science Lab", label: "Virtual Science Lab", icon: FlaskConical, color: "text-green-500" },
  { key: "Logout", label: "Logout", icon: LogOut, color: "text-red-500" },
];

type NavigationState = {
  page: "themes" | "subjects" | "lessons" | "lesson-interface";
  data?: any;
};

export default function Sidebar({  }: SidebarProps) {
  const [selectedItem, setSelectedItem] = useState<MenuItem>("Hands On Learning");
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<keyof typeof themes>("purple");
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const theme = themes[currentTheme];
  // Removed API_BASE since the placement test API call is removed.
  // If other parts of the app still need it, it should be passed as a prop or defined elsewhere.

  // Removed all state related to placement test
  // const [mathLevel, setMathLevel] = useState<number | null>(null);
  // const [, setScienceLevel] = useState<number | null>(null);
  // const [placementCompleted, setPlacementCompleted] = useState<boolean | null>(null);
  // const [isLoadingPlacementStatus, setIsLoadingPlacementStatus] = useState(true);

  // New navigation state
  const [navigation, setNavigation] = useState<NavigationState>({ page: "themes" });

  // Token is now passed as a prop and used directly if needed for other components
  // const token = sessionStorage.getItem("token"); // This is now a prop

  // Removed useEffect for fetching placement status

  // Removed handlePlacementTestComplete function

  const renderComponent = () => {
    switch (selectedItem) {
      case "Profile":
        return <Profile />;
      case "Hands On Learning":
        // Direct navigation to FoundationLanding as placement test is removed
        if (navigation.page === "themes") {
        } else if (navigation.page === "subjects") {
          return (
            <SubjectSelection
              onSelectSubject={(subject) => {
                setNavigation({ page: "lessons", data: { ...navigation.data, subject } });
              }}
              onBack={() => setNavigation({ page: "themes" })}
            />
          );
        } else if (navigation.page === "lessons") {
        }

        break;
      case "Games":
        return <KnockoutGame />;
      case "Virtual Science Lab":
        return <StudentsLabHome />;
      case "Logout":
        return (
          <div className="flex flex-col items-center justify-center h-full">
            <h2 className="text-xl font-bold mb-2">You have been logged out.</h2>
            <p className="text-gray-600">Please close the window or log in again.</p>
          </div>
        );
      default:
        return <div>Select a menu item</div>;
    }
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      {/* Theme Switcher */}
      <div className="fixed top-4 right-4 md:top-6 md:right-6 z-50">
        <div className="relative">
          <button
            onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full ${theme.accent} text-white shadow-lg ${theme.accentHover} transition-all duration-300 hover:scale-105 font-medium`}
          >
            <Palette size={18} />
            <span className="hidden sm:inline">Theme</span>
          </button>
          {isThemeMenuOpen && (
            <div className="absolute top-full right-0 mt-2 w-40 bg-white rounded-xl shadow-xl border p-2 space-y-1">
              {Object.entries(themes).map(([key, themeData]) => (
                <button
                  key={key}
                  onClick={() => {
                    setCurrentTheme(key as keyof typeof themes);
                    setIsThemeMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-200 text-sm font-medium ${
                    currentTheme === key
                      ? `${themes[key as keyof typeof themes].accent} text-white`
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {themeData.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Overlay */}
      {menuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 fixed md:static top-0 left-0 w-80 h-full ${theme.cardBg} backdrop-blur-sm shadow-2xl transition-transform duration-300 ease-in-out z-40 flex flex-col border-r ${theme.border}`}
      >
        {/* Sidebar Header */}
        <div className="p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-full ${theme.accent} flex items-center justify-center`}
              >
                <FlaskConical className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className={`text-xl font-bold ${theme.text}`}>BooxClash</h2>
                <p className="text-sm text-gray-500">Interactive Education</p>
              </div>
            </div>
            <button
              onClick={() => setMenuOpen(false)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = selectedItem === item.key;

              return (
                <li key={item.key}>
                  <button
                    onClick={() => {
                      setSelectedItem(item.key);
                      setMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-left ${
                      isActive
                        ? `${theme.accent} text-white shadow-lg ${theme.glowEffect} scale-105`
                        : "text-gray-700 hover:bg-gray-100 hover:scale-102"
                    }`}
                  >
                    <IconComponent
                      size={20}
                      className={isActive ? "text-white" : item.color}
                    />
                    <span className="font-medium">{item.label}</span>
                    {isActive && (
                      <div className="ml-auto w-2 h-2 bg-white rounded-full" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer User Info */}
        <div className="p-4 border-t border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-800">Student</p>
              <p className="text-xs text-gray-500">Premium Member</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Unified Header */}
        <header className="flex-shrink-0 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between p-4 md:p-6">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className={`md:hidden p-2 rounded-lg ${theme.accent} text-white ${theme.accentHover} transition-all duration-200`}
            >
              <Menu size={24} />
            </button>
            {/* Page Title */}
            <h1 className={`text-xl md:text-2xl font-bold ${theme.text} capitalize`}>
              {selectedItem}
            </h1>
            {/* Spacer to center title on mobile */}
            <div className="w-10 h-10 md:hidden" />
          </div>
        </header>

        {/* Scrollable Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-7xl mx-auto">{renderComponent()}</div>
        </main>
      </div>
    </div>
  );
}
