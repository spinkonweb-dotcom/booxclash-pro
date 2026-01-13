import React, { useState } from "react";
import { v4 as uuidv4 } from "uuid"; 
import { useNavigate } from "react-router-dom"; // 👈 import useNavigate
import {
  subjects,
  curriculums,
  difficultyLevels,
  maxPlayersOptions,
} from "./constants";

interface LobbyFormProps {
  isHost: boolean;
  setIsHost: (val: boolean) => void;
  roomCode: string;
  setRoomCode: (val: string) => void;
  name: string;
  setName: (val: string) => void;
  country: string;
  setCountry: (val: string) => void;
  subject: string;
  setSubject: (val: string) => void;
  curriculum: string;
  setCurriculum: (val: string) => void;
  level: string;
  setLevel: (val: string) => void;
  maxPlayers: number;
  setMaxPlayers: (val: number) => void;
  handleSubmit: (payload: any) => void; 
  error: string | null;
}

export const LobbyForm: React.FC<LobbyFormProps> = ({
  isHost,
  setIsHost,
  roomCode,
  setRoomCode,
  name,
  setName,
  country,
  setCountry,
  subject,
  setSubject,
  curriculum,
  setCurriculum,
  level,
  setLevel,
  maxPlayers,
  setMaxPlayers,
  handleSubmit,
  error,
}) => {
  const [playerId] = useState(() => uuidv4());
  const navigate = useNavigate(); // 👈 hook for navigation

  const onSubmit = () => {
    const payload = {
      _id: playerId, 
      name,
      country,
      isHost,
      roomCode,
      subject,
      curriculum,
      level,
      maxPlayers,
    };
    handleSubmit(payload);
  };

  const handleQuit = () => {
    navigate("/dashboard/foundation"); // 👈 navigate to dashboard
  };

  return (
    <div className="p-6 mt-10 max-w-md mx-auto bg-purple-100 rounded-2xl shadow-md">
      <h2 className="text-2xl font-bold text-purple-700 mb-4">
        {isHost ? "Create a Room" : "Join a Room"}
      </h2>

      {/* Host/Player toggle */}
      <div className="flex justify-center mb-4">
        <button
          onClick={() => setIsHost(true)}
          className={`px-4 py-2 rounded-l-md ${
            isHost ? "bg-orange-500 text-white" : "bg-gray-200"
          }`}
        >
          Host
        </button>
        <button
          onClick={() => setIsHost(false)}
          className={`px-4 py-2 rounded-r-md ${
            !isHost ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}
        >
          Player
        </button>
      </div>

      {/* Room code for joining */}
      {!isHost && (
        <input
          type="text"
          placeholder="Room Code"
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
          className="w-full p-2 mb-2 border rounded-md"
        />
      )}

      {/* Player details */}
      <input
        type="text"
        placeholder="Your Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full p-2 mb-2 border rounded-md"
      />
      <input
        type="text"
        placeholder="Your Country"
        value={country}
        onChange={(e) => setCountry(e.target.value)}
        className="w-full p-2 mb-4 border rounded-md"
      />

      {/* Host-only fields */}
      {isHost && (
        <>
          <select
            value={curriculum}
            onChange={(e) => setCurriculum(e.target.value)}
            className="w-full p-2 mb-2 border rounded-md"
          >
            {curriculums.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full p-2 mb-2 border rounded-md"
          >
            {subjects.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="w-full p-2 mb-2 border rounded-md"
          >
            {difficultyLevels.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
          <select
            value={maxPlayers}
            onChange={(e) => setMaxPlayers(Number(e.target.value))}
            className="w-full p-2 mb-4 border rounded-md"
          >
            {maxPlayersOptions.map((n) => (
              <option key={n} value={n}>
                {n} Players
              </option>
            ))}
          </select>
        </>
      )}

      {/* Submit */}
      <button
        onClick={onSubmit}
        className={`w-full mb-3 ${
          isHost
            ? "bg-orange-500 hover:bg-orange-600"
            : "bg-blue-500 hover:bg-blue-600"
        } text-white p-2 rounded-md`}
      >
        {isHost ? "Create Room" : "Join Room"}
      </button>

      {/* Quit Button */}
      <button
        onClick={handleQuit}
        className="w-full bg-gray-300 hover:bg-gray-400 text-black p-2 rounded-md"
      >
        Quit
      </button>

      {/* Error */}
      {error && (
        <div className="mt-4 p-2 bg-red-200 text-red-800 rounded-md text-sm text-center">
          {error}
        </div>
      )}
    </div>
  );
};
