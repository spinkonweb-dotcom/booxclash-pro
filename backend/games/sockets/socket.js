import { Server } from "socket.io";
import Room from "../models/Room.js";
import { startGame, processAnswer } from "./gameFlow.js";

const activeGames = {};

export default function initSocket(server) {
  const io = new Server(server, {
    cors: { origin: "*" },
  });

  io.on("connection", (socket) => {
    console.log("🔌 New client connected:", socket.id);

    /**
     * Handles a player joining a room.
     */
    socket.on("joinRoom", async ({ roomCode, player }) => {
      try {
        const roomFromDb = await Room.findOne({
          roomCode,
          "players._id": player._id,
        });

        if (!roomFromDb) {
          console.log(`❌ Room ${roomCode} or Player ${player._id} not found in DB`);
          return socket.emit("error", { message: `Room or Player not found` });
        }

        const playerInRoom = roomFromDb.players.find(p => p._id === player._id);
        socket.player = playerInRoom;
        socket.roomCode = roomCode;

        socket.join(roomCode);
        
        roomFromDb.players.find(p => p._id === player._id).socketId = socket.id;
        await roomFromDb.save();

        io.to(roomCode).emit("roomUpdated", roomFromDb);
        console.log(`✅ Player ${player.name} (${socket.id}) joined room ${roomCode}`);

        if (roomFromDb.players.length >= Number(roomFromDb.maxPlayers)) {
          console.log(`🎮 Room ${roomCode} is full, starting game...`);
          startGame(io, roomFromDb, activeGames);
        }
      } catch (err) {
        console.error("joinRoom error:", err.message);
        socket.emit("error", { message: "Failed to join room." });
      }
    });

    /**
     * Handles a game restart request.
     */
    socket.on("restartGame", async ({ roomCode }) => {
      try {
        const room = await Room.findOne({ roomCode });
        if (!room) return;

        if (socket.player && socket.player._id === room.hostId) {
          console.log(`♻️ Game restart requested by host ${socket.player.name} for room ${roomCode}`);

          // ✨ FIX: Notify all clients to reset their UI before starting the new game flow.
          io.to(roomCode).emit("gameWillRestart");

          // Reset game state and start again.
          startGame(io, room, activeGames);
        } else {
          console.log(`⚠️ Unauthorized restart attempt in room ${roomCode} by socket ${socket.id}`);
          socket.emit("error", { message: "Only the host can restart the game." });
        }
      } catch (err) {
        console.error("Restart game error:", err);
        socket.emit("error", { message: "Failed to restart the game." });
      }
    });

    /**
     * Handles answer submission.
     */
    socket.on("submitAnswer", ({ roomCode, answer, playerId }) => {
      processAnswer(io, { roomCode, answer, playerId }, activeGames);
    });

    /**
     * Handles client disconnection.
     */
    socket.on("disconnect", async () => {
      console.log("❌ Client disconnected:", socket.id);
      
      const { player, roomCode } = socket;

      if (player && roomCode) {
        try {
          console.log(`👋 Player ${player.name} is leaving room ${roomCode}`);
          const updatedRoom = await Room.findOneAndUpdate(
            { roomCode },
            { $pull: { players: { _id: player._id } } },
            { new: true }
          );

          if (updatedRoom) {
            io.to(roomCode).emit("roomUpdated", updatedRoom);
          }
        } catch (err) {
          console.error("Disconnect handling error:", err);
        }
      }
    });
  });

  return io;
}