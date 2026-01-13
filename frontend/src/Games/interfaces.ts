// interfaces.ts

/**
 * Represents a single player in the game.
 * Now includes an avatarUrl for a more engaging UI.
 */
export interface Player {
  _id: string;        // Unique identifier (e.g., from uuidv4 or socket ID)
  name: string;
  country: string;
  isHost: boolean;
  avatarUrl: string;  // ✨ ADDED: URL for the player's generated avatar
}

// ---

/**
 * Defines the structure for a single quiz question.
 * Renamed 'answer' to 'correctAnswer' for clarity.
 */
export interface Question {
  prompt: string;
  options: string[];
  correctAnswer: string; // ✨ RENAMED: More descriptive than 'answer'
}

// ---

/**
 * Contains all details about a game room.
 * Settings are now grouped into a nested object for better organization.
 */
export interface RoomDetails {
  roomCode: string;
  hostId: string;     // The _id of the host player
  players: Player[];
  settings: {         // ✨ REFACTORED: Grouped settings together
    subject: string;
    curriculum: string;
    level: string;
    maxPlayers: number;
  };
}

// ---

/**
 * Represents the state of the game at a specific moment (e.g., during a question).
 */
export interface GameState {
  question: Question;
  questionNumber: number | string; // Can be a number or 'Tie-Breaker'
  scores: Record<string, number>;  // Maps player _id to their score
}