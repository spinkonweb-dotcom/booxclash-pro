// models/MultiGame.js
// Mongoose schema and model for a multiplayer game room.

import mongoose from 'mongoose';

// Schema for individual players within a room
const multiGameSchema = new mongoose.Schema({
  socketId: { type: String, required: true }, // Socket ID of the player
  username: { type: String, required: true }, // Username of the player
  // You can add more player-specific properties here (e.g., score, ready status)
});

// Main schema for a game room
const roomSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true, // Ensures each room has a unique ID
  },
  host: {
    socketId: { type: String, required: true }, // Socket ID of the host
    // You might want to store the host's username here too if needed
  },
  players: [multiGameSchema], // Array of players in the room

  // Game configuration fields (selected by host)
  subject: {
    type: String,
    enum: ['Math', 'Science'], // Enforces that subject must be 'Math' or 'Science'
    default: 'Math',
  },
  learningPhase: {
    type: String,
    enum: ['Foundation', 'Intermediate', 'Advanced'], // Enforces specific learning phases
    default: 'Foundation',
  },
  level: {
    type: Number,
    min: 1, // Minimum level
    max: 4, // Maximum level
    default: 1,
  },
  maxPlayers: {
    type: Number,
    enum: [2, 4, 8, 16, 32, 64], // Enforces specific allowed numbers of players
    default: 2,
  },
  createdAt: {
    type: Date,
    default: Date.now, // Automatically sets creation timestamp
  },

});

// Create and export the Mongoose model
const MultiGame = mongoose.model('MultiGame', roomSchema);

export default MultiGame;
