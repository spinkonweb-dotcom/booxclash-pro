import React, { useState, useEffect, useRef } from "react";
import { CheckCircle } from "lucide-react";
import confetti from "canvas-confetti";
import { useSpeech } from "../../../SpeechContext"; // adjust path
interface LessonProps {
  onComplete: () => void;
}

// --- DATA STRUCTURES ---

type GameObject = {
  id: number;
  name: string;
  emoji: string;
  // Criteria for sorting
  color: 'red' | 'blue' | 'yellow' | 'green' | 'other';
  shape: 'circle' | 'square' | 'triangle' | 'other';
  size: 'small' | 'medium' | 'large';
};

// Represents a choice for a puzzle
type PuzzleChoice = {
  id: string;
  label: string;
};

// Defines a single puzzle set
type PuzzleSet = {
  id: number;
  title: string;
  items: GameObject[];
  choices: PuzzleChoice[];
  correctChoiceId: string;
};

// --- MASTER DATA (Re-using from previous component) ---

const ALL_GAME_OBJECTS: Record<string, GameObject> = {
  apple: { id: 1, name: "Apple", emoji: "🍎", color: "red", shape: "circle", size: "small" },
  ball: { id: 2, name: "Ball", emoji: "🏀", color: "red", shape: "circle", size: "small" },
  book: { id: 3, name: "Book", emoji: "📖", color: "blue", shape: "square", size: "medium" },
  jeans: { id: 4, name: "Jeans", emoji: "👖", color: "blue", shape: "other", size: "large" },
  pizza: { id: 5, name: "Pizza", emoji: "🍕", color: "yellow", shape: "triangle", size: "medium" },
  cheese: { id: 6, name: "Cheese", emoji: "🧀", color: "yellow", shape: "triangle", size: "small" },
  window: { id: 7, name: "Window", emoji: "🖼️", color: "other", shape: "square", size: "medium" },
  box: { id: 8, name: "Box", emoji: "📦", color: "other", shape: "square", size: "medium" },
  leaf: { id: 9, name: "Leaf", emoji: "🍃", color: "green", shape: "other", size: "small" },
  frog: { id: 10, name: "Frog", emoji: "🐸", color: "green", shape: "other", size: "small" },
  car: { id: 11, name: "Car", emoji: "🚗", color: "red", shape: "other", size: "large" },
  whale: { id: 12, name: "Whale", emoji: "🐋", color: "blue", shape: "other", size: "large" },
  sun: { id: 13, name: "Sun", emoji: "☀️", color: "yellow", shape: "circle", size: "large" },
  moon: { id: 14, name: "Moon", emoji: "🌙", color: "yellow", shape: "circle", size: "large" },
  elephant: { id: 15, name: "Elephant", emoji: "🐘", color: "other", shape: "other", size: "large" },
  mouse: { id: 16, name: "Mouse", emoji: "🐁", color: "other", shape: "other", size: "small" },
  stopSign: { id: 17, name: "Stop Sign", emoji: "🛑", color: "red", shape: "other", size: "small" },
  clock: { id: 18, name: "Clock", emoji: "⏰", color: "other", shape: "circle", size: "medium" },
};

// --- PUZZLE SETS FOR THIS GAME ---

const PUZZLE_SETS: PuzzleSet[] = [
  {
    id: 1,
    title: "Which label describes ALL these items?",
    items: [
      ALL_GAME_OBJECTS.apple,
      ALL_GAME_OBJECTS.car,
      ALL_GAME_OBJECTS.stopSign,
    ],
    choices: [
      { id: 'c1-1', label: 'Red Things' },
      { id: 'c1-2', label: 'Circles' },
      { id: 'c1-3', label: 'Large Things' },
    ],
    correctChoiceId: 'c1-1',
  },
  {
    id: 2,
    title: "How would you describe this group?",
    items: [
      ALL_GAME_OBJECTS.ball,
      ALL_GAME_OBJECTS.sun,
      ALL_GAME_OBJECTS.clock,
      ALL_GAME_OBJECTS.moon,
    ],
    choices: [
      { id: 'c2-1', label: 'Yellow Things' },
      { id: 'c2-2', label: 'Round Things' },
      { id: 'c2-3', label: 'Small Things' },
    ],
    correctChoiceId: 'c2-2',
  },
  {
    id: 3,
    title: "What do all these items have in common?",
    items: [
      ALL_GAME_OBJECTS.cheese,
      ALL_GAME_OBJECTS.leaf,
      ALL_GAME_OBJECTS.mouse,
      ALL_GAME_OBJECTS.apple,
    ],
    choices: [
      { id: 'c3-1', label: 'Green Things' },
      { id: 'c3-2', label: 'Food' },
      { id: 'c3-3', label: 'Small Things' },
    ],
    correctChoiceId: 'c3-3',
  },
  {
    id: 4,
    title: "Which label fits this set?",
    items: [
      ALL_GAME_OBJECTS.book,
      ALL_GAME_OBJECTS.window,
      ALL_GAME_OBJECTS.box,
    ],
    choices: [
      { id: 'c4-1', label: 'Blue Things' },
      { id: 'c4-2', label: 'Square Things' },
      { id: 'c4-3', label: 'Medium Things' },
    ],
    correctChoiceId: 'c4-2',
  },
];

// --- NEW COMPONENT ---

const DescribeMySetGame: React.FC<LessonProps> = ({ onComplete }) => {
  // --- STATE ---
  const [currentPuzzleIndex, setCurrentPuzzleIndex] = useState(0);
  const [isGameComplete, setIsGameComplete] = useState(false);
  const [isAnswered, setIsAnswered] = useState(false);
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);

  const currentPuzzle = PUZZLE_SETS[currentPuzzleIndex];
    const { speak, stop } = useSpeech();
    const instructions = "Welcome to describing sets! In this lesson we will describe different sets."
      useEffect(() => {
        speak({ text: instructions });
        return stop; // stop when unmounting
      }, []);// ✅ Core drop logic
  // --- SOUNDS (identical to original) ---
  const createMockAudio = () => ({
    play: () => { /* console.log("Audio play mock") */ },
    pause: () => { /* console.log("Audio pause mock") */ },
    currentTime: 0,
  });

  const correctSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/correct.mp3") : createMockAudio());
  const wrongSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/incorrect.mp3") : createMockAudio());
  const clapSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/clap.mp3") : createMockAudio());

  // --- CORE GAME LOGIC ---
  const handleChoiceClick = (choice: PuzzleChoice) => {
    // Prevent clicking again while processing
    if (isAnswered) return;

    setIsAnswered(true);
    setSelectedChoiceId(choice.id);

    const isCorrect = choice.id === currentPuzzle.correctChoiceId;

    if (isCorrect) {
      // CORRECT
      correctSound.current.play();
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });

      setTimeout(() => {
        const nextPuzzleIndex = currentPuzzleIndex + 1;
        if (nextPuzzleIndex < PUZZLE_SETS.length) {
          // Move to next puzzle
          setCurrentPuzzleIndex(nextPuzzleIndex);
          setIsAnswered(false);
          setSelectedChoiceId(null);
        } else {
          // Game complete
          setIsGameComplete(true);
          clapSound.current.play();
        }
      }, 1500);
    } else {
      // WRONG
      wrongSound.current.play();
      setTimeout(() => {
        // Reset to try again
        setIsAnswered(false);
        setSelectedChoiceId(null);
      }, 1500);
    }
  };

  // --- RENDER ---

  // Handle Game Completion Screen
  if (isGameComplete) {
    return (
      <div className="p-6 text-center flex flex-col items-center justify-center h-full text-white">
        <CheckCircle size={80} className="text-green-400 mb-4" />
        <h2 className="text-3xl font-bold">Great Job!</h2>
        <p className="text-lg mb-6">You described all the sets!</p>
        <button
          onClick={onComplete}
          className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Continue Adventure
        </button>
      </div>
    );
  }

  // Helper function to get button style
  const getButtonClass = (choice: PuzzleChoice) => {
    if (!isAnswered) {
      return "bg-blue-600 hover:bg-blue-700"; // Default
    }

    if (choice.id === selectedChoiceId) {
      return choice.id === currentPuzzle.correctChoiceId
        ? "bg-green-600" // Selected and correct
        : "bg-red-600"; // Selected and wrong
    }

    // Faded out if another choice was selected
    return "bg-gray-500 opacity-50";
  };

  // Main Game Screen
  return (
    <div className="p-4 flex flex-col h-full text-white">
      <h3 className="text-2xl font-bold text-center mb-4">{currentPuzzle.title}</h3>

      {/* Items to describe */}
      <div className="flex-grow bg-white/10 rounded-lg p-4 mb-4 flex justify-center items-center flex-wrap gap-6 min-h-[150px]">
        {currentPuzzle.items.map((obj) => (
          <div key={obj.id} className="text-7xl">
            {obj.emoji}
          </div>
        ))}
      </div>

      {/* Multiple Choice Buttons */}
      <div className="grid grid-cols-1 gap-3">
        {currentPuzzle.choices.map((choice) => (
          <button
            key={choice.id}
            onClick={() => handleChoiceClick(choice)}
            disabled={isAnswered}
            className={`w-full text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 ${getButtonClass(
              choice
            )}`}
          >
            {choice.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default DescribeMySetGame;
