import { useState, useEffect, useRef, lazy } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Users, Target, Award, Gamepad2, Video, MousePointer, Palette, ArrowRight } from "lucide-react";
const Navbar = lazy(() => import("./Navbar"));
// Theme definitions matching HomePage
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

const AboutUs = () => {
  const vantaRef = useRef<HTMLDivElement>(null);
  const [currentTheme, setCurrentTheme] = useState<keyof typeof themes>('purple');
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const theme = themes[currentTheme];

  useEffect(() => {
    const loadScripts = async () => {
      const loadScript = (src: string) =>
        new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.src = src;
          script.async = true;
          script.onload = () => resolve();
          script.onerror = () => reject(new Error(`Failed to load ${src}`));
          document.body.appendChild(script);
        });

      try {
        await loadScript("https://cdnjs.cloudflare.com/ajax/libs/three.js/r121/three.min.js");
        await loadScript("https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.net.min.js");

        if (window.VANTA && vantaRef.current) {
          window.VANTA.NET({
            el: vantaRef.current,
            mouseControls: true,
            touchControls: true,
            gyroControls: false,
            minHeight: 200.0,
            minWidth: 200.0,
            scale: 1.0,
            scaleMobile: 1.0,
            backgroundColor: currentTheme === 'purple' ? 0x1a0f2e : 
                           currentTheme === 'green' ? 0x0f2d1a : 0x0f1729,
            color: currentTheme === 'purple' ? 0x8b5cf6 : 
                   currentTheme === 'green' ? 0x10b981 : 0x3b82f6,
          });
        }
      } catch (err) {
        console.error("Vanta or THREE failed to load", err);
      }
    };

    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(loadScripts);
    } else {
      setTimeout(loadScripts, 3000);
    }

    return () => {
      if (window.VANTA && window.VANTA.current) {
        window.VANTA.current.destroy();
      }
    };
  }, [currentTheme]);

  const features = [
    {
      icon: Gamepad2,
      title: "Interactive Games",
      description: "Engaging quiz battles and multiplayer tournaments that make learning competitive and fun.",
      color: "text-orange-600",
      bgColor: "bg-orange-100"
    },
    {
      icon: Video,
      title: "Educational Videos",
      description: "High-quality video content that explains complex concepts in simple, digestible ways.",
      color: "text-blue-600",
      bgColor: "bg-blue-100"
    },
    {
      icon: MousePointer,
      title: "Drag & Drop Activities",
      description: "Hands-on learning experiences that let students manipulate objects to solve problems.",
      color: "text-green-600",
      bgColor: "bg-green-100"
    },
    {
      icon: Target,
      title: "Curriculum Aligned",
      description: "Content specifically designed to match local K-12 curriculum standards and requirements.",
      color: "text-purple-600",
      bgColor: "bg-purple-100"
    }
  ];

  const stats = [
    { number: "10K+", label: "Active Students", icon: Users },
    { number: "500+", label: "Learning Activities", icon: BookOpen },
    { number: "95%", label: "Engagement Rate", icon: Target },
    { number: "50+", label: "Schools Partner", icon: Award }
  ];

  return (
    <>
  <title>About Us – BooxClash Learn</title>
  <meta
    name="description"
    content="Learn more about BooxClash Learn, our mission, our team, and how we are transforming education through fun, interactive content."
  />
  <meta name="keywords" content="BooxClash Learn, about us, education platform, mission" />
  <link rel="canonical" href="https://booxclashlearn.com/about" />

      <div className="relative">
      {/* Theme Switcher */}
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

      <div
        ref={vantaRef}
        className={`min-h-screen w-full bg-gradient-to-br ${theme.primary} transition-all duration-1000`}
      >
        <Navbar />

        <div className="relative z-10 pt-20">
          {/* Hero Section */}
          <section className="py-20 px-6 text-center">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
                About <span className="text-orange-400">BooxClash Learn</span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-200 mb-8 leading-relaxed">
                Transforming education through interactive learning experiences that engage, inspire, and empower students worldwide.
              </p>
            </div>
          </section>

          {/* Mission Section */}
          <section className={`py-20 px-6 max-w-6xl mx-auto ${theme.cardBg} rounded-2xl my-16 shadow-2xl border ${theme.border}`}>
            <div className="text-center mb-12">
              <h2 className={`text-4xl font-bold ${theme.text} mb-6`}>Our Mission</h2>
              <p className="text-lg text-gray-700 max-w-3xl mx-auto leading-relaxed">
                BooxClash Learn is an interactive learning platform designed to make education fun and engaging for students from K–12. 
                Through fun games, videos, and drag-and-drop activities, we help learners boost their math and science skills while keeping them excited and motivated.
                Our mission is to bridge the engagement gap in traditional education using modern, curriculum-aligned tools.
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className={`w-16 h-16 rounded-full ${theme.accent} text-white flex items-center justify-center mb-4 mx-auto`}>
                    <stat.icon size={24} />
                  </div>
                  <div className={`text-3xl font-bold ${theme.text} mb-2`}>{stat.number}</div>
                  <div className="text-gray-600 font-medium">{stat.label}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Features Section */}
          <section className="py-20 px-6 max-w-7xl mx-auto">
            <h2 className="text-4xl font-bold text-center text-white mb-16">
              What Makes Us Different
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {features.map((feature, index) => (
                <div 
                  key={index}
                  className={`${theme.cardBg} p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer border ${theme.border}`}
                >
                  <div className={`w-16 h-16 rounded-full ${feature.bgColor} ${feature.color} flex items-center justify-center mb-6`}>
                    <feature.icon size={28} />
                  </div>
                  <h3 className={`text-2xl font-bold ${feature.color} mb-4`}>{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Vision Section */}
          <section className={`py-20 px-6 max-w-6xl mx-auto ${theme.cardBg} rounded-2xl my-16 shadow-2xl border ${theme.border}`}>
            <div className="text-center">
              <h2 className={`text-4xl font-bold ${theme.text} mb-8`}>Our Vision</h2>
              <p className="text-lg text-gray-700 max-w-3xl mx-auto leading-relaxed mb-8">
                We envision a world where every student has access to engaging, high-quality education that adapts to their learning style. 
                By combining technology with proven pedagogical methods, we're creating the future of learning.
              </p>
              <div className="grid md:grid-cols-3 gap-8 mt-12">
                <div className="text-center">
                  <div className="text-4xl mb-4">🎯</div>
                  <h3 className="font-bold text-lg mb-2 text-gray-800">Personalized Learning</h3>
                  <p className="text-gray-600">Adaptive content that meets each student where they are</p>
                </div>
                <div className="text-center">
                  <div className="text-4xl mb-4">🌍</div>
                  <h3 className="font-bold text-lg mb-2 text-gray-800">Global Accessibility</h3>
                  <p className="text-gray-600">Quality education available to students everywhere</p>
                </div>
                <div className="text-center">
                  <div className="text-4xl mb-4">🚀</div>
                  <h3 className="font-bold text-lg mb-2 text-gray-800">Innovation First</h3>
                  <p className="text-gray-600">Cutting-edge technology driving educational excellence</p>
                </div>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="py-20 px-6 text-center">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-4xl font-bold text-white mb-6">
                Ready to Transform Learning?
              </h2>
              <p className="text-xl text-gray-200 mb-8">
                Join thousands of students and educators who are already experiencing the BooxClash Learn difference.
              </p>
              <Link to="/signup">
                <button className={`${theme.accent} text-white px-8 py-4 rounded-full text-lg font-semibold ${theme.accentHover} transition-all duration-300 hover:scale-105 shadow-lg ${theme.glowEffect} flex items-center gap-2 mx-auto`}>
                  Get Started Today
                  <ArrowRight size={20} />
                </button>
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
</>


  );
};

export default AboutUs;
