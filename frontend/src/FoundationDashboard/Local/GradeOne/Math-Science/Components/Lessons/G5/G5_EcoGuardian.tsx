import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Leaf, Recycle, Droplet, CheckCircle, Zap } from 'lucide-react'; // FIX: Imported Zap icon

// Load Tone.js for simple sound feedback
declare global {
  interface Window {
    Tone: any;
  }
}
const useTone = () => {
  const synth = useMemo(() => {
    if (typeof window !== 'undefined' && window.Tone) {
      try {
        // Simple synth for confirmation chime
        return new window.Tone.PolySynth(window.Tone.Synth, {
          oscillator: { type: "sine" },
          envelope: { attack: 0.005, decay: 0.1, sustain: 0.05, release: 0.2 },
        }).toDestination();
      } catch (e) {
        console.error("Tone.js initialization failed:", e);
        return null;
      }
    }
    return null;
  }, []);

  const playSuccess = useCallback(() => {
    if (synth) {
      synth.triggerAttackRelease(['C5', 'E5', 'G5'], '8n');
    }
  }, [synth]);

  const playCompletion = useCallback(() => {
    if (synth) {
      synth.triggerAttackRelease(['C5', 'E5', 'G5', 'C6'], '4n');
    }
  }, [synth]);

  return { playSuccess, playCompletion };
};
// End of Tone.js setup

// Define the standard prop type for lesson components
export interface LessonComponentProps {
  lesson: any; 
  onComplete: () => void;
}

// FIX: Define a more accurate type for Lucide icons which accept a 'size' prop (Fixes Code 2322)
type LucideIcon = React.FC<React.ComponentProps<'svg'> & { size?: number | string }>;

// --- Data Definitions ---

interface EcoAction {
  id: string;
  label: string;
  icon: LucideIcon; // Used the new type to correctly handle props like 'size'
  color: string; // Tailwind color class
}

// --- Game Content ---

const ECO_ACTIONS: EcoAction[] = [
  { id: 'recycle', label: 'Recycle', icon: Recycle, color: 'text-green-600 bg-green-100' },
  { id: 'plant', label: 'Plant Trees', icon: Leaf, color: 'text-lime-600 bg-lime-100' },
  { id: 'conserve', label: 'Conserve Water', icon: Droplet, color: 'text-blue-600 bg-blue-100' },
  { id: 'save_energy', label: 'Save Energy', icon: Zap, color: 'text-yellow-600 bg-yellow-100' },
];

const MAX_HEALTH = 10;

// --- Helper Components ---

interface ActionIconProps {
  action: EcoAction;
  onClick: (id: string) => void;
  index: number;
}

const ActionIcon: React.FC<ActionIconProps> = ({ action, onClick, index }) => {
  const IconComponent = action.icon;
  
  // Custom Tailwind styles for positioning and animation
  const positions = [
    'top-[10%] left-[5%]',
    'top-[20%] right-[10%]',
    'top-[45%] left-[10%]',
    'top-[60%] right-[20%]',
    'top-[80%] left-[30%]',
    'bottom-[10%] right-[5%]',
  ];

  const animationDelay = (index * 0.15).toFixed(2); // Stagger the animation

  return (
    <div
      onClick={() => onClick(action.id)}
      className={`absolute cursor-pointer p-3 md:p-5 rounded-full shadow-lg border-2 border-current transition-all duration-300 transform 
        hover:scale-110 active:scale-95 z-20 
        ${action.color} ${positions[index % positions.length]}
        animate-float delay-[${animationDelay}s]
      `}
      style={{ animationDelay: `${animationDelay}s` }}
    >
      <IconComponent size={36} className="text-current" />
      <span className="absolute -bottom-6 text-xs font-medium text-gray-700 w-max left-1/2 transform -translate-x-1/2 hidden md:block">
        {action.label}
      </span>
    </div>
  );
};

// --- Main Component ---

const G5_EcoGuardian: React.FC<LessonComponentProps> = ({ onComplete }) => {
  const [earthHealth, setEarthHealth] = useState(0);
  // REMOVED: unused clickedActions state (Fixes Code 6133)
  const [message, setMessage] = useState('');
  const [shuffledActions] = useState(() => shuffleArray(ECO_ACTIONS.flatMap(a => [a, a, a])).slice(0, MAX_HEALTH));
  
  const { playSuccess, playCompletion } = useTone();

  const handleActionClick = useCallback((id: string) => {
    // Only allow clicking if the action hasn't been used yet to reach MAX_HEALTH
    if (earthHealth < MAX_HEALTH) {
      setEarthHealth(prev => {
        const newHealth = Math.min(prev + 1, MAX_HEALTH);
        return newHealth;
      });
      // REMOVED: setClickedActions call
      
      const action = ECO_ACTIONS.find(a => a.id === id);
      setMessage(`Great job! You chose to ${action?.label.toLowerCase()}.`);
      playSuccess();
    }
  }, [earthHealth, playSuccess]);

  // Determine Earth's mood based on health
  const { emoji, moodColor, moodText } = useMemo(() => {
    if (earthHealth === MAX_HEALTH) {
      return { emoji: '😊', moodColor: 'text-green-500', moodText: 'Healthy!' };
    }
    if (earthHealth >= MAX_HEALTH / 2) {
      return { emoji: '😐', moodColor: 'text-yellow-500', moodText: 'Getting Better...' };
    }
    return { emoji: '😞', moodColor: 'text-red-500', moodText: 'Needs Help!' };
  }, [earthHealth]);

  // Handle completion
  useEffect(() => {
    if (earthHealth === MAX_HEALTH) {
      playCompletion();
      setTimeout(() => onComplete(), 2000);
    }
    // Clear message after showing it
    const timer = setTimeout(() => setMessage(''), 1000);
    return () => clearTimeout(timer);
  }, [earthHealth, onComplete, playCompletion]);

  // Shuffles an array (re-defined here to ensure self-contained component)
  function shuffleArray<T>(array: T[]): T[] {
    let currentIndex = array.length, randomIndex;
    const newArray = [...array];
  
    while (currentIndex !== 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      [newArray[currentIndex], newArray[randomIndex]] = [newArray[randomIndex], newArray[currentIndex]];
    }
    return newArray;
  }
  
  // Progress Bar Style
  const progressWidth = `${(earthHealth / MAX_HEALTH) * 100}%`;
  
  return (
    <div className="p-4 sm:p-6 flex flex-col items-center h-full bg-gradient-to-tr from-cyan-50 to-lime-50 font-inter relative overflow-hidden">
      
      {/* Title */}
      <div className="text-center mb-6 w-full">
        <h3 className="text-4xl font-extrabold text-teal-700 mb-2 flex items-center justify-center gap-3">
          <Leaf size={32} className="text-teal-500" /> Eco Guardian
        </h3>
        <p className="text-xl text-gray-600 font-medium">Help the planet by choosing kind actions!</p>
      </div>

      {/* Earth Display and Health Bar */}
      <div className="w-full max-w-xl mb-8">
        <div className="flex justify-between items-center mb-2 font-semibold text-gray-700">
            <span>Earth Health:</span>
            <span className={`${moodColor} font-bold transition-colors duration-500`}>{moodText}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden shadow-inner">
          <div 
            className={`h-4 rounded-full transition-all duration-700 ${earthHealth === MAX_HEALTH ? 'bg-green-500' : 'bg-lime-400'}`}
            style={{ width: progressWidth }}
          ></div>
        </div>
      </div>

      {/* Game Area (Relative container for absolute positioning) */}
      <div className="relative w-full max-w-4xl flex-1 rounded-2xl bg-white shadow-2xl p-4 md:p-8 flex items-center justify-center min-h-[400px]">
        
        {/* Earth Emoji */}
        <div 
          className={`text-[150px] md:text-[200px] z-10 transition-transform duration-500 
            ${earthHealth === MAX_HEALTH ? 'animate-pulse-once scale-110' : 'scale-100'}
            `}
        >
          {emoji}
        </div>

        {/* Action Buttons */}
        {earthHealth < MAX_HEALTH && shuffledActions.map((action, index) => (
            <ActionIcon 
                key={`${action.id}-${index}`}
                action={action}
                onClick={handleActionClick}
                index={index}
            />
        ))}

        {/* Completion Message */}
        {earthHealth === MAX_HEALTH && (
            <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center rounded-2xl z-30">
                <CheckCircle size={80} className="text-green-600 mb-4 animate-bounce" />
                <h2 className="text-4xl font-bold text-gray-800 mb-2">Planet Saved!</h2>
                <p className="text-xl text-gray-700">Thank you, Eco Guardian, for taking care of our home!</p>
                <button 
                  onClick={onComplete} 
                  className="mt-6 bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 px-8 rounded-xl text-xl shadow-lg transition-transform transform hover:scale-105"
                >
                  Continue Lesson
                </button>
            </div>
        )}

      </div>

      {/* Feedback Message */}
      {message && (
        <div className={`fixed bottom-8 left-1/2 transform -translate-x-1/2 p-4 rounded-xl shadow-2xl text-center font-bold text-lg z-50 transition-all duration-300 bg-lime-500 text-white`}
        >
          {message}
        </div>
      )}
    </div>
  );
};

export default G5_EcoGuardian;
