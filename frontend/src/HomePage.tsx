import { lazy, useState } from "react";
import { Link } from "react-router-dom";
import BackgroundSlider from "./BackgroundSlider"; // <-- 1. IMPORT THE SLIDER
import { 
    CheckCircle, Puzzle, Play, Lightbulb, MousePointer, FlaskRound as Flask, 
    Palette, Users, BookOpen, Award, Globe, Gamepad2, Sparkles, Brain, 
    XCircle, Book, Clock, ArrowRight, LayoutDashboard, HeartHandshake, WifiOff, Languages 
} from 'lucide-react';
const Navbar = lazy(() => import("./Navbar"));
// Theme definitions (unchanged)
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
    glowEffect: "shadow-purple-500/20"
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
    glowEffect: "shadow-emerald-500/20"
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
    glowEffect: "shadow-blue-500/20"
  }
};

const HomePage = () => {
  const [currentTheme, setCurrentTheme] = useState<keyof typeof themes>('purple');
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const theme = themes[currentTheme];
  
  return (
    <>
      <>
        <title>BooxClash Learn - Learning that COUNTS!</title>
        <meta
          name="description"
          content="Welcome to BooxClash Learn – Fun, Interactive learning for students with games, lessons, and videos that make education exciting."
        />
        <meta name="keywords" content="BooxClash, home, education, interactive learning" />
        <link rel="canonical" href="https://booxclashlearn.com/" />
      </>
        <div className="relative">
      {/* Theme Switcher - Unchanged */}
      <div className="fixed top-20 right-6 z-50">
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
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {themeData.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* --- 2. MAIN CONTAINER: NOW A POSITIONING WRAPPER --- */}
      {/* The old gradient background classes are removed from here. */}
    <div className="relative min-h-screen w-full text-white">
      {/* --- 3. BACKGROUND SLIDER --- */}
      <BackgroundSlider />

      {/* --- 4. CONTENT WRAPPER --- */}
      <div className="relative z-20 flex flex-col items-center w-full">
        <Navbar />
        <div className="w-full">
          {/* Hero Section */}
          <section className="text-white pt-24 pb-12 px-6 text-center w-full">
            <div className="w-full mx-auto">
              <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight drop-shadow-lg">
                Learning <span className="bg-gradient-to-r from-orange-400 to-pink-500 text-transparent bg-clip-text">that COUNTS.</span>
              </h1>
                <p className="text-xl md:text-2xl mb-8 font-normal text-gray-200 leading-relaxed font-poppins">
                  <span className="font-bold text-white">BooxClash</span> turns boring lessons into epic quests. 
                  Master any subject through fun games and interactive challenges that boost retention.
                </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
                <Link
                  to="/signup"
                  className="bg-orange-600 text-white font-semibold text-lg px-8 py-4 rounded-full hover:bg-orange-700 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  Start Your Adventure
                </Link>
                <Link 
                  to="/home-booxclash-pro"
                  className={`${theme.accent} text-white font-semibold text-lg px-8 py-4 rounded-full ${theme.accentHover} transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl`}
                >
                  Try BooxClash Pro
                </Link>
              </div>
              <div className="mt-12 flex justify-center items-center gap-6 text-gray-300">
                <div className="flex items-center gap-2">
                  <Gamepad2 size={20} className="text-green-400" />
                  <span className="font-medium drop-shadow-sm">Fun & Gamified</span>
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles size={20} className="text-yellow-400" />
                  <span className="font-medium drop-shadow-sm">Engaging</span>
                </div>
                <div className="flex items-center gap-2">
                  <Brain size={20} className="text-purple-400" />
                  <span className="font-medium drop-shadow-sm">High Retention</span>
                </div>
              </div>
            </div>
          </section>

          {/* Comparison Section */}
          <section className="py-20 px-6 w-full">
            <h2 className="text-4xl font-bold text-center mb-12 text-white drop-shadow-md">
              A Smarter Way to Learn
            </h2>
            <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
              <div className="bg-gray-900/40 border border-gray-600 p-8 rounded-2xl backdrop-blur-lg">
                <h3 className="text-2xl font-bold text-gray-200 text-center mb-6">The Old Way</h3>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3 text-lg"><XCircle className="text-red-400 mt-1 flex-shrink-0" /><span className="text-gray-300">Passive recall and memorization.</span></li>
                  <li className="flex items-start gap-3 text-lg"><Book className="text-gray-400 mt-1 flex-shrink-0" /><span className="text-gray-300">Limited to static text and MCQs.</span></li>
                  <li className="flex items-start gap-3 text-lg"><Clock className="text-gray-400 mt-1 flex-shrink-0" /><span className="text-gray-300">Stressful, timed "guess-fast" quizzes.</span></li>
                  <li className="flex items-start gap-3 text-lg"><Globe className="text-gray-400 mt-1 flex-shrink-0" /><span className="text-gray-300">Generic, one-size-fits-all content.</span></li>
                </ul>
              </div>
              <div className={`${theme.cardBg} p-8 rounded-2xl shadow-2xl ${theme.border} border-2`}>
                <h3 className={`text-2xl font-bold ${theme.text} text-center mb-6`}>The BooxClash Adventure</h3>
                <ul className="space-y-4 text-gray-800">
                  <li className="flex items-start gap-3 text-lg"><CheckCircle className="text-green-500 mt-1 flex-shrink-0" /><span className="font-semibold">Active learning through hands-on play.</span></li>
                  <li className="flex items-start gap-3 text-lg"><Gamepad2 className="text-orange-500 mt-1 flex-shrink-0" /><span className="font-semibold">Interactive games, simulations, and videos.</span></li>
                  <li className="flex items-start gap-3 text-lg"><Brain className="text-purple-500 mt-1 flex-shrink-0" /><span className="font-semibold">A complete journey that builds deep understanding.</span></li>
                  <li className="flex items-start gap-3 text-lg"><Sparkles className="text-yellow-500 mt-1 flex-shrink-0" /><span className="font-semibold">Locally aligned curriculum that resonates.</span></li>
                </ul>
              </div>
            </div>
          </section>

          {/* Learning Journey Section */}
          <section className="py-20 px-6 text-center w-full">
            <h2 className="text-4xl font-bold mb-16 text-white drop-shadow-md">
              Your Path to Mastery
            </h2>
            <div className="flex flex-wrap items-center justify-center gap-8">
              {[
                { icon: Play, title: "START", desc: "Begin your learning adventure", bgColor: "bg-orange-100", textColor: "text-orange-700" },
                { icon: Lightbulb, title: "DISCOVER", desc: "Explore new concepts", bgColor: "bg-blue-100", textColor: "text-blue-700" },
                { icon: BookOpen, title: "WATCH", desc: "Engage with video lessons", bgColor: "bg-purple-100", textColor: "text-purple-700" },
                { icon: Puzzle, title: "PRACTICE", desc: "Interactive activities", bgColor: "bg-green-100", textColor: "text-green-700" },
                { icon: CheckCircle, title: "REFLECT", desc: "Think about what you learned", bgColor: "bg-indigo-100", textColor: "text-indigo-700" },
                { icon: Award, title: "MASTER", desc: "Test your understanding", bgColor: "bg-pink-100", textColor: "text-pink-700" }
              ].map((item, index, arr) => (
                <>
                  <div key={item.title} className={`${theme.cardBg} p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer border ${theme.border} w-full sm:w-64`}>
                    <div className={`w-16 h-16 rounded-full ${item.bgColor} ${item.textColor} flex items-center justify-center mb-4 mx-auto`}><item.icon size={28} /></div>
                    <h3 className={`font-bold text-xl mb-3 ${item.textColor}`}>{item.title}</h3>
                    <p className="text-gray-600">{item.desc}</p>
                  </div>
                  {index < arr.length - 1 && (<div className="hidden lg:flex text-gray-400"><ArrowRight size={32} /></div>)}
                </>
              ))}
            </div>
          </section>

          {/* Game Modes Section */}
          <section className="py-20 px-6 w-full">
            <h2 className="text-4xl font-bold text-center mb-16 text-white drop-shadow-md">Interactive Learning Modes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                { title: "Multiplayer Battles", desc: "Compete with friends in real-time quiz tournaments", icon: Users, gradient: "from-orange-500 to-red-500" },
                { title: "Drag & Drop Games", desc: "Manipulate objects to solve math and science problems", icon: MousePointer, gradient: "from-blue-500 to-cyan-500" },
                { title: "Science Simulations", desc: "Experiment safely with virtual lab environments", icon: Flask, gradient: "from-purple-500 to-pink-500" },
                { title: "Adaptive Learning", desc: "AI-powered quizzes that adjust to your skill level", icon: Lightbulb, gradient: "from-green-500 to-emerald-500" }
              ].map((game) => (
                <div key={game.title} className={`relative rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer bg-gradient-to-br ${game.gradient} p-8 text-white`}>
                  <div className="w-16 h-16 rounded-full bg-white/20 text-white flex items-center justify-center mb-6"><game.icon size={28} /></div>
                  <h3 className="text-2xl font-bold mb-4">{game.title}</h3>
                  <p className="text-lg opacity-90">{game.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Educators Section */}
          <section className={`${theme.cardBg} py-20 px-6 rounded-2xl my-16 w-full shadow-2xl border ${theme.border}`}>
            <h2 className={`text-4xl font-bold text-center mb-16 ${theme.text}`}>Built for Educators & Parents</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { icon: LayoutDashboard, title: "Teacher Dashboard", desc: "Track student progress and insights" },
                { icon: HeartHandshake, title: "Parent Portal", desc: "Monitor your child's learning journey" },
                { icon: WifiOff, title: "Offline Access", desc: "Learn anywhere, anytime" },
                { icon: Languages, title: "Local Languages", desc: "Content in familiar languages" }
              ].map((feature) => (
                <div key={feature.title} className="text-center p-6 rounded-xl hover:bg-gray-50 transition-all duration-300 hover:scale-105 cursor-pointer">
                  <div className={`text-4xl mb-4 inline-block p-4 rounded-full bg-gray-100 ${theme.text}`}><feature.icon size={32} /></div>
                  <h3 className="font-bold text-lg mb-2 text-gray-800">{feature.title}</h3>
                  <p className="text-gray-600">{feature.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Final CTA Section */}
          <section className="bg-gradient-to-r from-orange-600 to-orange-500 text-white py-24 text-center my-16 w-full shadow-2xl">
            <h2 className="text-5xl font-bold mb-6">Ready to Transform Learning?</h2>
            <p className="text-xl mb-8 opacity-90">Join thousands of students already learning with BooxClash</p>
            <div className="flex flex-col sm:flex-row justify-center gap-6">
              <Link
                to="/signup"
                className="bg-white text-orange-800 font-bold text-lg px-8 py-4 rounded-full hover:bg-gray-100 transition-all duration-300 hover:scale-105 shadow-lg"
              >
                Start Free Trial
              </Link>

              <Link to="/demo" className="border-2 border-white text-white font-bold text-lg px-8 py-4 rounded-full hover:bg-white hover:text-orange-600 transition-all duration-300 hover:scale-105">Schedule Demo</Link>
            </div>
          </section>

          {/* Footer Section */}
          <footer className="bg-gray-900/80 text-gray-300 py-12 text-center backdrop-blur-sm w-full">
            <div className="mb-6 flex flex-wrap justify-center gap-6">
              {["About", "Features", "Pricing", "Contact", "Schools"].map((item) => (
                <Link key={item} to={`/${item.toLowerCase()}`} className="hover:text-white transition-colors duration-200 font-medium">{item}</Link>
              ))}
            </div>
            <p className="text-sm opacity-75">&copy; {new Date().getFullYear()} BooxClash Learn. All rights reserved.</p>
          </footer>
        </div>
      </div>
    </div>

        </div>
    </>

  );
};

export default HomePage;