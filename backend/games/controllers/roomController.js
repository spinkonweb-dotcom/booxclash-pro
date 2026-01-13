// controllers/yourController.js
import Room from "../models/Room.js";

const generateCode = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

export const lobby = async (req, res) => {
  try {
    const {
      roomCode,
      // MODIFIED: Expect a unique player ID from the client.
      _id,
      name,
      country,
      isHost,
      subject,
      maxPlayers,
      curriculum,
      level,
      profilePic,
      targetScore,
    } = req.body;

    if (!roomCode && isHost) {
      // ✅ CREATE ROOM
      if (!subject || !maxPlayers || !curriculum || !level || !_id) {
        return res.status(400).json({
          success: false,
          message:
            "Player ID, subject, curriculum, level, and maxPlayers are required",
        });
      }

      const newRoomCode = generateCode();
      // Create the host player object with all necessary info
      const hostPlayer = { _id, name, country, isHost: true };

      const room = new Room({
        roomCode: newRoomCode,
        curriculum,
        subject,
        level,
        profilePic: profilePic || null,
        maxPlayers,
        hostName: name,
        hostCountry: country,
        players: [hostPlayer], // Add the host to the players array
        targetScore: targetScore || 10,
        // NEW: Set the room's hostId to the creator's unique ID.
        hostId: hostPlayer._id,
      });

      await room.save();
      return res
        .status(201)
        .json({ success: true, action: "created", room });
    }

    if (roomCode && !isHost) {
      // ✅ JOIN ROOM
      const room = await Room.findOne({ roomCode });
      if (!room) {
        return res
          .status(404)
          .json({ success: false, message: "Room not found" });
      }

      if (room.players.length >= room.maxPlayers) {
        return res
          .status(403)
          .json({ success: false, message: "Room is full" });
      }

      // Add the new player using their unique ID
      room.players.push({ _id, name, country, isHost: false });
      await room.save();

      return res.json({ success: true, action: "joined", room });
    }

    return res
      .status(400)
      .json({ success: false, message: "Invalid request" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};