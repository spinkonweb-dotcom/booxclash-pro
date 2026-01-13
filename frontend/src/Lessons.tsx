import { motion } from "framer-motion";
import { BookOpen, Brain, ClipboardCheck, UserCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";

export default function InteractiveLessons() {
  const navigate = useNavigate();

  const features = [
    {
      icon: <BookOpen className="w-10 h-10 text-orange-600" />, // Changed text color to orange
      title: "Start Up",
      description: "Kick off each lesson with a quick, engaging introduction to set the context and excite learners.",
    },
    {
      icon: <Brain className="w-10 h-10 text-orange-600" />, // Changed text color to orange
      title: "Interactive Quiz",
      description: "Reinforce understanding through interactive quizzes that challenge and guide learners in real-time.",
    },
    {
      icon: <ClipboardCheck className="w-10 h-10 text-orange-600" />, // Changed text color to orange
      title: "Summary",
      description: "Get a clear and concise recap of the key concepts covered in each lesson for better retention.",
    },
    {
      icon: <UserCircle className="w-10 h-10 text-orange-600" />, // Changed text color to orange
      title: "BooxPie Tutor",
      description: "Learn with BooxPie, your AI-powered tutor, ready to answer questions and provide instant guidance.",
    },
  ];

  return (
    <>
      <title>Lessons – BooxClash Learn</title>
      <meta
        name="description"
        content="Explore BooxClash Learn lessons that make complex topics simple and engaging for students at every level."
      />
      <meta name="keywords" content="BooxClash Learn, lessons, education, online learning" />
      <link rel="canonical" href="https://booxclashlearn.com/signup" />

      <section className="w-full mt-12 py-12 px-6 bg-gradient-to-r from-purple-500 via-blue-500 to-orange-500 text-white">
        <Navbar />
        <div className="max-w-6xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl font-bold mb-6"
          >
            Interactive Lessons
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="text-lg text-white mb-12" // Changed text color to white
          >
            Explore a new way of learning — from engaging introductions to quizzes, summaries, and personalized tutoring.
          </motion.p>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.2 }}
                className="rounded-2xl shadow-md hover:shadow-xl transition-shadow p-6 flex flex-col items-center text-center bg-white bg-opacity-10 backdrop-filter backdrop-blur-lg border border-white border-opacity-30" // Added a semi-transparent background for the cards
              >
                {feature.icon}
                <h3 className="text-xl text-purple-600  font-semibold mt-4 mb-2">{feature.title}</h3>
                <p className="text-blue-600 text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.6 }}
            className="mt-12"
          >
            <button
              className="bg-white hover:bg-gray-100 text-purple-600 font-bold rounded-2xl px-8 py-4 text-lg shadow-lg transition-colors" // Changed button colors for better contrast
              onClick={() => navigate("/signup")}
            >
              Get Started
            </button>
          </motion.div>
        </div>
      </section>
    </>
  );
}