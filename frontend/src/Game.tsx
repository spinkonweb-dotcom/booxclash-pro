import React from "react";
import { motion } from "framer-motion";
import { Gamepad2, Layers, Box, GraduationCap, Swords } from "lucide-react"; // Added Swords icon for SmackDown
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar"; 
import aiImage from "/images/ai.webp";
import twodImage from "/images/2d.webp";
import threedImage from "/images/3d.webp";
import simulationImage from "/images/virtual.webp";

export default function EducationalGames() {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Gamepad2 className="w-10 h-10 text-orange-600" />,
      title: "2D Educational Games",
      description: "Dive into engaging 2D games that make learning fun and accessible for all ages. Explore diverse subjects.",
      image: twodImage,
    },
    {
      icon: <Box className="w-10 h-10 text-orange-600" />,
      title: "3D Immersive Worlds",
      description: "Experience complex concepts in interactive 3D environments. Learn through exploration and hands-on challenges.",
      image: threedImage,
    },
    {
      icon: <Layers className="w-10 h-10 text-orange-600" />,
      title: "Simulations & Labs",
      description: "Conduct virtual experiments and run simulations to understand real-world phenomena without any risks.",
      image: simulationImage,
    },
    {
      icon: <GraduationCap className="w-10 h-10 text-orange-600" />,
      title: "Personalized Learning Paths",
      description: "Our AI-powered system adapts to your pace, suggesting games and activities tailored to your learning style.",
      image: aiImage,
    },
  ];

  const getColorClass = (idx: number) => {
    const colors = ["text-purple-300", "text-blue-300", "text-orange-300"];
    return colors[idx % colors.length];
  };

  return (
    <>
      <title>Games - BooxClash Learn</title>
      <meta
        name="description"
        content="Explore BooxClash Learn's educational games, simulations, and 2D/3D experiences designed for engaging learning."
      />
      <meta name="keywords" content="BooxClash Learn, educational games, 2D games, 3D games, simulations, online learning" />
      <link rel="canonical" href="https://booxclashlearn.com/games" />

      <section className="w-full min-h-screen py-12 px-6 bg-gradient-to-r from-purple-700 via-blue-700 to-orange-700 text-white">
        <Navbar />
        <div className="max-w-6xl mx-auto text-center pt-12">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl font-bold mb-6 drop-shadow-lg"
          >
            Play & Learn with Engaging Games
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="text-lg md:text-xl text-white font-bold mb-12 max-w-3xl mx-auto"
          >
            Dive into a world of educational games, simulations, and immersive 2D & 3D experiences. Learning has never been this exciting!
          </motion.p>

                    {/* NEW Knockout Quiz Battle Section */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="mt-20 mb-20 bg-white bg-opacity-20 rounded-2xl shadow-xl p-8 max-w-2xl mx-auto border border-white border-opacity-30 backdrop-blur-md"
          >
            <div className="flex items-center justify-center mb-4">
              <Swords className="w-12 h-12 text-orange-400 mr-3" />
              <h3 className="text-3xl font-extrabold text-orange-600 drop-shadow-md">
                BooxClash SmackDown
              </h3>
            </div>
            <p className="text-lg text-black font-bold mb-6">
              Ready for the ultimate quiz showdown? Test your knowledge in a knockout-style quiz battle!
              Compete, survive rounds, and prove you’re the smartest in the ring.
            </p>
            <button
              onClick={() => navigate("/knockout-home")}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-full px-8 py-4 text-lg shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
            >
              Try the Knockout Quiz Battle
            </button>
          </motion.div>


          {/* Game Features Grid */}
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.2 }}
                className="rounded-2xl shadow-xl hover:shadow-2xl transition-shadow duration-300 p-6 flex flex-col items-center text-center bg-white bg-opacity-15 backdrop-filter backdrop-blur-sm border border-white border-opacity-30 relative overflow-hidden"
              >
                {feature.image && (
                  <div className="mb-4">
                    <img
                      src={feature.image}
                      alt={feature.title}
                      className="w-full h-32 object-cover rounded-lg shadow-md"
                    />
                  </div>
                )}
                <div className="flex items-center justify-center p-3 rounded-full bg-white bg-opacity-20 mb-4 z-10">
                  {React.cloneElement(feature.icon, {
                    className: "w-8 h-8 " + getColorClass(idx),
                  })}
                </div>
                <h3 className={`text-xl font-bold mt-4 mb-2 ${getColorClass(idx)} drop-shadow-md`}>
                  {feature.title}
                </h3>
                <p className="text-blue-900 text-sm opacity-90">{feature.description}</p>
              </motion.div>
            ))}
          </div>

          {/* Existing Call-to-action */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.6 }}
            className="mt-16"
          >
            <button
              className="bg-white hover:bg-gray-200 text-purple-700 font-extrabold rounded-full px-10 py-4 text-lg shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
              onClick={() => navigate("/signup")}
            >
              Start Playing Now!
            </button>
          </motion.div>
        </div>
      </section>
    </>
  );
}
