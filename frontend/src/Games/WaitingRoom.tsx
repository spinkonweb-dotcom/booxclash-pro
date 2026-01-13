// WaitingRoom.tsx
import React from "react";
import { RoomDetails, Player } from "./interfaces";

interface WaitingRoomProps {
  room: RoomDetails;
  me: Player | null;
}

export const WaitingRoom: React.FC<WaitingRoomProps> = ({ room }) => {
  return (
    <div className="p-6 max-w-lg mx-auto bg-blue-100 rounded-2xl shadow-md">
      <h2 className="text-2xl font-bold text-blue-700 mb-4">Waiting Room</h2>
      <p className="mb-2 text-center text-2xl font-mono bg-white p-2 rounded-md">
        Room Code: <span className="text-purple-700 font-bold">{room.roomCode}</span>
      </p>
      <div className="text-sm text-gray-600 text-center mb-4">Share this code with other players!</div>
      
      {/* Use optional chaining '?.' to prevent crashes if 'settings' is undefined */}
      <div className="bg-blue-200 p-3 rounded-md mb-4 text-center">
        <h3 className="text-lg font-bold text-blue-800 mb-1">Room Details</h3>
        <p>Subject: <span className="font-semibold">{room.settings?.subject}</span></p>
        <p>Level: <span className="font-semibold">{room.settings?.level}</span></p>
      </div>

      <h3 className="text-xl font-semibold text-purple-700 mb-2">
        {/* Also use optional chaining here */}
        Players Joined ({room.players.length}/{room.settings?.maxPlayers})
      </h3>
      <ul className="space-y-2">
        {room.players.map((player: Player) => (
          <li key={player._id} className={`p-2 rounded-md ${player.isHost ? "bg-orange-200" : "bg-purple-200"}`}>
            {player.name} – {player.country} {player.isHost && <span className="text-orange-600 font-semibold">(Host)</span>}
          </li>
        ))}
      </ul>
      
      {/* And here */}
      {room.players.length < (room.settings?.maxPlayers ?? 0) && 
        <div className="mt-4 text-center text-lg animate-pulse text-gray-700">
          Waiting for {(room.settings?.maxPlayers ?? 0) - room.players.length} more player(s)...
        </div>
      }
    </div>
  );
};