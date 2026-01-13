import mongoose from 'mongoose';

const gameRoomSchema = new mongoose.Schema({
  roomCode: { type: String, required: true, unique: true },
  hostName: { type: String, required: true },
  subject: { type: String, enum: ['Math', 'Science'], required: true },
  maxPlayers: { type: Number, enum: [2, 4, 8, 16, 32], required: true },
  players: [{ name: String, socketId: String }],
  isActive: { type: Boolean, default: true },
});

const GameRoom = mongoose.model('GameRoom', gameRoomSchema);
export default GameRoom;
