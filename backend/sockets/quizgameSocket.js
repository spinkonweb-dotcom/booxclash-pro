import fs from "fs";

const rooms = new Map(); // roomId => room data
const questionsDB = JSON.parse(fs.readFileSync("./data/questions.json", "utf-8"));

function sanitizePlayers(room) {
  if (!room || !Array.isArray(room.players)) return;
  room.players = room.players.filter((p) => p && p.socketId);
}

function broadcastPlayerList(io, roomId) {
  const room = rooms.get(roomId);
  if (!room) return;

  sanitizePlayers(room);

  io.to(roomId).emit("playerListUpdate", room.players.map(p => ({
    id: p.socketId,
    name: p.name,
    country: p.country,
    score: room.scores.get(p.socketId) || 0,
  })));
}

const registerQuizGameHandlers = (io) => {
  io.on("connection", (socket) => {
    console.log(`⚡ Connected: ${socket.id}`);
    socket.emit("assignId", socket.id);

    socket.on("createRoom", ({ roomId, maxPlayers, hostName, hostCountry }) => {
      socket.join(roomId);
      if (rooms.has(roomId)) {
        // Room exists - just update maxPlayers if needed, and add host if missing
        const room = rooms.get(roomId);
        room.maxPlayers = maxPlayers;
        if (!room.players.find(p => p.socketId === socket.id)) {
          room.players.push({ socketId: socket.id, name: hostName, country: hostCountry });
          room.scores.set(socket.id, 0);
        }
      } else {
        // New room
        rooms.set(roomId, {
          players: [{ socketId: socket.id, name: hostName, country: hostCountry }],
          maxPlayers,
          scores: new Map([[socket.id, 0]]),
          answers: new Map(),
          playerQuestionIndex: new Map(),
          filteredQuestions: [],
          gameActive: false,
        });
      }
      broadcastPlayerList(io, roomId);
    });

    socket.on("joinRoom", ({ roomId, name, country }) => {
      const room = rooms.get(roomId);
      if (!room) return socket.emit("error", "Room not found");
      if (!name?.trim() || !country?.trim()) return socket.emit("error", "Name and country required");
      if (room.players.length >= room.maxPlayers) return socket.emit("roomFull", "Room is full");
      if (room.players.find(p => p.socketId === socket.id)) return socket.emit("error", "Already joined");

      socket.join(roomId);
      room.players.push({ socketId: socket.id, name: name.trim(), country: country.trim() });
      room.scores.set(socket.id, 0);
      broadcastPlayerList(io, roomId);

      socket.emit("waitingForHost", {
        message: "Waiting for host to start...",
        currentCount: room.players.length,
        maxPlayers: room.maxPlayers,
      });

      if (room.players.length === room.maxPlayers) {
        io.to(roomId).emit("roomFull", "Room is full, waiting for host to start");
      }
    });

    socket.on("startGame", ({ roomId, subject, topic, level }) => {
      const room = rooms.get(roomId);
      if (!room) return;

      if (room.players.length < 2) {
        return socket.emit("error", "Need at least 2 players to start");
      }

      // Filter questions
      let filtered = questionsDB;
      if (subject) filtered = filtered.filter(q => q.subject === subject);
      if (topic) filtered = filtered.filter(q => q.topic === topic);
      if (level !== undefined && level !== null) filtered = filtered.filter(q => q.level === Number(level));

      if (!filtered.length) {
        return socket.emit("error", "No questions for the selected filters");
      }
      //comment for commit

      room.filteredQuestions = filtered;
      room.gameActive = true;
      room.answers.clear();
      room.playerQuestionIndex.clear();

      room.players.forEach(player => {
        room.playerQuestionIndex.set(player.socketId, 0);
        const firstQ = filtered[0];
        io.to(player.socketId).emit("newQuestion", {
          question: firstQ,
          timeLeft: 30,
        });
      });

      io.to(roomId).emit("gameStarted");
      broadcastPlayerList(io, roomId);
    });

    socket.on("submitAnswer", ({ roomId, socketId, answer }) => {
      const room = rooms.get(roomId);
      if (!room || !room.gameActive) return;

      if (room.answers.has(socketId)) return; // already answered current question

      const currentIndex = room.playerQuestionIndex.get(socketId) ?? 0;
      const question = room.filteredQuestions[currentIndex];
      if (!question) return;

      const isCorrect = question.answer.trim().toLowerCase() === (answer?.trim().toLowerCase() || "");
      room.answers.set(socketId, answer);

      const currentScore = room.scores.get(socketId) || 0;
      if (isCorrect) {
        room.scores.set(socketId, currentScore + 10);
      }

      socket.emit("answerResult", { isCorrect });

      broadcastPlayerList(io, roomId);

      if (!isCorrect) {
        socket.emit("eliminated", { message: "Wrong answer, game over for you." });
        return;
      }

      // Move to next question
      const nextIndex = currentIndex + 1;
      room.playerQuestionIndex.set(socketId, nextIndex);
      room.answers.delete(socketId);

      if (nextIndex >= room.filteredQuestions.length) {
        room.gameActive = false;
        const winner = room.players.find(p => p.socketId === socketId);
        io.to(roomId).emit("gameOver", {
          winnerId: socketId,
          winnerName: winner?.name || "Unknown",
        });
        return;
      }

      const nextQuestion = room.filteredQuestions[nextIndex];
      socket.emit("newQuestion", { question: nextQuestion, timeLeft: 30 });
    });

    socket.on("disconnect", () => {
      console.log(`❌ Disconnected: ${socket.id}`);

      for (const [roomId, room] of rooms.entries()) {
        const index = room.players.findIndex(p => p.socketId === socket.id);
        if (index !== -1) {
          room.players.splice(index, 1);
          room.scores.delete(socket.id);
          room.answers.delete(socket.id);
          room.playerQuestionIndex.delete(socket.id);
          sanitizePlayers(room);
          broadcastPlayerList(io, roomId);

          if (room.players.length === 0) {
            rooms.delete(roomId);
          }
          break;
        }
      }
    });
  });
};

export default registerQuizGameHandlers;
