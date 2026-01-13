import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { useNavigate } from "react-router-dom";

// --- Local Imports (ensure these paths are correct) ---
import { LobbyForm } from "./LobbyForm";
import { WaitingRoom } from "./WaitingRoom";
import { useSockets } from "./useSocket";
import { Player, RoomDetails, GameState } from "./interfaces";
import { API_BASE, subjects, curriculums, difficultyLevels } from "./constants";

/**
 * Helper function to generate a unique robot avatar for each player using the DiceBear API.
 * @param seed A unique string (like a player ID) to generate a consistent avatar.
 * @returns A URL to an SVG avatar image.
 */
const generateAvatarUrl = (seed: string) => `https://api.dicebear.com/8.x/bottts/svg?seed=${seed}`;

const Lobby: React.FC = () => {
  // --- Form & Lobby State ---
  const [isHost, setIsHost] = useState(true);
  const [roomCode, setRoomCode] = useState("");
  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [subject, setSubject] = useState(subjects[0]);
  const [curriculum, setCurriculum] = useState(curriculums[0]);
  const [level, setLevel] = useState(difficultyLevels[0]);
  const [maxPlayers, setMaxPlayers] = useState(2);
  const [room, setRoom] = useState<RoomDetails | null>(null);
  const [me, setMe] = useState<Player | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [playerId] = useState(() => uuidv4()); // Stable, unique ID for this browser session

  // --- Game Flow & UI State ---
  const [phase, setPhase] = useState<"lobby" | "countdown" | "quiz" | "result" | "gameOver">("lobby");
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [answerResult, setAnswerResult] = useState<{ player: Player; correct: boolean; correctAnswer: string; chosenAnswer?: string; } | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const navigate = useNavigate();

  // --- Audio Refs ---
  const correctSoundRef = useRef<HTMLAudioElement | null>(null);
  const wrongSoundRef = useRef<HTMLAudioElement | null>(null);
  const backgroundMusicRef = useRef<HTMLAudioElement | null>(null);

  // --- Effects ---

  // Pre-load audio files on component mount
  useEffect(() => {
    correctSoundRef.current = new Audio("/sounds/correct.mp3");
    wrongSoundRef.current = new Audio("/sounds/incorrect.mp3");
    backgroundMusicRef.current = new Audio("/sounds/bg-music.mp3");
    if (backgroundMusicRef.current) {
      backgroundMusicRef.current.loop = true;
      backgroundMusicRef.current.volume = 0.3; // Default volume
    }
  }, []);

  // Effect to manage background music playback and answer sounds
  useEffect(() => {
    if (phase === "quiz" && !answerResult) {
      backgroundMusicRef.current?.play().catch(e => console.error("Audio play failed:", e));
    } else {
      backgroundMusicRef.current?.pause(); // Pause on other phases or when an answer is shown
    }

    if (answerResult) {
      answerResult.correct ? correctSoundRef.current?.play() : wrongSoundRef.current?.play();
    }
  }, [phase, answerResult]);

  // Effect to toggle volume when the mute state changes
  useEffect(() => {
    if (backgroundMusicRef.current) {
      backgroundMusicRef.current.volume = isMuted ? 0 : 0.3;
    }
  }, [isMuted]);

  // --- Socket Connection ---
  const socket = useSockets(
    playerId, setRoom, setMe, setPhase, () => {},
    setGameState, setAnswerResult, () => {}, setError
  );

  // --- Handlers ---

  const handleSubmit = async () => {
    if (!name || !country) {
      setError("Please enter your name and country.");
      return;
    }
    try {
      setError(null);
      const avatarUrl = generateAvatarUrl(playerId);
      const playerPayload = { _id: playerId, name, country, isHost, avatarUrl };

      const payload = {
        ...playerPayload,
        roomCode: isHost ? undefined : roomCode,
        subject: isHost ? subject : undefined,
        curriculum: isHost ? curriculum : undefined,
        level: isHost ? level : undefined,
        maxPlayers: isHost ? maxPlayers : undefined,
      };

      const res = await axios.post(`${API_BASE}/api/rooms/lobby`, payload);
      const joinedRoom = res.data.room;
      setRoomCode(joinedRoom.roomCode);

      if (socket) {
        socket.emit("joinRoom", {
          roomCode: joinedRoom.roomCode,
          player: playerPayload,
        });
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Something went wrong");
    }
  };

  const handleAnswerSubmit = (answer: string) => {
    if (!me || !socket || !roomCode || answerResult) return;
    socket.emit("submitAnswer", {
      roomCode,
      answer,
      playerId: me._id,
    });
  };

  const toggleMute = () => {
    setIsMuted(prev => !prev);
  };

  const handleExit = () => {
    if (socket && me) {
      // Notify the backend that this player is leaving for cleanup
      socket.emit("leaveRoom", { roomCode, playerId: me._id });
    }
    // Clean up audio and navigate away
    if (backgroundMusicRef.current) {
      backgroundMusicRef.current.pause();
      backgroundMusicRef.current.currentTime = 0;
    }
    navigate('/knockout-game');
  };

  // --- Reusable UI Components ---

  const GameControls = () => (
    <div className="absolute top-4 w-[calc(100%-2rem)] max-w-7xl mx-auto flex justify-between items-center z-10">
      <button
        onClick={handleExit}
        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-lg transition-transform transform hover:scale-105"
        aria-label="Exit Game"
      >
        Exit
      </button>
      <button
        onClick={toggleMute}
        className="w-12 h-12 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-full flex items-center justify-center text-2xl shadow-lg transition-transform transform hover:scale-105"
        aria-label={isMuted ? "Unmute music" : "Mute music"}
      >
        {isMuted ? '🔇' : '🔊'}
      </button>
    </div>
  );

  // --- Render Logic ---

  if (phase === "quiz" && gameState) {
    const areOptionsDisabled = !!answerResult;
    const sortedScores = room ? Object.entries(gameState.scores)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .map(([pId, score]) => ({
        player: room.players.find(p => p._id === pId),
        score,
      })) : [];

    return (
      <div className="relative min-h-screen bg-gray-900 bg-cover bg-center text-white flex items-center justify-center p-4" style={{ backgroundImage: "url('/images/back-ground.webp')" }}>
        <GameControls />
        <div className="w-full max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 bg-black bg-opacity-50 backdrop-blur-sm rounded-2xl p-4 border border-purple-500">
            <h3 className="text-xl font-bold text-center text-purple-300 mb-4">🏆 Leaderboard</h3>
            <ul className="space-y-3">
              {sortedScores.map(({ player, score }, index) => (
                <li key={player?._id} className="flex items-center p-2 bg-gray-800 bg-opacity-70 rounded-lg">
                  <span className="text-lg font-bold text-yellow-400 w-6">{index + 1}</span>
                  <img src={player?.avatarUrl} alt="avatar" className="w-10 h-10 rounded-full mx-3 border-2 border-yellow-400" />
                  <div className="flex-grow">
                    <p className="font-semibold truncate">{player?.name || "..."}</p>
                    <p className="text-sm text-gray-300">{score} pts</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="md:col-span-2 bg-black bg-opacity-50 backdrop-blur-sm rounded-2xl p-6 border-4 border-purple-500 shadow-lg">
            <div className="mb-4 text-center">
              <h2 className="text-2xl font-bold text-purple-400">Question {gameState.questionNumber}</h2>
            </div>
            <div className="text-center mb-6 p-4 bg-gray-800 rounded-lg">
              <p className="text-xl font-bold">{gameState.question.prompt}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {gameState.question.options.map((opt) => (
                <button
                  key={opt}
                  disabled={areOptionsDisabled}
                  onClick={() => handleAnswerSubmit(opt)}
                  className={`p-4 rounded-lg font-semibold text-gray-900 transition-transform transform hover:scale-105 disabled:opacity-60 disabled:scale-100 text-lg ${answerResult ? (opt === answerResult.correctAnswer ? "bg-green-500 ring-4 ring-white animate-pulse" : (answerResult.chosenAnswer === opt ? "bg-red-500" : "bg-gray-600")) : "bg-yellow-400 hover:bg-yellow-500"}`}
                >
                  {opt}
                </button>
              ))}
            </div>
            {answerResult && (
              <div className="mt-6 p-4 text-center rounded-lg">
                <h3 className={`text-3xl font-bold ${answerResult.correct ? "text-green-400" : "text-red-400"}`}>
                  {answerResult.correct ? "Correct!" : "Incorrect!"}
                </h3>
                <p className="text-gray-300 mt-1 text-lg">
                  The correct answer was: <span className="font-bold text-yellow-400">{answerResult.correctAnswer}</span>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (phase === "gameOver" && gameState?.scores) {
    const sortedScores = Object.entries(gameState.scores).sort(([, a], [, b]) => (b as number) - (a as number));
    const winnerId = sortedScores[0]?.[0];
    const winner = room?.players.find((p) => p._id === winnerId);
    const isHostPlayer = me?._id === room?.hostId;

    return (
      <div className="relative min-h-screen bg-gray-900 bg-cover bg-center text-white flex items-center justify-center p-4" style={{ backgroundImage: "url('/backgrounds/space-bg.jpg')" }}>
        <GameControls />
        <div className="p-8 max-w-2xl mx-auto text-center bg-black bg-opacity-60 backdrop-blur-md text-white rounded-2xl shadow-xl border-4 border-purple-500">
          <h2 className="text-4xl font-extrabold text-purple-400 mb-4">🏆 Game Over! 🏆</h2>
          {winner && (
            <div className="mb-6 flex flex-col items-center">
              <img src={winner.avatarUrl} alt="winner avatar" className="w-24 h-24 rounded-full border-4 border-yellow-300 mb-3" />
              <h3 className="text-3xl font-bold text-yellow-300">Winner: {winner.name} 🎉</h3>
            </div>
          )}
          <div className="bg-gray-800 bg-opacity-70 rounded-lg p-4 mb-6">
            <h4 className="text-xl font-semibold mb-3">Final Scores</h4>
            <ul className="space-y-2">
              {sortedScores.map(([pId, score], index) => {
                const player = room?.players.find((p) => p._id === pId);
                return (
                  <li key={pId} className={`flex items-center text-lg font-bold p-2 rounded-md ${index === 0 ? "text-yellow-300 bg-yellow-500 bg-opacity-20" : "text-gray-200"}`}>
                    <span className="w-8">{index + 1}.</span>
                    <img src={player?.avatarUrl} alt="avatar" className="w-8 h-8 rounded-full mr-3" />
                    <span className="flex-grow text-left">{player?.name || "Unknown"}</span>
                    <span>{score} pts</span>
                  </li>
                );
              })}
            </ul>
          </div>
          {isHostPlayer ? (
            <button
              onClick={() => socket?.emit("restartGame", { roomCode })}
              className="px-8 py-3 bg-purple-600 hover:bg-purple-700 rounded-xl text-white font-semibold shadow-lg transition-transform transform hover:scale-105"
            >
              🔄 Play Again
            </button>
          ) : (
            <p className="mt-6 text-gray-400 animate-pulse">
              Waiting for the host to start a new game...
            </p>
          )}
        </div>
      </div>
    );
  }

  if (room) return <WaitingRoom room={room} me={me} />;

  return (
    <LobbyForm
      isHost={isHost} setIsHost={setIsHost} roomCode={roomCode} setRoomCode={setRoomCode}
      name={name} setName={setName} country={country} setCountry={setCountry}
      subject={subject} setSubject={setSubject} curriculum={curriculum} setCurriculum={setCurriculum}
      level={level} setLevel={setLevel} maxPlayers={maxPlayers} setMaxPlayers={setMaxPlayers}
      handleSubmit={handleSubmit} error={error}
    />
  );
};

export default Lobby;