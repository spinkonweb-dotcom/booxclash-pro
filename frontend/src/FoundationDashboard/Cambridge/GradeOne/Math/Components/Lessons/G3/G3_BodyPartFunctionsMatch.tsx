import React, { useState, useEffect, useRef } from "react";
import { CheckCircle } from "lucide-react";
import confetti from "canvas-confetti";

interface LessonProps {
  onComplete: () => void;
}

// --- DATA STRUCTURES ---

type CardType = 'part' | 'action';

// Defines the content of a single card
type CardContent = {
  emoji: string;
  label: string;
};

// Defines a matched pair
type CardPair = {
  pairId: number;
  part: CardContent;
  action: CardContent;
};

// Represents a card in the game grid
type GameCard = {
  id: string; // Unique ID for the card (e.g., "p-1", "a-1")
  pairId: number;
  type: CardType;
  emoji: string;
  label: string;
  isFlipped: boolean;
  isMatched: boolean;
};

// --- GAME DATA ---
const CARD_PAIRS: CardPair[] = [
  { pairId: 1, part: { emoji: "👁️", label: "Eyes" }, action: { emoji: "📖", label: "Seeing" } },
  { pairId: 2, part: { emoji: "👃", label: "Nose" }, action: { emoji: "🌸", label: "Smelling" } },
  { pairId: 3, part: { emoji: "👐", label: "Hands" }, action: { emoji: "✏️", label: "Holding" } },
  { pairId: 4, part: { emoji: "👣", label: "Feet" }, action: { emoji: "👟", label: "Walking" } },
  { pairId: 5, part: { emoji: "👂", label: "Ears" }, action: { emoji: "🎵", label: "Hearing" } },
  { pairId: 6, part: { emoji: "👄", label: "Mouth" }, action: { emoji: "🍎", label: "Eating" } },
];

const TOTAL_PAIRS = CARD_PAIRS.length;

// Helper to shuffle an array
const shuffleArray = <T,>(array: T[]): T[] => {
  return [...array].sort(() => Math.random() - 0.5);
};

// Function to create and shuffle the deck
const createShuffledDeck = (): GameCard[] => {
  const deck: GameCard[] = [];
  CARD_PAIRS.forEach(pair => {
    deck.push({
      id: `p-${pair.pairId}`,
      pairId: pair.pairId,
      type: 'part',
      emoji: pair.part.emoji,
      label: pair.part.label,
      isFlipped: false,
      isMatched: false,
    });
    deck.push({
      id: `a-${pair.pairId}`,
      pairId: pair.pairId,
      type: 'action',
      emoji: pair.action.emoji,
      label: pair.action.label,
      isFlipped: false,
      isMatched: false,
    });
  });
  return shuffleArray(deck);
};

// --- COMPONENT ---

const BodyPartMatchGame: React.FC<LessonProps> = ({ onComplete }) => {
  // --- STATE ---
  const [cards, setCards] = useState<GameCard[]>(createShuffledDeck());
  const [flippedCards, setFlippedCards] = useState<GameCard[]>([]);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [isChecking, setIsChecking] = useState(false); // To prevent rapid clicks
  const [isGameComplete, setIsGameComplete] = useState(false);

  // --- SOUNDS ---
  const createMockAudio = () => ({
    play: () => { /* console.log("Audio play mock") */ },
    pause: () => { /* console.log("Audio pause mock") */ },
    currentTime: 0,
  });

  const correctSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/correct.mp3") : createMockAudio());
  const wrongSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/incorrect.mp3") : createMockAudio());
  const clapSound = useRef(typeof Audio !== "undefined" ? new Audio("/sounds/clap.mp3") : createMockAudio());

  // --- GAME LOGIC ---

  // Check for matches when two cards are flipped
  useEffect(() => {
    if (flippedCards.length === 2) {
      setIsChecking(true);
      const [cardOne, cardTwo] = flippedCards;

      if (cardOne.pairId === cardTwo.pairId) {
        // --- MATCH ---
        correctSound.current.play();
        setCards(prevCards =>
          prevCards.map(card =>
            card.id === cardOne.id || card.id === cardTwo.id
              ? { ...card, isMatched: true, isFlipped: true }
              : card
          )
        );
        setMatchedPairs(prev => prev + 1);
        setFlippedCards([]);
        setIsChecking(false);
      } else {
        // --- NO MATCH ---
        wrongSound.current.play();
        setTimeout(() => {
          setCards(prevCards =>
            prevCards.map(card =>
              card.id === cardOne.id || card.id === cardTwo.id
                ? { ...card, isFlipped: false }
                : card
            )
          );
          setFlippedCards([]);
          setIsChecking(false);
        }, 1000);
      }
    }
  }, [flippedCards, correctSound, wrongSound]);

  // Check for game completion
  useEffect(() => {
    if (matchedPairs === TOTAL_PAIRS) {
      setIsGameComplete(true);
      clapSound.current.play();
      confetti({ particleCount: 200, spread: 80, origin: { y: 0.6 } });
    }
  }, [matchedPairs, clapSound]);

  // Handle card click
  const handleCardClick = (clickedCard: GameCard) => {
    if (
      isChecking ||
      clickedCard.isFlipped ||
      clickedCard.isMatched ||
      flippedCards.length === 2
    ) {
      return;
    }

    // Flip the card
    setCards(prevCards =>
      prevCards.map(card =>
        card.id === clickedCard.id ? { ...card, isFlipped: true } : card
      )
    );

    setFlippedCards(prev => [...prev, { ...clickedCard, isFlipped: true }]);
  };

  // --- RENDER ---

  if (isGameComplete) {
    return (
      <div className="p-6 text-center flex flex-col items-center justify-center h-full text-white">
        <CheckCircle size={80} className="text-green-400 mb-4" />
        <h2 className="text-3xl font-bold">Great Match!</h2>
        <p className="text-lg mb-6">You matched all the body parts to their functions!</p>
        <button
          onClick={onComplete}
          className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Finish Lesson
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 flex flex-col h-full text-white">
      <h3 className="text-2xl font-bold text-center mb-4">Match the Body Part to its Job!</h3>
      
      {/* Game Grid Container - This centers the grid and controls its max size */}
      <div className="flex-grow flex items-center justify-center p-2">
        <div className="w-full max-w-md grid grid-cols-3 gap-2 sm:gap-3">
          {cards.map(card => (
            <div
              key={card.id}
              onClick={() => handleCardClick(card)}
              className={`aspect-square rounded-lg transition-all duration-300 transform-style-preserve-3d
                ${card.isFlipped || card.isMatched ? "transform-rotate-y-180" : ""}
                ${card.isMatched ? "opacity-60 saturate-0" : "cursor-pointer"}
              `}
            >
              {/* Card Back */}
              <div className={`absolute inset-0 w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center
                backface-hidden transform-rotate-y-0
                ${card.isFlipped || card.isMatched ? "opacity-0" : "opacity-100"}
              `}>
                <span className="text-5xl font-bold text-white opacity-80">?</span>
              </div>
              
              {/* Card Front */}
              <div className={`absolute inset-0 w-full h-full bg-white rounded-lg flex flex-col items-center justify-center p-2
                backface-hidden transform-rotate-y-180
                ${card.isFlipped || card.isMatched ? "opacity-100" : "opacity-0"}
                ${card.isMatched ? "border-4 border-green-400" : "border-4 border-gray-200"}
              `}>
                <span className="text-4xl md:text-5xl">{card.emoji}</span>
                <span className="text-xs md:text-sm text-center font-semibold text-gray-800 mt-1">
                  {card.label}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3D Transform Styles */}
      <style>
        {`
          .transform-style-preserve-3d {
            transform-style: preserve-3d;
          }
          .transform-rotate-y-180 {
            transform: rotateY(180deg);
          }
          .transform-rotate-y-0 {
            transform: rotateY(0deg);
          }
          .backface-hidden {
            backface-visibility: hidden;
          }
        `}
      </style>
    </div>
  );
};

export default BodyPartMatchGame;

