import React, { useState, useCallback, useMemo } from 'react';
import { 
  GlassWater, DropletOff, Waves, Trash2, ShowerHead, Factory, CheckCircle, XCircle, AlertTriangle 
} from 'lucide-react';

// Define the standard prop type for lesson components
export interface LessonComponentProps {
  lesson: any; 
  onComplete: () => void;
}

// Define a more accurate type for Lucide icons
type LucideIcon = React.FC<React.ComponentProps<'svg'> & { size?: number | string }>;

// --- Data Definitions ---

interface WaterScenario {
  id: string;
  label: string;
  icon: LucideIcon;
  isClean: boolean;
  color: string; // Base color class
}

type GameStatus = 'playing' | 'correct' | 'incorrect';

// --- Game Content ---

const WATER_SCENARIOS: WaterScenario[] = [
  { id: 'clear_glass', label: 'Clear Drinking Glass', icon: GlassWater, isClean: true, color: 'border-blue-500' },
  { id: 'muddy_puddle', label: 'Muddy Puddle', icon: DropletOff, isClean: false, color: 'border-amber-700' },
  { id: 'clear_river', label: 'Flowing Mountain River', icon: Waves, isClean: true, color: 'border-sky-500' },
  { id: 'trash_pond', label: 'Trash-filled Pond', icon: Trash2, isClean: false, color: 'border-gray-500' },
  { id: 'clean_faucet', label: 'Running Clean Faucet', icon: ShowerHead, isClean: true, color: 'border-cyan-500' },
  { id: 'oil_spill', label: 'Industrial Runoff', icon: Factory, isClean: false, color: 'border-red-500' },
];

const CORRECT_CLEAN_IDS = WATER_SCENARIOS
  .filter(s => s.isClean)
  .map(s => s.id);

// --- Helper Components ---

interface ScenarioCardProps {
  scenario: WaterScenario;
  isSelected: boolean;
  isLocked: boolean;
  status: GameStatus;
  onToggle: (id: string) => void;
}

const ScenarioCard: React.FC<ScenarioCardProps> = ({ scenario, isSelected, isLocked, status, onToggle }) => {
  const IconComponent = scenario.icon;
  const isCorrectClean = scenario.isClean && status !== 'playing';
  const isIncorrectDirty = !scenario.isClean && isSelected && status !== 'playing';

  let borderStyle = scenario.color;
  let shadowStyle = isSelected ? 'shadow-xl ring-4 ring-offset-2' : 'shadow-md';
  let statusIcon = null;

  if (status !== 'playing') {
    if (isCorrectClean) {
      borderStyle = 'border-green-500';
      shadowStyle = 'shadow-xl ring-4 ring-green-300';
      statusIcon = <CheckCircle className="text-green-600 absolute top-2 right-2" size={20} />;
    } else if (isIncorrectDirty) {
      borderStyle = 'border-red-500';
      shadowStyle = 'shadow-xl ring-4 ring-red-300';
      statusIcon = <XCircle className="text-red-600 absolute top-2 right-2" size={20} />;
    } else if (scenario.isClean) {
        // Show missed clean water sources
        borderStyle = 'border-amber-500';
        shadowStyle = 'shadow-xl ring-4 ring-amber-300';
        statusIcon = <AlertTriangle className="text-amber-600 absolute top-2 right-2" size={20} />;
    }
  }

  const handleClick = () => {
    if (!isLocked) {
      onToggle(scenario.id);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`relative flex flex-col items-center justify-center p-4 h-full min-h-[140px] md:min-h-[180px] text-center rounded-xl bg-white transition-all duration-300
        ${borderStyle} ${shadowStyle} border-4
        ${isSelected && status === 'playing' ? 'bg-indigo-50/50 scale-[1.03] ring-indigo-400' : 'hover:scale-[1.02] cursor-pointer'}
        ${isLocked ? 'pointer-events-none opacity-90' : ''}
      `}
    >
      <IconComponent size={64} className={`mb-2 ${scenario.isClean ? 'text-blue-600' : 'text-gray-700'}`} />
      <span className="font-semibold text-sm md:text-base text-gray-700">{scenario.label}</span>
      {statusIcon}
    </div>
  );
};

// --- Main Component ---

const G5_CleanOrDirtyWater: React.FC<LessonComponentProps> = ({ onComplete }) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [status, setStatus] = useState<GameStatus>('playing');
  const [message, setMessage] = useState('');

  const handleToggle = useCallback((id: string) => {
    if (status !== 'playing') return;

    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
    setMessage('');
  }, [status]);

  const handleCheckAnswers = useCallback(() => {
    const isCorrect = (
      selectedIds.length === CORRECT_CLEAN_IDS.length &&
      selectedIds.every(id => CORRECT_CLEAN_IDS.includes(id))
    );

    if (isCorrect) {
      setStatus('correct');
      setMessage('Excellent! You identified all the clean water sources!');
      // Auto-complete after a short delay
      setTimeout(onComplete, 3000);
    } else {
      setStatus('incorrect');
      setMessage('Not quite! Check the ones you missed or the ones you shouldn\'t have selected.');
    }
  }, [selectedIds, onComplete]);

  const handleTryAgain = () => {
    setSelectedIds([]);
    setStatus('playing');
    setMessage('');
  };

  const isLocked = status !== 'playing';

  const FeedbackMessage = useMemo(() => {
    if (!message) return null;

    let icon, bgColor;
    if (status === 'correct') {
      icon = <CheckCircle size={20} className="mr-2" />;
      bgColor = 'bg-green-500';
    } else if (status === 'incorrect') {
      icon = <XCircle size={20} className="mr-2" />;
      bgColor = 'bg-red-500';
    } else {
      return null;
    }

    return (
      <div 
        className={`fixed bottom-8 left-1/2 transform -translate-x-1/2 p-4 rounded-xl shadow-2xl text-center font-bold text-lg z-50 transition-all duration-300 ${bgColor} text-white flex items-center`}
      >
        {icon} {message}
      </div>
    );
  }, [message, status]);


  return (
    <div className="p-4 sm:p-6 flex flex-col items-center h-full bg-gradient-to-br from-indigo-50 to-sky-100 font-inter relative overflow-hidden">
      
      {/* Title */}
      <div className="text-center mb-6 w-full">
        <h3 className="text-4xl font-extrabold text-blue-800 mb-2 flex items-center justify-center gap-3">
          <DropletOff size={32} className="text-sky-500" /> Clean or Dirty Water?
        </h3>
        <p className="text-xl text-gray-600 font-medium">Tap all the pictures that show **clean** water.</p>
      </div>

      {/* Game Grid */}
      <div className="w-full max-w-4xl flex-1 grid grid-cols-2 md:grid-cols-3 gap-4 p-4 md:p-8 rounded-2xl bg-white shadow-2xl">
        {WATER_SCENARIOS.map(scenario => (
          <ScenarioCard 
            key={scenario.id}
            scenario={scenario}
            isSelected={selectedIds.includes(scenario.id)}
            isLocked={isLocked}
            status={status}
            onToggle={handleToggle}
          />
        ))}
      </div>

      {/* Control Buttons */}
      <div className="mt-8 flex justify-center space-x-4 w-full max-w-sm">
        {status === 'playing' && (
          <button
            onClick={handleCheckAnswers}
            disabled={selectedIds.length === 0}
            className={`w-full py-3 px-6 rounded-xl text-xl font-bold shadow-lg transition-transform transform ${selectedIds.length > 0 ? 'bg-indigo-600 hover:bg-indigo-700 text-white hover:scale-[1.02]' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
          >
            Check Answers
          </button>
        )}

        {status === 'incorrect' && (
          <button
            onClick={handleTryAgain}
            className="w-full py-3 px-6 rounded-xl text-xl font-bold text-white bg-red-600 hover:bg-red-700 shadow-lg transition-transform transform hover:scale-[1.02]"
          >
            Try Again
          </button>
        )}

        {status === 'correct' && (
          <button
            onClick={onComplete}
            className="w-full py-3 px-6 rounded-xl text-xl font-bold text-white bg-green-600 hover:bg-green-700 shadow-lg transition-transform transform hover:scale-[1.02]"
          >
            Continue Lesson
          </button>
        )}
      </div>

      {/* Feedback Message */}
      {FeedbackMessage}
    </div>
  );
};

export default G5_CleanOrDirtyWater;
