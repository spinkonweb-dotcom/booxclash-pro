import React, { useState, useEffect, useRef, lazy } from "react";
import emailjs from "emailjs-com";
import { Mail, Phone, User, MessageSquare, Send, MapPin, Clock, Palette } from "lucide-react";
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
//updated contact page with theme switcher and Vanta.js background
const Contact = () => {
  const vantaRef = useRef<HTMLDivElement>(null);
  const [currentTheme, setCurrentTheme] = useState<keyof typeof themes>('purple');
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const theme = themes[currentTheme];

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await emailjs.send(
        "service_xou28io",
        "template_pljub4d",
        formData,
        "s6oq3sz3VlQP5LFs7"
      );
      alert("Message sent successfully! We'll get back to you soon.");
      setFormData({ name: "", email: "", phone: "", message: "" });
    } catch (error) {
      console.error("Email sending failed:", error);
      alert("Failed to send message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactInfo = [
    {
      icon: Mail,
      title: "Email Us",
      content: "booxclash@gmail.com ",
      description: "Get in touch via email"
    },
    {
      icon: Phone,
      title: "Call Us",
      content: "+260 967 001 972",
      description: "Speak with our team"
    },
    {
      icon: MapPin,
      title: "Visit Us",
      content: "Lusaka Zambia",
      description: "Our headquarters"
    },
    {
      icon: Clock,
      title: "Office Hours",
      content: "Mon-Fri: 9AM-6PM EST",
      description: "When we're available"
    }
  ];

  return (

    <>
  <title>Contact – BooxClash Learn</title>
  <meta
    name="description"
    content="Get in touch with the BooxClash Learn team for support, partnerships, or feedback. We’d love to hear from you."
  />
  <meta name="keywords" content="BooxClash Learn, contact, support, help" />
  <link rel="canonical" href="https://booxclashlearn.com/contact" />
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
                Get in <span className="text-orange-400">Touch</span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-200 mb-8 leading-relaxed">
                Have questions about BooxClash Learn? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
              </p>
            </div>
          </section>

          {/* Contact Info Cards */}
          <section className="py-16 px-6 max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
              {contactInfo.map((info, index) => (
                <div 
                  key={index}
                  className={`${theme.cardBg} p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer border ${theme.border} text-center`}
                >
                  <div className={`w-16 h-16 rounded-full ${theme.accent} text-white flex items-center justify-center mb-4 mx-auto`}>
                    <info.icon size={24} />
                  </div>
                  <h3 className={`text-lg font-bold ${theme.text} mb-2`}>{info.title}</h3>
                  <p className="text-gray-800 font-medium mb-1">{info.content}</p>
                  <p className="text-gray-600 text-sm">{info.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Contact Form */}
          <section className="py-16 px-6 max-w-4xl mx-auto">
            <div className={`${theme.cardBg} backdrop-blur-sm rounded-2xl shadow-2xl p-8 border ${theme.border}`}>
              <div className="text-center mb-8">
                <h2 className={`text-3xl font-bold ${theme.text} mb-4`}>Send Us a Message</h2>
                <p className="text-gray-600">Fill out the form below and we'll get back to you within 24 hours.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      placeholder="Your Name"
                      className={`w-full pl-10 pr-4 py-3 border ${theme.border} rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200`}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      placeholder="Your Email"
                      className={`w-full pl-10 pr-4 py-3 border ${theme.border} rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200`}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    placeholder="Your Phone Number (Optional)"
                    className={`w-full pl-10 pr-4 py-3 border ${theme.border} rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200`}
                    onChange={handleChange}
                  />
                </div>

                <div className="relative">
                  <div className="absolute top-3 left-0 pl-3 flex items-start pointer-events-none">
                    <MessageSquare className="h-5 w-5 text-gray-400" />
                  </div>
                  <textarea
                    name="message"
                    value={formData.message}
                    rows={6}
                    placeholder="Your Message"
                    className={`w-full pl-10 pr-4 py-3 border ${theme.border} rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 resize-none`}
                    onChange={handleChange}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full py-3 rounded-lg font-semibold text-white transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2 ${
                    isSubmitting
                      ? "bg-gray-400 cursor-not-allowed"
                      : `${theme.accent} ${theme.accentHover} shadow-lg ${theme.glowEffect}`
                  }`}
                >
                  {isSubmitting ? (
                    "Sending Message..."
                  ) : (
                    <>
                      Send Message
                      <Send size={18} />
                    </>
                  )}
                </button>
              </form>
            </div>
          </section>

          {/* FAQ Section */}
          <section className={`py-20 px-6 max-w-6xl mx-auto ${theme.cardBg} rounded-2xl my-16 shadow-2xl border ${theme.border}`}>
            <h2 className={`text-4xl font-bold text-center ${theme.text} mb-12`}>
              Frequently Asked Questions
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              {[
                {
                  question: "How does BooxClash Learn work?",
                  answer: "BooxClash Learn combines interactive games, videos, and activities to create engaging learning experiences aligned with K-12 curriculum standards."
                },
                {
                  question: "Is BooxClash Learn suitable for all ages?",
                  answer: "Yes! Our platform is designed for K-12 students with age-appropriate content and difficulty levels that adapt to each learner."
                },
                {
                  question: "Can teachers track student progress?",
                  answer: "Absolutely! Our teacher dashboard provides detailed insights into student performance, engagement, and learning outcomes."
                },
                {
                  question: "Do you offer offline access?",
                  answer: "Yes, many of our activities can be accessed offline, making learning possible even in low-connectivity environments."
                }
              ].map((faq, index) => (
                <div key={index} className="p-6 rounded-xl hover:bg-gray-50 transition-all duration-300">
                  <h3 className={`text-lg font-bold ${theme.text} mb-3`}>{faq.question}</h3>
                  <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
</>


  );
};

export default Contact;
