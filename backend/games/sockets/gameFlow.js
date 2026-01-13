import Question from "../../models/Questions.js";
import Room from "../models/Room.js";

/**
 * Utility: get random questions from DB
 */
async function getQuestions(subject, curriculum, level, count = 50) {
  const questions = await Question.aggregate([
    { $match: { subject, curriculum, level } },
    { $sample: { size: count } },
  ]);
  return questions;
}

/**
 * Starts the game in the given room
 */
export async function startGame(io, room, activeGames) {
  try {
    console.log(`🎯 Starting game in room ${room.roomCode}`);

    const questions = await getQuestions(
      room.subject,
      room.curriculum,
      room.level
    );

    if (!questions || questions.length === 0) {
      io.to(room.roomCode).emit("error", {
        message: "No questions found for this topic.",
      });
      return;
    }

    // Create a state object for this game
    const gameState = {
      roomCode: room.roomCode,
      questions,
      scores: {},
      currentQuestionIndex: 0,
      playersAnswered: new Set(),
      // The timer property is removed entirely
    };

    room.players.forEach((p) => {
      gameState.scores[p._id.toString()] = 0;
    });

    activeGames[room.roomCode] = gameState;

    console.log(`Initial scores for ${room.roomCode}: ${JSON.stringify(gameState.scores)}`);

    // Kick off the first question
    askNextQuestion(io, room, activeGames); // Pass the full room object
  } catch (err) {
    console.error("startGame error:", err);
    io.to(room.roomCode).emit("error", { message: "Failed to start game" });
  }
}

/**
 * Processes a submitted answer. This is the corrected function.
 */
export async function processAnswer(io, { roomCode, answer, playerId }, activeGames) {
  try {
    const gameState = activeGames[roomCode];

    // Get the room from the database to know the total number of players and the target score.
    const room = await Room.findOne({ roomCode });
    if (!room) return;

    if (!gameState || gameState.playersAnswered.has(playerId)) {
      return;
    }

    const submittingPlayer = room.players.find(p => p._id.toString() === playerId);
    if (!submittingPlayer) {
      console.error(`Error: Player with ID ${playerId} not found in room ${roomCode}.`);
      return;
    }

    const question = gameState.questions[gameState.currentQuestionIndex];
    const isCorrect = answer === question.answer;

    if (isCorrect) {
      gameState.scores[playerId] = (gameState.scores[playerId] || 0) + 1; // Increment score by 1
    }
    
    gameState.playersAnswered.add(playerId); // Mark this player as having answered

    console.log(`Player ${submittingPlayer.name} answered. Correct: ${isCorrect}`);

    // Broadcast the result to everyone in the room
    io.to(roomCode).emit("answerResult", {
      player: submittingPlayer,
      correct: isCorrect,
      correctAnswer: question.answer,
      chosenAnswer: answer,
      scores: gameState.scores,
    });

    // Check if the game should end based on target score
    if (gameState.scores[playerId] >= room.targetScore) {
      console.log(`🏆 Player ${submittingPlayer.name} reached the target score! Game over in room ${roomCode}.`);
      io.to(roomCode).emit("gameOver", {
        winner: submittingPlayer,
        scores: gameState.scores,
      });
      delete activeGames[roomCode]; // Clean up the game state
      return;
    }

    // Now, every time a player answers, the timer is initiated to move to the next question.
    // We only need to do this once per question. Let's use a flag or check if it's the first answer.
    if (gameState.playersAnswered.size === 1) {
       console.log(`First answer received for question. Moving to next question in 3 seconds.`);
      setTimeout(() => {
        askNextQuestion(io, room, activeGames);
      }, 3000); 
    }
  } catch (error) {
    console.error("Error processing answer:", error);
  }
}

/**
 * Asks the next question or ends the game.
 */
function askNextQuestion(io, room, activeGames) {
  const gameState = activeGames[room.roomCode];
  if (!gameState) return;

  // The game should already be over if a player hit the target score,
  // so this only handles running out of questions.
  if (gameState.currentQuestionIndex + 1 >= gameState.questions.length) {
    // End the game because there are no more questions.
    const finalScores = gameState.scores;
    const winnerId = Object.keys(finalScores).reduce((a, b) => finalScores[a] > finalScores[b] ? a : b);
    const winner = room.players.find(p => p._id.toString() === winnerId);

    console.log(`🏆 Game over in room ${room.roomCode}. No more questions.`);
    
    io.to(room.roomCode).emit("gameOver", {
      winner,
      scores: finalScores,
    });
    delete activeGames[room.roomCode];
    return;
  }

  // Move to the next question index
  gameState.currentQuestionIndex++;
  gameState.playersAnswered.clear();

  const question = gameState.questions[gameState.currentQuestionIndex];
  const questionNumber = gameState.currentQuestionIndex + 1;

  console.log(`📢 Room ${room.roomCode}: Asking question ${questionNumber}`);

  io.to(room.roomCode).emit("questionStart", {
    question: {
      prompt: question.question,
      options: question.options,
    },
    questionNumber,
    scores: gameState.scores,
  });
}