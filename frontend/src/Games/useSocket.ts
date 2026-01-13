import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { Player, RoomDetails, GameState } from "./interfaces";
import { API_BASE } from "./constants";

type Phase = "lobby" | "countdown" | "quiz" | "result" | "gameOver";

export const useSockets = (
  playerId: string | null,
  setRoom: React.Dispatch<React.SetStateAction<RoomDetails | null>>,
  setMe: React.Dispatch<React.SetStateAction<Player | null>>,
  setPhase: React.Dispatch<React.SetStateAction<Phase>>,
  setCountdownTimer: React.Dispatch<React.SetStateAction<number | null>>,
  setGameState: React.Dispatch<React.SetStateAction<GameState | null>>,
  setAnswerResult: React.Dispatch<
    React.SetStateAction<
      | { player: Player; correct: boolean; correctAnswer: string; chosenAnswer?: string }
      | null
    >
  >,
  setFinalWinner: React.Dispatch<React.SetStateAction<Player | null>>,
  setError: React.Dispatch<React.SetStateAction<string | null>>
) => {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!playerId) return;

    if (!socketRef.current) {
      socketRef.current = io(API_BASE);
      console.log("🔌 Socket connection initialized for player:", playerId);
    }
    const socket = socketRef.current;

    // --- Define all event handlers ---
    const onConnect = () => console.log("✅ Socket connected with ID:", socket.id);

    const onRoomUpdated = (updatedRoom: RoomDetails) => {
      setRoom(updatedRoom);
      const self = updatedRoom.players.find((p) => p._id === playerId);
      if (self) {
        setMe(self);
      }
    };

    const onCountdown = (timer: number) => {
      setPhase("countdown");
      setCountdownTimer(timer);
    };

    const onQuestionStart = (data: GameState) => {
      setGameState(data);
      setAnswerResult(null);
      setPhase("quiz");
    };

    const onAnswerResult = (data: any) => {
      setGameState((prev) => (prev ? { ...prev, scores: data.scores } : null));
      setAnswerResult({
        player: data.player,
        correct: data.correct,
        correctAnswer: data.correctAnswer,
        chosenAnswer: data.chosenAnswer,
      });
    };

    const onGameOver = ({ winner, scores }: any) => {
      setFinalWinner(winner);
      setGameState((prev) =>
        prev ? { ...prev, scores } : ({ scores, question: null } as any)
      );
      setPhase("gameOver");
    };

    // ✨ FIX: This handler correctly resets the UI for all players.
    const onGameWillRestart = () => {
      console.log("♻️ Game is restarting, resetting UI to initial state.");
      setAnswerResult(null);
      setFinalWinner(null);
      setGameState(null);
      // The 'countdown' event from the server will set the new phase.
    };

    const onError = (error: any) => {
      console.error("Socket error:", error);
      setError(error.message || "An unknown server error occurred.");
    };

    // --- Register event handlers ---
    socket.on("connect", onConnect);
    socket.on("roomUpdated", onRoomUpdated);
    socket.on("countdown", onCountdown);
    socket.on("questionStart", onQuestionStart);
    socket.on("answerResult", onAnswerResult);
    socket.on("gameOver", onGameOver);
    socket.on("gameWillRestart", onGameWillRestart); // ✨ FIX: Using the correct event
    socket.on("error", onError);

    // --- Cleanup: remove listeners when dependencies change ---
    return () => {
      socket.off("connect", onConnect);
      socket.off("roomUpdated", onRoomUpdated);
      socket.off("countdown", onCountdown);
      socket.off("questionStart", onQuestionStart);
      socket.off("answerResult", onAnswerResult);
      socket.off("gameOver", onGameOver);
      socket.off("gameWillRestart", onGameWillRestart); // ✨ FIX: Cleaning up the correct event
      socket.off("error", onError);
    };
  }, [playerId, setRoom, setMe, setPhase, setCountdownTimer, setGameState, setAnswerResult, setFinalWinner, setError]);

  useEffect(() => {
    return () => {
      if (socketRef.current) {
        console.log("🔌 Disconnecting socket on final unmount...");
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  return socketRef.current;
};