import React from 'react';
import { FlaskConical, ChevronLeft, Lock, BrainCircuit } from 'lucide-react';

interface SubjectSelectionProps {
  onSelectSubject: (subject: "Math/Science" | "Reading") => void;
  onBack: () => void;
}

const SubjectSelection: React.FC<SubjectSelectionProps> = ({ onSelectSubject, onBack }) => {
  // Define the background image URL for the main container
  const mainBackgroundImage = '/images/back-ground.webp'; // Replace with your desired image URL

  return (
    // Main container with background image and responsive padding
    <div 
      className="min-h-screen p-4 sm:p-6 md:p-8 bg-cover bg-center"
      style={{ backgroundImage: `url('${mainBackgroundImage}')` }}
    >
      {/* Overlay for better readability of text on top of the background image */}
      <div className="bg-blue-900/50 bg-opacity-80 rounded-xl p-4 sm:p-6 md:p-8 max-w-5xl mx-auto shadow-lg">
        <div className="flex items-center justify-between mb-10">
          <button 
            onClick={onBack} 
            className="flex items-center gap-1 text-orange-300 hover:text-blue-800 transition-colors font-semibold p-2 rounded-md hover:bg-blue-50"
          >
            <ChevronLeft size={20} /> Back to Themes
          </button>
          {/* Gamified Header */}
          <h2 className="text-2xl sm:text-3xl font-bold text-white text-center flex-grow">
            Choose Your Realm 🗺️
          </h2>
          <div className="w-auto sm:w-32"></div> {/* Spacer for alignment */}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {/* ## Realm 1: Math & Science (Available) ## */}
          <div
            onClick={() => onSelectSubject("Math/Science")}
            className="group relative h-72 sm:h-80 lg:h-96 rounded-2xl shadow-2xl p-6 sm:p-8 cursor-pointer
                       flex flex-col justify-end text-white overflow-hidden
                       transform transition-all duration-300 hover:scale-105 hover:shadow-blue-400/50"
          >
            {/* Background Image for Math/Science */}
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
              style={{ backgroundImage: "url('/images/maths-science.webp')" }} // Replace with your Math/Science image
            ></div>
            {/* Gradient Overlay for Readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent rounded-2xl"></div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-3">
                <BrainCircuit size={28} className="text-cyan-300 sm:size-32"/>
                <FlaskConical size={28} className="text-lime-300 sm:size-32"/>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-2 tracking-wide">Realm of Numbers & Atoms</h3>
              <p className="text-sm sm:text-base opacity-90">
                Embark on quests of logic, calculation, and discovery.
              </p>
            </div>
          </div>

          {/* ## Realm 2: Reading (Locked) ## */}
          <div
            className="relative h-72 sm:h-80 lg:h-96 rounded-2xl shadow-xl p-6 sm:p-8 cursor-not-allowed
                       flex flex-col justify-end text-white overflow-hidden"
          >
            {/* Background Image (Desaturated) for Reading */}
            <div
              className="absolute inset-0 bg-cover bg-center filter grayscale"
              style={{ backgroundImage: "url('/images/reading.webp')" }} // Replace with your Reading image
            ></div>
            {/* Darker Overlay for "Locked" effect */}
            <div className="absolute inset-0 bg-black/70 rounded-2xl"></div>

            {/* Locked Content */}
            <div className="relative z-10 text-center flex flex-col items-center justify-center h-full">
              <Lock size={40} className="text-white opacity-70 animate-pulse sm:size-48" />
              <h3 className="text-xl sm:text-2xl font-bold mt-4 mb-2 opacity-80">The Forgotten Library</h3>
              <p className="text-sm sm:text-base opacity-60">
                This realm is sealed for now. Return later, adventurer!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubjectSelection;
