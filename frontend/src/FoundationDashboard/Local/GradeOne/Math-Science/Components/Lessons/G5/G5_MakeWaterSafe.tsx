import React, { useState, useCallback, useMemo } from 'react';
import { 
  GlassWater, Flame, Snowflake, CheckCircle, XCircle, ChevronRight 
} from 'lucide-react';

// Define the standard prop type for lesson components
export interface LessonComponentProps {
  lesson: any; 
  onComplete: () => void;
}

// Define the available actions. Keys match the action IDs (lowercase).
const ACTIONS = {
  boil: { id: 'boil', label: 'Boil it', icon: Flame, isCorrect: true, color: 'text-orange-500' },
  add_ice: { id: 'add_ice', label: 'Add ice', icon: Snowflake, isCorrect: false, color: 'text-cyan-500' },
};

type ActionId = keyof typeof ACTIONS; // This is now 'boil' | 'add_ice'
type GameStatus = 'dirty' | 'clean' | 'fixed';

// --- Helper Components ---

interface ActionButtonProps {
  action: typeof ACTIONS[keyof typeof ACTIONS];
  isSelected: boolean;
  isDisabled: boolean;
  onSelect: (id: ActionId) => void;
}

const ActionButton: React.FC<ActionButtonProps> = ({ action, isSelected, isDisabled, onSelect }) => {
  const IconComponent = action.icon;
  
  return (
    <button
      onClick={() => onSelect(action.id as ActionId)}
      disabled={isDisabled}
      className={`flex flex-col items-center justify-center p-4 rounded-xl transition-all duration-300 w-full 
        ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.05] cursor-pointer'}
        ${isSelected 
          ? 'bg-white shadow-xl ring-4 ring-offset-2 ring-indigo-400' 
          : 'bg-gray-100 shadow-md hover:bg-white'
        }`}
    >
      <IconComponent size={36} className={`mb-1 ${action.color}`} />
      <span className="font-bold text-lg text-gray-700">{action.label}</span>
    </button>
  );
};

// --- Main Component ---

const G5_MakeWaterSafe: React.FC<LessonComponentProps> = ({ onComplete }) => {
  const [status, setStatus] = useState<GameStatus>('dirty');
  const [selectedAction, setSelectedAction] = useState<ActionId | null>(null);
  const [message, setMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSelectAction = useCallback((id: ActionId) => {
    if (status === 'fixed') return;
    setSelectedAction(id);
    setMessage('');
  }, [status]);

  const handleFixWater = useCallback(() => {
    if (!selectedAction || status === 'fixed') return;

    setIsProcessing(true);
    // Use the selectedAction (which is ActionId, e.g., 'boil') to look up the action object
    const action = ACTIONS[selectedAction]; 
    setSelectedAction(null); // Clear selection during processing

    setTimeout(() => {
      if (action.isCorrect) {
        setStatus('clean');
        setMessage("Success! Boiling kills germs and makes the water safe to drink.");
        setTimeout(onComplete, 3000); // Auto-complete lesson
      } else {
        setMessage("Oops! Adding ice doesn't remove germs. Try again with a different method.");
      }
      setIsProcessing(false);
    }, 1500);

  }, [selectedAction, status, onComplete]);

  const handleTryAgain = () => {
    setStatus('dirty');
    setSelectedAction(null);
    setMessage('');
  };

  const isLocked = status === 'fixed' || isProcessing;
  // Removed unused variable currentAction

  // Visual state of the water glass
  const waterColor = status === 'clean' ? 'fill-sky-400 text-sky-600' : 'fill-amber-700/80 text-amber-900';
  const waterMessage = status === 'clean' ? 'Safe to Drink!' : 'Unsafe Water';

  const FeedbackMessage = useMemo(() => {
    if (!message) return null;

    let icon, bgColor, textColor;
    if (status === 'clean') {
      icon = <CheckCircle size={20} className="mr-2" />;
      bgColor = 'bg-green-500';
      textColor = 'text-white';
    } else {
      icon = <XCircle size={20} className="mr-2" />;
      bgColor = 'bg-red-500';
      textColor = 'text-white';
    }

    return (
      <div 
        className={`absolute bottom-4 left-1/2 transform -translate-x-1/2 p-4 rounded-xl shadow-2xl text-center font-bold text-lg z-50 transition-all duration-300 ${bgColor} ${textColor} flex items-center`}
      >
        {icon} {message}
      </div>
    );
  }, [message, status]);

  return (
    <div className="p-4 sm:p-6 flex flex-col items-center h-full bg-gradient-to-br from-indigo-50 to-orange-100 font-inter relative overflow-hidden">
      
      {/* Title */}
      <div className="text-center mb-8 w-full">
        <h3 className="text-4xl font-extrabold text-orange-800 mb-2 flex items-center justify-center gap-3">
          <Flame size={32} className="text-orange-500" /> Lesson 9: Make Water Safe
        </h3>
        <p className="text-xl text-gray-600 font-medium">Which method makes this water safe to use?</p>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-center w-full max-w-4xl flex-1 gap-10">

        {/* 1. Water Status Display */}
        <div className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl shadow-2xl transition-all duration-1000 w-full max-w-sm">
          <GlassWater size={120} className={`mb-3 transition-colors duration-1000 ${waterColor}`} />
          <p className={`text-2xl font-black ${status === 'clean' ? 'text-green-600' : 'text-red-600'}`}>
            {waterMessage}
          </p>
          {isProcessing && (
            <div className="mt-2 text-indigo-600 font-semibold">Applying action...</div>
          )}
        </div>

        {/* 2. Action Selector */}
        <div className="w-full max-w-sm flex flex-col gap-4">
          <h4 className="text-xl font-bold text-gray-700">Choose a method:</h4>
          
          <div className="grid grid-cols-2 gap-4">
            <ActionButton 
              action={ACTIONS.boil} 
              isSelected={selectedAction === 'boil'}
              isDisabled={isLocked}
              onSelect={handleSelectAction}
            />
            <ActionButton 
              action={ACTIONS.add_ice} 
              isSelected={selectedAction === 'add_ice'}
              isDisabled={isLocked}
              onSelect={handleSelectAction}
            />
          </div>

          {/* 3. Action Button / Try Again */}
          <div className="mt-4">
            {status === 'dirty' && (
              <button
                onClick={handleFixWater}
                disabled={!selectedAction || isProcessing}
                className={`w-full py-3 px-6 rounded-xl text-xl font-bold shadow-lg flex items-center justify-center transition-transform transform duration-300
                  ${!selectedAction || isProcessing ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white hover:scale-[1.02]'}
                `}
              >
                Apply Method <ChevronRight size={24} className="ml-2" />
              </button>
            )}

            {(status !== 'clean' && message && !isProcessing) && (
              <button
                onClick={handleTryAgain}
                className="w-full py-3 px-6 rounded-xl text-xl font-bold text-white bg-red-600 hover:bg-red-700 shadow-lg transition-transform transform hover:scale-[1.02]"
              >
                Try Again
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Feedback Message */}
      {FeedbackMessage}
    </div>
  );
};

export default G5_MakeWaterSafe;
