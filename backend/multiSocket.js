// multi-socket.js
import { Server } from 'socket.io';
import Room from './models/MultiGame.js'; // Ensure this path is correct for your Mongoose Room model
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// In ES modules, __dirname is not available directly. We construct it like this.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read and parse the JSON file for quiz questions.
let allQuestions = {};
const quizPath = path.join(__dirname, 'data', 'quiz.json');
try {
  if (fs.existsSync(quizPath)) {
    const fileContent = fs.readFileSync(quizPath, 'utf-8');
    allQuestions = JSON.parse(fileContent);
  } else {
    console.error(`❌ [INIT ERROR] quiz.json not found at ${quizPath}`);
  }
} catch (err) {
  console.error(`❌ [INIT ERROR] Failed to read or parse quiz.json:`, err);
  allQuestions = {};
}

// --- Helper Functions ---

// Generates a random room ID.
function generateRoomId(length = 5) {
  return Math.random().toString(36).substring(2, 2 + length).toUpperCase();
}

// Gets questions based on room configuration.
function getQuestionsForRoom(subject, learningPhase, level) {
  const levelKey = `Level ${level}`;
  try {
    const questions = allQuestions[learningPhase]?.[subject]?.[levelKey];
    if (questions && Array.isArray(questions)) {
      console.log(`Server: Found ${questions.length} questions for ${learningPhase} - ${subject} - ${levelKey}`);
      // Ensure questions are a deep copy if they are modified later, to avoid affecting global allQuestions
      return JSON.parse(JSON.stringify(questions));
    } else {
      console.warn(`Server: No questions found for ${learningPhase} - ${subject} - ${levelKey}.`);
      return [];
    }
  } catch (error) {
    console.error(`Server: Error accessing questions data for ${learningPhase} - ${subject} - ${levelKey}:`, error);
    return [];
  }
}

// Shuffles an array randomly.
const shuffleArray = (array) => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
};

// --- Tournament State Management (in-memory for simplicity for current round) ---
// For persistent state across server restarts, integrate fully with Mongoose Room model.
const roomTournamentState = new Map(); // roomId -> { currentRoundPlayers: [], activeMatches: {}, questions: [], currentQuestionIndex: 0, matchStartTime: null }

// Helper to update and emit game state to a room
async function updateAndEmitGameState(io, roomId) {
  const room = await Room.findOne({ roomId });
  if (!room) {
      console.warn(`[GameState Update] Room ${roomId} not found.`);
      return;
  }

  const currentTournamentState = roomTournamentState.get(roomId);
  if (!currentTournamentState) {
      console.warn(`[GameState Update] Tournament state for room ${roomId} not found.`);
      return;
  }

  const playersInRoom = room.players.map(p => ({
    username: p.username,
    socketId: p.socketId,
    status: room.eliminatedPlayers.includes(p.username) ? 'eliminated' : 'active'
  }));

  let currentQuestion = null;
  let activePair = null;
  let matchStartTime = currentTournamentState.matchStartTime;
  let gamePhase = currentTournamentState.gamePhase || 'waiting'; // Default or from state
  let winner = currentTournamentState.winner || null;


  // Find the active match for this room
  const activeMatch = Object.values(currentTournamentState.activeMatches)[0];

  if (activeMatch && currentTournamentState.questions.length > 0) {
    currentQuestion = currentTournamentState.questions[currentTournamentState.currentQuestionIndex];
    activePair = activeMatch.players;
    gamePhase = 'match';
  }

  // Determine winner status more robustly
  if (room.eliminatedPlayers.length === room.maxPlayers -1 && room.maxPlayers > 1) {
    const remainingPlayer = room.players.find(p => !room.eliminatedPlayers.includes(p.username));
    if (remainingPlayer) {
      winner = remainingPlayer.username;
      gamePhase = 'winner';
      // Set the winner's status in playersInRoom
      playersInRoom.forEach(p => {
        if (p.username === winner) p.status = 'winner';
      });
    }
  } else if (room.maxPlayers === 1 && room.players.length === 1 && !winner) { // Case for single player "winner" if tournament starts with 1
    winner = room.players[0].username;
    gamePhase = 'winner';
    playersInRoom.forEach(p => {
      if (p.username === winner) p.status = 'winner';
    });
  }

  // Update tournament state with determined winner/phase for persistence
  currentTournamentState.gamePhase = gamePhase;
  currentTournamentState.winner = winner;


  io.to(roomId).emit('game-state-update', {
    gamePhase,
    currentQuestion,
    activePair,
    playersInRoom,
    matchStartTime,
    winner,
  });
  console.log(`[${roomId}] Emitted game-state-update: Phase=${gamePhase}, Question=${currentQuestion ? currentQuestion.question : 'N/A'}`);
}

// Function to start the next match (or round)
async function startNextMatchOrRound(io, roomId) {
    const room = await Room.findOne({ roomId });
    if (!room) return;

    const tournamentState = roomTournamentState.get(roomId);
    if (!tournamentState) return;

    const activePlayers = room.players.filter(p => !room.eliminatedPlayers.includes(p.username));

    // Check for overall tournament winner first
    if (activePlayers.length === 1) {
        const winnerUsername = activePlayers[0].username;
        tournamentState.winner = winnerUsername;
        tournamentState.gamePhase = 'winner';
        await updateAndEmitGameState(io, roomId); // Send final state
        io.to(roomId).emit('declare-winner', winnerUsername); // Tell client winner
        console.log(`🏆 [TOURNAMENT END] Winner in room ${roomId}: ${winnerUsername}`);
        roomTournamentState.delete(roomId); // Clean up state
        return;
    } else if (activePlayers.length === 0) {
        console.warn(`[${roomId}] No active players left. Ending tournament without a winner.`);
        io.to(roomId).emit('error', 'Tournament ended unexpectedly due to no active players.');
        roomTournamentState.delete(roomId);
        return;
    }


    // Evaluate current match results if an active match exists and concluded
    const currentActiveMatch = Object.values(tournamentState.activeMatches)[0];
    if (currentActiveMatch) {
        const playersAnsweredCount = Object.keys(currentActiveMatch.scores).length;
        const totalPlayersInMatch = currentActiveMatch.players.length;

        // If all players in the current match have answered the current question
        if (playersAnsweredCount === totalPlayersInMatch) {
            // Check if we can move to the next question in this match
            if (tournamentState.currentQuestionIndex < tournamentState.questions.length - 1) {
                tournamentState.currentQuestionIndex++;
                tournamentState.matchStartTime = Date.now();
                currentActiveMatch.scores = {}; // Reset question scores for next question
                console.log(`[${roomId}] Moving to next question: ${tournamentState.currentQuestionIndex + 1}`);
                await updateAndEmitGameState(io, roomId); // Emit new question for current match
                return; // Wait for answers for the new question
            } else {
                // All questions for this match are answered, determine match winner
                const player1 = currentActiveMatch.players[0];
                const player2 = currentActiveMatch.players[1];

                const p1Score = currentActiveMatch.matchScores[player1]?.score || 0;
                const p2Score = currentActiveMatch.matchScores[player2]?.score || 0;
                const p1Time = currentActiveMatch.matchScores[player1]?.time || Infinity;
                const p2Time = currentActiveMatch.matchScores[player2]?.time || Infinity;

                let matchWinner, matchLoser;
                if (p1Score > p2Score) {
                    matchWinner = player1;
                    matchLoser = player2;
                } else if (p2Score > p1Score) {
                    matchWinner = player2;
                    matchLoser = player1;
                } else { // Tie-breaker on total time taken for the match
                    matchWinner = p1Time < p2Time ? player1 : player2;
                    matchLoser = matchWinner === player1 ? player2 : player1;
                }

                room.eliminatedPlayers.push(matchLoser);
                await room.save(); // Save the elimination
                const loserSocketId = room.players.find(p => p.username === matchLoser)?.socketId;
                if (loserSocketId) {
                    io.to(loserSocketId).emit('eliminated'); // Tell the loser they are out
                }
                console.log(`[${roomId}] ${matchLoser} eliminated. Winner of match: ${matchWinner}`);

                // Clear the active match and reset for next round/tournament end
                tournamentState.activeMatches = {};
                tournamentState.currentQuestionIndex = 0; // Reset question index for next match/round
                tournamentState.matchStartTime = null; // Clear match start time
                tournamentState.gamePhase = 'waiting'; // Back to waiting before next match starts

                // Recursively call to check for tournament winner or start next round
                await startNextMatchOrRound(io, roomId);
                return;
            }
        } else {
            // Not all players have answered the current question yet, wait.
            // Just update state for players to show current question.
            await updateAndEmitGameState(io, roomId);
            return;
        }
    }


    // If no active match or after a match concludes, try to form new pairs and start next round
    const remainingPlayersForRound = room.players.filter(p => !room.eliminatedPlayers.includes(p.username));
    if (remainingPlayersForRound.length >= 2) {
        const shuffledPlayers = shuffleArray(remainingPlayersForRound);
        const nextPairs = [];
        const playersWithBye = [];

        for (let i = 0; i < shuffledPlayers.length; i += 2) {
            if (shuffledPlayers[i+1]) { // Ensure there's a pair
                nextPairs.push([shuffledPlayers[i].username, shuffledPlayers[i+1].username]);
            } else {
                // Odd number of players: last player gets a 'bye' and advances to next round
                playersWithBye.push(shuffledPlayers[i].username);
                console.log(`[${roomId}] Player ${shuffledPlayers[i].username} gets a bye this round.`);
                // For simplicity, players with a bye are not 'eliminated' but just wait out the round.
                // In a real tournament, they might be automatically advanced to the next round.
                // For now, we'll just not include them in a match.
            }
        }

        if (nextPairs.length > 0) {
            // Take the first pair to start the next match
            const [player1, player2] = nextPairs[0];
            tournamentState.activeMatches = {
                [`${player1}_vs_${player2}`]: {
                    players: [player1, player2],
                    scores: {}, // Scores for current question
                    matchScores: { [player1]: { score: 0, time: 0 }, [player2]: { score: 0, time: 0 } }, // Total scores for the match across all questions
                }
            };
            tournamentState.currentQuestionIndex = 0; // Reset question index for new match
            // Fetch fresh questions for the match (could be same questions, or a new set depending on logic)
            tournamentState.questions = getQuestionsForRoom(room.subject, room.learningPhase, room.level);

            if (tournamentState.questions.length === 0) {
              console.error(`[${roomId}] No questions available for the next match. Ending tournament.`);
              io.to(roomId).emit('error', 'No more questions available to continue the tournament.');
              roomTournamentState.delete(roomId);
              return;
            }

            tournamentState.matchStartTime = Date.now();
            tournamentState.gamePhase = 'match'; // Set phase to match

            console.log(`[${roomId}] Starting new match: ${player1} vs ${player2}`);
            await updateAndEmitGameState(io, roomId); // Send game state for the new match
        } else {
            console.log(`[${roomId}] No new pairs formed or only bye players remain.`);
            // This might mean all remaining players got a bye and thus advanced automatically,
            // or the tournament is effectively over but not yet declared winner (e.g., if only 1 player remains by bye).
            if (remainingPlayersForRound.length === 1 && playersWithBye.includes(remainingPlayersForRound[0].username)) {
              // The last player won by a bye
              const winnerUsername = remainingPlayersForRound[0].username;
              tournamentState.winner = winnerUsername;
              tournamentState.gamePhase = 'winner';
              await updateAndEmitGameState(io, roomId);
              io.to(roomId).emit('declare-winner', winnerUsername);
              console.log(`🏆 [TOURNAMENT END] Winner in room ${roomId} by bye: ${winnerUsername}`);
              roomTournamentState.delete(roomId);
            } else {
                // Unexpected state, perhaps all players left
                await updateAndEmitGameState(io, roomId);
            }
        }
    } else if (remainingPlayersForRound.length === 1) {
        // This case should ideally be caught by the first `if (activePlayers.length === 1)` block.
        // If we reach here, it's a double-check.
        const winnerUsername = remainingPlayersForRound[0].username;
        tournamentState.winner = winnerUsername;
        tournamentState.gamePhase = 'winner';
        await updateAndEmitGameState(io, roomId);
        io.to(roomId).emit('declare-winner', winnerUsername);
        console.log(`🏆 [TOURNAMENT END] Winner in room ${roomId}: ${winnerUsername}`);
        roomTournamentState.delete(roomId);
    } else {
      console.log(`[${roomId}] Not enough players (${remainingPlayersForRound.length}) to start a new match. Waiting...`);
      // Update the general lobby state if no matches can be formed
      await updateAndEmitGameState(io, roomId);
    }
}


// Main function to initialize Socket.IO with the HTTP server
export function initializeSockets(server) {
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`✅ [SOCKET CONNECTED] User ID: ${socket.id}`);

    // --- Room Management Handlers ---

    socket.on('create-room', async ({ username, subject, learningPhase, level, maxPlayers }) => {
      const roomId = generateRoomId();
      console.log(`📤 [CREATE ROOM] Attempt by ${socket.id} with username: ${username}`);

      try {
        const newRoom = new Room({
          roomId,
          host: { socketId: socket.id, username },
          players: [{ socketId: socket.id, username: username || 'Host' }],
          subject,
          learningPhase,
          level,
          maxPlayers,
          eliminatedPlayers: [],
        });
        await newRoom.save();

        socket.join(roomId);
        // Also send room configuration to the host so they have it set for game-start
        const roomConfig = {
            roomId: newRoom.roomId,
            subject: newRoom.subject,
            learningPhase: newRoom.learningPhase,
            level: newRoom.level,
            maxPlayers: newRoom.maxPlayers,
        };
        socket.emit('room-created', { roomId, players: newRoom.players.map(p => p.username), roomData: roomConfig });
        console.log(`✅ [ROOM CREATED] Room ID: ${roomId} by ${socket.id}`);
      } catch (error) {
        console.error('❌ [CREATE ROOM ERROR]', error);
        socket.emit('error', 'Could not create room.');
      }
    });

    socket.on('join-room', async ({ roomId, username }) => {
      console.log(`📤 [JOIN ROOM] Attempt by ${socket.id} (${username}) to join ${roomId}`);

      try {
        const room = await Room.findOne({ roomId });
        if (!room) {
          return socket.emit('error', 'Room not found.');
        }
        if (room.players.length >= room.maxPlayers) {
          return socket.emit('error', 'Room is full.');
        }

        // Add player and save
        room.players.push({ socketId: socket.id, username: username || 'Guest' });
        await room.save();

        socket.join(roomId);
        // Broadcast to existing players that a new player joined
        io.to(roomId).emit('player-joined', { players: room.players.map(p => p.username) });
        // Send detailed room info to the newly joined player
        socket.emit('room-joined', { roomId, players: room.players.map(p => p.username), roomData: room.toObject() });
        console.log(`✅ [ROOM JOINED] ${socket.id} joined room ${roomId}`);


        // If room is full, start the game
        if (room.players.length === room.maxPlayers) {
          console.log(`🎉 [GAME START] Room ${roomId} reached max players.`);
          const initialQuizQuestions = getQuestionsForRoom(room.subject, room.learningPhase, room.level);

          if (initialQuizQuestions.length === 0) {
            io.to(roomId).emit('error', 'No questions available for this room configuration. Game cannot start.');
            await Room.deleteOne({ roomId }); // Clean up the room if no questions
            console.error(`❌ [GAME START FAILED] No questions for ${roomId}. Room deleted.`);
            return;
          }

          // Initialize tournament state for the room
          const playersArray = room.players.map(p => p.username);
          const shuffledPlayers = shuffleArray(playersArray);
          const initialEliminatedPlayers = [];

          // Determine initial byes
          for (let i = 0; i < shuffledPlayers.length; i += 2) {
            if (!shuffledPlayers[i+1]) { // If there's an odd player left
               initialEliminatedPlayers.push(shuffledPlayers[i]); // This player gets a bye, "advances" by not playing first round
               console.log(`[${roomId}] Player ${shuffledPlayers[i]} gets a bye in initial round.`);
            }
          }
          room.eliminatedPlayers = initialEliminatedPlayers; // Update DB with initial byes
          await room.save();

          roomTournamentState.set(roomId, {
            currentRoundPlayers: playersArray, // All initial players
            eliminatedPlayers: [...initialEliminatedPlayers], // Players who get a bye are effectively "eliminated" from the first round of matches
            activeMatches: {},
            questions: initialQuizQuestions, // All questions available for the tournament
            currentQuestionIndex: 0,
            matchStartTime: null,
            gamePhase: 'waiting', // Initial phase, will transition to 'match'
            winner: null,
          });

          // Inform clients that game has started
          // The quizQuestions here is for the client to potentially pre-load or just acknowledge it's starting
          io.to(roomId).emit('game-start', {
            roomData: {
              roomId: room.roomId,
              subject: room.subject,
              learningPhase: room.learningPhase,
              level: room.level,
              maxPlayers: room.maxPlayers,
            },
            players: room.players.map(p => p.username),
            // We are no longer sending the full quizQuestions array here to GameRoom
            // GameRoom will derive currentQuestion from `game-state-update`
          });

          // Start the first match immediately after sending game-start
          // This will trigger the first game-state-update with the first question
          await startNextMatchOrRound(io, roomId);

        }
      } catch (error) {
        console.error('❌ [JOIN ROOM ERROR]', error);
        socket.emit('error', 'Could not join room.');
      }
    });

    // --- Answer Submission Handler ---
    socket.on('submit-answer', async ({ roomId, username, correct, timeTaken }) => {
      try {
        const room = await Room.findOne({ roomId });
        const tournamentState = roomTournamentState.get(roomId);

        if (!room || !tournamentState) {
          return console.error(`[ERROR] Room or tournament state not found for ${roomId}`);
        }

        const activeMatchEntry = Object.values(tournamentState.activeMatches)[0]; // Assuming one active match
        if (!activeMatchEntry || !activeMatchEntry.players.includes(username)) {
            console.log(`[SUBMIT ANSWER] User ${username} not in active match or no active match.`);
            // It's possible a spectator or eliminated player tried to answer.
            return;
        }

        const currentQuestion = tournamentState.questions[tournamentState.currentQuestionIndex];
        if (!currentQuestion) {
            console.error(`[SUBMIT ANSWER] No current question found for room ${roomId}`);
            return;
        }

        // Only process answer if not already answered for this question
        if (activeMatchEntry.scores[username]) {
            console.warn(`[SUBMIT ANSWER] ${username} already submitted for current question.`);
            return;
        }

        // Store result for the current question within the match
        activeMatchEntry.scores[username] = { correct, timeTaken };

        // Update overall match scores
        if (!activeMatchEntry.matchScores[username]) {
            activeMatchEntry.matchScores[username] = { score: 0, time: 0 };
        }
        if (correct) {
            activeMatchEntry.matchScores[username].score++;
        }
        activeMatchEntry.matchScores[username].time += timeTaken;


        // Check if both players in the current match have answered the current question
        const playersInMatch = activeMatchEntry.players;
        const allAnswered = playersInMatch.every(p => activeMatchEntry.scores[p] !== undefined);

        if (allAnswered) {
          console.log(`[${roomId}] Both players in current match have answered question ${tournamentState.currentQuestionIndex + 1}.`);
          // Advance to the next question or determine match winner
          await startNextMatchOrRound(io, roomId);
        } else {
            // If only one player answered, update state for others (e.g., to show waiting)
            await updateAndEmitGameState(io, roomId);
        }

      } catch (error) {
        console.error('❌ [SUBMIT ANSWER ERROR]', error);
      }
    });

    // --- Disconnect Handler ---
    socket.on('disconnect', async () => {
      console.log(`⚡ [DISCONNECTED] ${socket.id} disconnected.`);
      try {
        const room = await Room.findOne({ 'players.socketId': socket.id });
        if (room) {
          // Find the username of the disconnected player before removing them from the room
          const disconnectedUsername = room.players.find(p => p.socketId === socket.id)?.username;

          if (room.host.socketId === socket.id) {
            await Room.deleteOne({ _id: room._id });
            roomTournamentState.delete(room.roomId); // Clean up in-memory state
            io.to(room.roomId).emit('error', 'The host has disconnected. Room closed.');
            console.log(`❌ [HOST LEFT] Room ${room.roomId} deleted.`);
          } else {
            room.players = room.players.filter((p) => p.socketId !== socket.id);
            // If the disconnected player was NOT already eliminated, mark them as eliminated now
            if (disconnectedUsername && !room.eliminatedPlayers.includes(disconnectedUsername)) {
                room.eliminatedPlayers.push(disconnectedUsername);
                console.log(`[DISCONNECT] Player ${disconnectedUsername} marked as eliminated.`);
            }
            await room.save();

            // Check if game is in progress and if disconnection affects current match
            const tournamentState = roomTournamentState.get(room.roomId);
            if (tournamentState && Object.keys(tournamentState.activeMatches).length > 0) {
              const activeMatchEntry = Object.values(tournamentState.activeMatches)[0];
              if (activeMatchEntry && disconnectedUsername && activeMatchEntry.players.includes(disconnectedUsername)) {
                // If a player in an active match disconnects, their opponent wins by default
                const opponentUsername = activeMatchEntry.players.find(p => p !== disconnectedUsername);
                if (opponentUsername) {
                  console.log(`[DISCONNECT AUTO-WIN] ${disconnectedUsername} disconnected. ${opponentUsername} wins match.`);
                  // Simulate opponent answering to trigger startNextMatchOrRound logic
                  // This is a simplified approach. A more robust one would directly manage match outcome.
                  activeMatchEntry.scores[opponentUsername] = { correct: true, timeTaken: 1 }; // Give opponent a default correct answer
                  // Now call startNextMatchOrRound to re-evaluate the match state
                  await startNextMatchOrRound(io, room.roomId);
                  return; // Exit after handling match progression
                }
              }
            }

            // If not in an active match or opponent not found, just update player list and state
            io.to(room.roomId).emit('player-left', { players: room.players.map(p => p.username) });
            if (tournamentState) {
                await updateAndEmitGameState(io, room.roomId);
            }
            console.log(`👋 [PLAYER LEFT] ${socket.id} left room ${room.roomId}`);
          }
        }
      } catch (error) {
        console.error('❌ [DISCONNECT ERROR]', error);
      }
    });
  });

  return io;
}