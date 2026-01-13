import React, { useState, useEffect, useRef } from "react";
import { CheckCircle } from "lucide-react";
import confetti from "canvas-confetti";
import { useSpeech } from "../../../SpeechContext"; // adjust path
interface LessonProps {
  onComplete: () => void;
}

// --- DATA STRUCTURES ---

// Represents an item in a scene or line
type PuzzleItem = {
  id: string;
  name: string;
  emoji: string;
};

// Represents a multiple-choice answer
type PuzzleChoice = {
  id: string;
  label: string; // Can be a number (e.g., "3") or an emoji (e.g., "🍎")
};

// Defines a single puzzle (or "level")
type Puzzle = {
  id: number;
  type: 'cardinal' | 'ordinal'; // Cardinal (how many) vs. Ordinal (which position)
  title: string;
  items: PuzzleItem[];
  choices: PuzzleChoice[];
  correctChoiceId: string;
};

// --- PUZZLE SETS FOR THIS GAME ---

const PUZZLE_SETS: Puzzle[] = [
  {
    id: 1,
    type: 'cardinal',
    title: "How many apples are there?",
    items: [
      { id: "i1", name: "Apple", emoji: "🍎" },
      { id: "i2", name: "Apple", emoji: "🍎" },
      { id: "i3", name: "Apple", emoji: "🍎" },
    ],
    choices: [
      { id: 'c1-1', label: '1' },
      { id: 'c1-3', label: '3' },
      { id: 'c1-4', label: '4' },
    ],
    correctChoiceId: 'c1-3',
  },
  {
    id: 2,
    type: 'ordinal',
    title: "Who is 3rd in line for the bus? 🚌",
    items: [
      { id: "i4", name: "Frog", emoji: "🐸" },   // 1st
      { id: "i5", name: "Mouse", emoji: "🐁" },  // 2nd
      { id: "i6", name: "Elephant", emoji: "🐘" },// 3rd
      { id: "i7", name: "Whale", emoji: "🐋" },  // 4th
    ],
    choices: [
      { id: 'c2-frog', label: '🐸' },
      { id: 'c2-mouse', label: '🐁' },
      { id: 'c2-elephant', label: '🐘' },
    ],
    correctChoiceId: 'c2-elephant',
  },
  {
    id: 3,
    type: 'cardinal',
    title: "How many cars do you see?",
    items: [
      { id: "i8", name: "Car", emoji: "🚗" },
      { id: "i9", name: "Car", emoji: "🚗" },
      { id: "i10", name: "Car", emoji: "🚗" },
      { id: "i11", name: "Car", emoji: "🚗" },
      { id: "i12", name: "Car", emoji: "🚗" },
    ],
    choices: [
      { id: 'c3-3', label: '3' },
      { id: 'c3-4', label: '4' },
      { id: 'c3-5', label: '5' },
    ],
    correctChoiceId: 'c3-5',
  },
  {
    id: 4,
    type: 'ordinal',
    title: "Who is 1st in line?",
    items: [
      { id: "i13", name: "Sun", emoji: "☀️" },  // 1st
      { id: "i14", name: "Moon", emoji: "🌙" }, // 2nd
      { id: "i15", name: "Clock", emoji: "⏰" },// 3rd
    ],
    choices: [
      { id: 'c4-sun', label: '☀️' },
      { id: 'c4-moon', label: '🌙' },
      { id: 'c4-clock', label: '⏰' },
    ],
    correctChoiceId: 'c4-sun',
  },
];

// --- NEW COMPONENT ---

const EverydayNumbersGame: React.FC<LessonProps> = ({ onComplete }) => {
  // --- STATE ---
  const [currentPuzzleIndex, setCurrentPuzzleIndex] = useState(0);
  const [isGameComplete, setIsGameComplete] = useState(false);
  const [isAnswered, setIsAnswered] = useState(false);
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);

  const currentPuzzle = PUZZLE_SETS[currentPuzzleIndex];

  // --- SOUNDS (identical to original) ---
  const createMockAudio = () => ({
    play: () => { /* console.log("Audio play mock") */ },
    pause: () => { /* console.log("Audio pause mock") */ },
    currentTime: 0,
  });

  const correctSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/correct.mp3") : createMockAudio());
  const wrongSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/incorrect.mp3") : createMockAudio());
  const clapSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/clap.mp3") : createMockAudio());
    const { speak, stop } = useSpeech();
    const instructions = "Hello let see how we use Numbers in our daily lives! How many apples are there?"
      useEffect(() => {
        speak({ text: instructions });
        return stop; // stop when unmounting
      }, []);// ✅ Core drop logic
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
        <h2 className="text-3xl font-bold">You're a Numbers Whiz!</h2>
        <p className="text-lg mb-6">You answered all the questions!</p>
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
  
  // Helper to check if choice label is an emoji
  const isEmojiLabel = (label: string) => {
    // A simple check: if the first character is an emoji, assume the whole label is.
    // This is less robust than a full regex but fine for this game.
    return /\p{Emoji}/u.test(label.substring(0, 2));
  };


  // Main Game Screen
  return (
    <div className="p-4 flex flex-col h-full text-white">
      <h3 className="text-2xl font-bold text-center mb-4">{currentPuzzle.title}</h3>

      {/* Items to describe */}
      <div className="flex-grow bg-white/10 rounded-lg p-4 mb-4 flex justify-center items-center flex-wrap gap-6 min-h-[150px]">
        {currentPuzzle.items.map((obj, index) => (
          <div key={obj.id} className="text-center">
            {currentPuzzle.type === 'ordinal' && (
              <span className="text-sm font-bold opacity-75 block">
                {index + 1}
                {index === 0 ? 'st' : index === 1 ? 'nd' : index === 2 ? 'rd' : 'th'}
              </span>
            )}
            <div className="text-7xl">
              {obj.emoji}
            </div>
          </div>
        ))}
      </div>

      {/* Multiple Choice Buttons */}
      <div className="grid grid-cols-3 gap-3">
        {currentPuzzle.choices.map((choice) => (
          <button
            key={choice.id}
            onClick={() => handleChoiceClick(choice)}
            disabled={isAnswered}
            className={`w-full text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 ${getButtonClass(
              choice
            )} ${isEmojiLabel(choice.label) ? 'text-4xl' : 'text-2xl'}`} // Make emoji buttons bigger
          >
            {choice.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default EverydayNumbersGame;
