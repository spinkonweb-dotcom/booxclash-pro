import React, { useState, useEffect, useRef, useCallback } from "react";
import { CheckCircle } from "lucide-react";
import confetti from "canvas-confetti";

interface LessonProps {
  onComplete: () => void;
}

// --- DATA STRUCTURES ---

type WeatherType = 'sunny' | 'rainy' | 'cloudy' | 'snowy' | 'windy';

type WeatherIcon = {
  type: WeatherType;
  emoji: string;
  label: string;
};

type GameRound = {
  id: number;
  weatherType: WeatherType;
  prompt: string;
  bgColor: string;
};

// --- GAME DATA ---
const WEATHER_ICONS: WeatherIcon[] = [
  { type: 'sunny', emoji: '☀️', label: 'Sunny' },
  { type: 'rainy', emoji: '🌧️', label: 'Rainy' },
  { type: 'cloudy', emoji: '☁️', label: 'Cloudy' },
  { type: 'snowy', emoji: '❄️', label: 'Snowy' },
  { type: 'windy', emoji: '🌬️', label: 'Windy' },
];

const ALL_ROUNDS: GameRound[] = [
  { id: 1, weatherType: 'sunny', prompt: 'It\'s bright and sunny!', bgColor: 'bg-sky-500' },
  { id: 2, weatherType: 'rainy', prompt: 'It\'s raining!', bgColor: 'bg-slate-500' },
  { id: 3, weatherType: 'cloudy', prompt: 'It\'s very cloudy.', bgColor: 'bg-gray-400' },
  { id: 4, weatherType: 'snowy', prompt: 'It\'s snowing!', bgColor: 'bg-cyan-600' },
  { id: 5, weatherType: 'windy', prompt: 'It\'s so windy!', bgColor: 'bg-teal-400' },
  { id: 6, weatherType: 'rainy', prompt: 'Drip, drop, drip!', bgColor: 'bg-slate-600' },
  { id: 7, weatherType: 'snowy', prompt: 'Look at the snow fall!', bgColor: 'bg-cyan-700' },
  { id: 8, weatherType: 'sunny', prompt: 'A beautiful, clear day!', bgColor: 'bg-sky-400' },
];

const TOTAL_ROUNDS = 6; // Let's do 6 rounds

// Helper to shuffle an array
const shuffleArray = <T,>(array: T[]): T[] => {
  return [...array].sort(() => Math.random() - 0.5);
};

// Helper to create particles for animations
const particles = Array.from({ length: 15 });

// --- COMPONENT ---

const WeatherWindowGame: React.FC<LessonProps> = ({ onComplete }) => {
  // --- STATE ---
  const [gameRounds, setGameRounds] = useState<GameRound[]>([]);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [currentRound, setCurrentRound] = useState<GameRound | null>(null);
  
  const [isGameComplete, setIsGameComplete] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [selectedType, setSelectedType] = useState<WeatherType | null>(null);

  // --- SOUNDS ---
  const createMockAudio = () => ({
    play: () => { /* console.log("Audio play mock") */ },
    pause: () => { /* console.log("Audio pause mock") */ },
    currentTime: 0,
  });

  const correctSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/correct.mp3") : createMockAudio());
  const wrongSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/incorrect.mp3") : createMockAudio());
  const clapSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/clap.mp3") : createMockAudio());

  // --- GAME SETUP ---
  const generateGameRounds = useCallback(() => {
    const rounds = shuffleArray(ALL_ROUNDS).slice(0, TOTAL_ROUNDS);
    setGameRounds(rounds);
    setCurrentRoundIndex(0);
  }, []);

  useEffect(() => {
    generateGameRounds();
  }, [generateGameRounds]);

  // Load current round
  useEffect(() => {
    if (gameRounds.length > 0 && currentRoundIndex < gameRounds.length) {
      setCurrentRound(gameRounds[currentRoundIndex]);
      setFeedback(null);
      setSelectedType(null);
    }
  }, [gameRounds, currentRoundIndex]);

  // --- GAME LOGIC ---
  const handleNextRound = () => {
    if (currentRoundIndex < TOTAL_ROUNDS - 1) {
      setCurrentRoundIndex(prev => prev + 1);
    } else {
      setIsGameComplete(true);
      clapSound.current.play();
      confetti({ particleCount: 200, spread: 80, origin: { y: 0.6 } });
    }
  };

  const handleIconClick = (clickedType: WeatherType) => {
    if (feedback || !currentRound) return; // Don't check if already showing feedback

    setSelectedType(clickedType);

    if (clickedType === currentRound.weatherType) {
      correctSound.current.play();
      setFeedback('correct');
      setTimeout(handleNextRound, 1200);
    } else {
      wrongSound.current.play();
      setFeedback('wrong');
      setTimeout(() => {
        setFeedback(null);
        setSelectedType(null);
      }, 1000);
    }
  };

  // --- RENDER ---
  if (isGameComplete) {
    return (
      <div className="p-6 text-center flex flex-col items-center justify-center h-full text-white">
        <CheckCircle size={80} className="text-green-400 mb-4" />
        <h2 className="text-3xl font-bold">Weather Expert!</h2>
        <p className="text-lg mb-6">You identified all the weather scenes!</p>
        <button
          onClick={onComplete}
          className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Finish Lesson
        </button>
      </div>
    );
  }

  if (!currentRound) {
    return <div className="p-6 text-center text-white">Loading...</div>;
  }
  
  const { prompt, weatherType, bgColor } = currentRound;

  // Render the animated scene in the window
  const renderWeatherScene = (type: WeatherType) => {
    switch (type) {
      case 'sunny':
        return <div className="text-9xl animate-pulse">☀️</div>;
      case 'rainy':
        return <>
          {particles.map((_, i) => (
            <div
              key={i}
              className="absolute text-xl animate-fall"
              style={{ left: `${Math.random() * 100}%`, animationDelay: `${Math.random() * 3}s`, animationDuration: `${Math.random() * 1 + 0.5}s` }}
            >💧</div>
          ))}
        </>;
      case 'snowy':
        return <>
          {particles.map((_, i) => (
            <div
              key={i}
              className="absolute text-xl animate-snowfall"
              style={{ left: `${Math.random() * 100}%`, animationDelay: `${Math.random() * 5}s`, animationDuration: `${Math.random() * 3 + 3}s` }}
            >❄️</div>
          ))}
        </>;
      case 'cloudy':
        return <>
          <div className="absolute text-8xl top-1/4 left-1/4 animate-drift opacity-60">☁️</div>
          <div className="absolute text-8xl top-1/2 left-1/2 animate-drift" style={{ animationDelay: '1s' }}>☁️</div>
          <div className="absolute text-8xl top-1/3 left-3/4 animate-drift opacity-80" style={{ animationDelay: '2s' }}>☁️</div>
        </>;
      case 'windy':
        return <>
          <div className="absolute text-8xl opacity-30">🌬️</div>
          {particles.map((_, i) => (
            <div
              key={i}
              className="absolute text-2xl animate-windy"
              style={{ top: `${Math.random() * 80}%`, animationDelay: `${Math.random() * 3}s`, animationDuration: `${Math.random() * 2 + 1.5}s` }}
            >🍃</div>
          ))}
        </>;
      default:
        return null;
    }
  };

  return (
    <div className="p-4 flex flex-col h-full text-white overflow-hidden">
      <h3 className="text-2xl font-bold text-center mb-4">What's the Weather?</h3>
      <p className="text-lg text-center text-cyan-300 mb-4">{prompt}</p>
      
      {/* "Window" Area */}
      <div className={`relative flex-grow ${bgColor} rounded-xl p-4 flex justify-center items-center overflow-hidden min-h-[250px] mb-4`}>
        {renderWeatherScene(weatherType)}
      </div>

      {/* Icon Selection */}
      <div className="flex justify-center items-center gap-2 md:gap-4">
        {WEATHER_ICONS.map((icon) => {
          const isSelected = selectedType === icon.type;
          const isCorrect = isSelected && feedback === 'correct';
          const isWrong = isSelected && feedback === 'wrong';
          const isFaded = feedback && !isSelected;

          return (
            <button
              key={icon.type}
              onClick={() => handleIconClick(icon.type)}
              disabled={!!feedback}
              className={`flex-1 flex flex-col items-center justify-center p-2 md:p-4 rounded-lg aspect-square
                transition-all duration-200
                ${isCorrect ? 'bg-green-600 scale-105' : ''}
                ${isWrong ? 'bg-red-600 animate-shake' : ''}
                ${isFaded ? 'opacity-30' : ''}
                ${!feedback ? 'bg-indigo-600 hover:bg-indigo-500' : ''}
              `}
            >
              <span className="text-4xl md:text-6xl">{icon.emoji}</span>
              <span className="text-sm md:text-lg font-semibold">{icon.label}</span>
            </button>
          );
        })}
      </div>

      {/* Animations */}
      <style>
        {`
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
          }
          .animate-shake { animation: shake 0.3s ease-in-out; }
          
          @keyframes fall {
            from { transform: translateY(-150%); opacity: 1; }
            to { transform: translateY(150%); opacity: 0; }
          }
          .animate-fall { animation: fall linear infinite; }
          
          @keyframes snowfall {
            from { transform: translateY(-150%) translateX(0px); opacity: 1; }
            to { transform: translateY(150%) translateX(20px); opacity: 0; }
          }
          .animate-snowfall { animation: snowfall linear infinite; }
          
          @keyframes windy {
            from { transform: translateX(-150%) rotate(0deg); opacity: 1; }
            to { transform: translateX(150%) rotate(720deg); opacity: 0; }
          }
          .animate-windy { animation: windy linear infinite; }

          @keyframes drift {
            from { transform: translateX(-20%); }
            to { transform: translateX(20%); }
          }
          .animate-drift { animation: drift 5s ease-in-out infinite alternate; }
        `}
      </style>
    </div>
  );
};

export default WeatherWindowGame;