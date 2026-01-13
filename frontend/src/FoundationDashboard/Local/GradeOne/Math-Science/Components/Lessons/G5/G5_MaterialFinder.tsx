import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Star } from 'lucide-react';

export interface LessonComponentProps {
  lesson: any; 
  onComplete: () => void;
}

type MaterialType = 'wood' | 'glass' | 'plastic' | 'metal';

interface SceneTarget {
  id: string;
  material: MaterialType;
  label: string;
  emoji: string;
  top: number;
  left: number;
  size: number; // Single size value for more uniform sizing
}

interface Challenge {
  material: MaterialType;
  instructions: string;
}

// Repositioned items to avoid overlap and match materials better
const SCENE_TARGETS: SceneTarget[] = [
  // Wood items
  { id: 't1', material: 'wood', label: 'Wooden Chair', emoji: '🪑', top: 60, left: 15, size: 18 },
  { id: 't2', material: 'wood', label: 'Wooden Table', emoji: '🪵', top: 55, left: 65, size: 16 },
  { id: 't3', material: 'wood', label: 'Wooden Door', emoji: '🚪', top: 20, left: 5, size: 14 },
  
  // Glass items
  { id: 't4', material: 'glass', label: 'Window', emoji: '🪟', top: 10, left: 75, size: 20 },
  { id: 't5', material: 'glass', label: 'Mirror', emoji: '🪞', top: 15, left: 45, size: 14 },
  { id: 't6', material: 'glass', label: 'Glass Vase', emoji: '🏺', top: 68, left: 45, size: 10 },
  
  // Plastic items
  { id: 't7', material: 'plastic', label: 'Toy Car', emoji: '🚗', top: 75, left: 28, size: 10 },
  { id: 't8', material: 'plastic', label: 'Plastic Bottle', emoji: '🧴', top: 45, left: 80, size: 10 },
  { id: 't9', material: 'plastic', label: 'Plant Pot', emoji: '🪴', top: 35, left: 25, size: 12 },
  
  // Metal items
  { id: 't10', material: 'metal', label: 'Metal Lamp', emoji: '🔦', top: 25, left: 85, size: 12 },
  { id: 't11', material: 'metal', label: 'Keys', emoji: '🔑', top: 70, left: 55, size: 8 },
  { id: 't12', material: 'metal', label: 'Scissors', emoji: '✂️', top: 50, left: 35, size: 9 },
];

const CHALLENGES: Challenge[] = [
  { material: 'wood', instructions: 'Find something made of WOOD' },
  { material: 'glass', instructions: 'Find something made of GLASS' },
  { material: 'plastic', instructions: 'Find something made of PLASTIC' },
  { material: 'metal', instructions: 'Find something made of METAL' },
  { material: 'wood', instructions: 'Find another WOODEN object' },
  { material: 'glass', instructions: 'Find another GLASS object' },
  { material: 'plastic', instructions: 'Find another PLASTIC object' },
  { material: 'metal', instructions: 'Find another METAL object' },
];

const MATERIAL_INFO: Record<MaterialType, { color: string; bgColor: string; borderColor: string }> = {
  wood: { color: 'text-amber-700', bgColor: 'bg-amber-100', borderColor: 'border-amber-500' },
  glass: { color: 'text-blue-700', bgColor: 'bg-blue-100', borderColor: 'border-blue-500' },
  plastic: { color: 'text-green-700', bgColor: 'bg-green-100', borderColor: 'border-green-500' },
  metal: { color: 'text-gray-700', bgColor: 'bg-gray-100', borderColor: 'border-gray-500' },
};

const G5_MaterialFinder: React.FC<LessonComponentProps> = ({ onComplete }) => {
  const [challengeIndex, setChallengeIndex] = useState(0);
  const [foundTargets, setFoundTargets] = useState<Set<string>>(new Set());
  const [feedback, setFeedback] = useState<{ message: string; isCorrect: boolean; targetId: string } | null>(null);

  const currentChallenge = CHALLENGES[challengeIndex];
  const isComplete = challengeIndex >= CHALLENGES.length;

  const handleTargetClick = (target: SceneTarget) => {
    if (feedback || isComplete) return;
    
    const alreadyFound = foundTargets.has(target.id);
    const isCorrectMaterial = target.material === currentChallenge.material;

    if (alreadyFound) {
      setFeedback({
        message: `You already found the ${target.label}! Look for something else.`,
        isCorrect: false,
        targetId: target.id
      });
      setTimeout(() => setFeedback(null), 2000);
      return;
    }

    if (isCorrectMaterial) {
      setFeedback({
        message: `Perfect! The ${target.label} is made of ${target.material.toUpperCase()}! ⭐`,
        isCorrect: true,
        targetId: target.id
      });
      
      setTimeout(() => {
        setFoundTargets(prev => new Set([...prev, target.id]));
        setChallengeIndex(prev => prev + 1);
        setFeedback(null);
      }, 2000);
    } else {
      setFeedback({
        message: `Not quite! The ${target.label} is made of ${target.material.toUpperCase()}, not ${currentChallenge.material.toUpperCase()}. Try again!`,
        isCorrect: false,
        targetId: target.id
      });
      setTimeout(() => setFeedback(null), 2500);
    }
  };

  useEffect(() => {
    if (isComplete) {
      onComplete();
    }
  }, [isComplete, onComplete]);

  if (isComplete) {
    return (
      <div className="min-h-screen p-6 flex flex-col items-center justify-center bg-gradient-to-br from-purple-100 via-pink-100 to-yellow-100">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md text-center">
          <Star size={80} className="text-yellow-500 mx-auto mb-4 animate-pulse" />
          <h2 className="text-4xl font-bold text-purple-800 mb-3">Amazing Work!</h2>
          <p className="text-xl text-gray-700 mb-4">You found all the materials!</p>
          <p className="text-gray-600 mb-6">You're a Material Master! 🎉</p>
          <button 
            onClick={onComplete} 
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-10 rounded-2xl text-xl shadow-lg transition-all transform hover:scale-105"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  const materialStyle = MATERIAL_INFO[currentChallenge.material];

  return (
    <div className="min-h-screen p-4 sm:p-6 flex flex-col bg-gradient-to-br from-blue-50 to-indigo-50">
      
      {/* Header with Challenge Progress */}
      <div className="flex justify-center items-center mb-4 max-w-4xl mx-auto w-full">
        <div className="bg-white rounded-xl px-4 py-2 shadow-md">
          <span className="text-sm text-gray-600">Challenge:</span>
          <span className="text-lg font-bold text-gray-800 ml-2">{challengeIndex + 1}/{CHALLENGES.length}</span>
        </div>
      </div>

      {/* Instructions */}
      <div className={`${materialStyle.bgColor} ${materialStyle.borderColor} border-4 rounded-2xl shadow-lg p-6 mb-6 max-w-4xl mx-auto w-full`}>
        <div className="flex items-center justify-center gap-3">
          <span className="text-4xl">🔍</span>
          <h3 className={`text-2xl sm:text-3xl font-black ${materialStyle.color} uppercase tracking-wide`}>
            {currentChallenge.instructions}
          </h3>
        </div>
      </div>

      {/* Game Area */}
      <div className="flex-1 relative rounded-2xl shadow-2xl overflow-hidden bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 border-4 border-white max-w-4xl mx-auto w-full min-h-[500px]">
        
        {/* Room Background Pattern */}
        <div className="absolute inset-0" style={{
          backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,.1) 35px, rgba(255,255,255,.1) 70px)`
        }}></div>

        {/* Floor Line */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-800 opacity-20"></div>

        {/* Clickable Items */}
        {SCENE_TARGETS.map((target) => {
          const isFound = foundTargets.has(target.id);
          const isFeedbackTarget = feedback?.targetId === target.id;
          const showFeedback = isFeedbackTarget && feedback;

          return (
            <button
              key={target.id}
              onClick={() => handleTargetClick(target)}
              disabled={isFound}
              style={{
                top: `${target.top}%`,
                left: `${target.left}%`,
                width: `${target.size}%`,
                height: `${target.size}%`,
              }}
              className={`absolute flex items-center justify-center transition-all duration-300 rounded-lg
                ${isFound ? 'opacity-30 cursor-not-allowed scale-90' : 'opacity-100 cursor-pointer hover:scale-110 active:scale-95'}
                ${showFeedback && feedback.isCorrect ? 'ring-4 ring-green-500 bg-green-100' : ''}
                ${showFeedback && !feedback.isCorrect ? 'ring-4 ring-red-500 bg-red-100 animate-pulse' : ''}
                ${!showFeedback && !isFound ? 'hover:bg-white hover:bg-opacity-30' : ''}
              `}
              aria-label={target.label}
            >
              <span className="text-4xl sm:text-5xl select-none drop-shadow-lg" style={{ filter: isFound ? 'grayscale(100%)' : 'none' }}>
                {target.emoji}
              </span>
              
              {/* Show checkmark on found items */}
              {isFound && (
                <CheckCircle className="absolute top-0 right-0 text-green-600 bg-white rounded-full" size={20} />
              )}
            </button>
          );
        })}
        
        {/* Feedback Message */}
        {feedback && (
          <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 p-6 rounded-2xl shadow-2xl text-white font-bold text-center z-50 max-w-md
            ${feedback.isCorrect ? 'bg-green-600' : 'bg-red-600'} animate-[bounce_0.5s_ease-in-out]`}>
            <div className="flex items-center justify-center mb-2">
              {feedback.isCorrect ? <CheckCircle size={40} /> : <XCircle size={40} />}
            </div>
            <p className="text-lg sm:text-xl">{feedback.message}</p>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mt-6 max-w-4xl mx-auto w-full">
        <div className="bg-white rounded-full h-4 shadow-inner overflow-hidden">
          <div 
            className="bg-gradient-to-r from-purple-500 to-pink-500 h-4 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${(foundTargets.size / SCENE_TARGETS.length) * 100}%` }}
          ></div>
        </div>
        <p className="text-center text-sm text-gray-600 mt-2">
          Found {foundTargets.size} of {SCENE_TARGETS.length} objects
        </p>
      </div>
      
    </div>
  );
};

export default G5_MaterialFinder;