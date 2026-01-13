// src/pages/ProgressMap/ProgressMap.tsx
import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../../Navbar";
import { lessons, Lesson } from "./Data/lessonData";
import Modal from "./Components/Modal";
import { lessonComponentMap } from "./Components/Lessons/lessonMap";
import useWindowWidth from "./Components/useWindowWidth";
import LessonPath from "./LessonPath";
import LessonHandlers from "./LessonHandlers";
import { SpeechProvider } from "./SpeechContext"; // adjust path

// ---------------- TYPES ----------------
interface CompletedLesson {
  lessonId: string;
  title: string;
  type: string;
}

interface ChildData {
  _id: string;
  childName: string;
  avatarUrl?: string;
  points: number;
  streak: number;
  subject: string;
  lessonsCompleted: CompletedLesson[];
  isPremium: boolean;
  progressStatus: "active" | "needs_upgrade" | "premium";
  childGrade: string;
}

export type NodePosition = { x: number; y: number };

interface AllLessonProps {
  onComplete: () => void;
  isMuted: boolean;
}
// ---------------- MAIN COMPONENT ----------------
const ProgressMap: React.FC = () => {
  const navigate = useNavigate();
  const [studentData, setStudentData] = useState<ChildData | null>(null);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [mascotDisplayPosition, setMascotDisplayPosition] =
    useState<NodePosition | null>(null);

  const nodeRefs = useRef<(HTMLButtonElement | HTMLDivElement | null)[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null!);

  const windowWidth = useWindowWidth();
  const isMobile = windowWidth < 768;

  // Sound state and refs managed at parent
  const [isMuted, setIsMuted] = useState(false);
  const bgMusicRef = useRef<HTMLAudioElement | null>(null);

  // ---------------- LOAD STUDENT DATA ----------------
  useEffect(() => {
    const savedData = sessionStorage.getItem("childData");
    if (savedData) {
      const parsed: ChildData = JSON.parse(savedData);
      setStudentData(parsed);
      setCurrentLessonIndex(parsed.lessonsCompleted.length);
    } else {
      navigate("/child-setup");
    }
  }, [navigate]);

  // initialize background music audio once
  useEffect(() => {
    if (!bgMusicRef.current) {
      const audio = new Audio("/sounds/bg-music.mp3");
      audio.loop = true;
      audio.volume = 0.45;
      bgMusicRef.current = audio;
    }
    // cleanup on unmount
    return () => {
      if (bgMusicRef.current) {
        bgMusicRef.current.pause();
        bgMusicRef.current.currentTime = 0;
      }
    };
  }, []);

  // Play/pause background music when modal opens/closes or when muted toggles
  useEffect(() => {
    const audio = bgMusicRef.current;
    if (!audio) return;
    if (isLessonModalOpen && !isMuted) {
      audio.play().catch(() => {
        // autoplay may be blocked; ignore
      });
    } else {
      audio.pause();
    }
    // when muted toggles while open
  }, [isLessonModalOpen, isMuted]);

  // ---------------- HANDLERS ----------------
  const handlers = LessonHandlers({
    studentData,
    setStudentData,
    currentLessonIndex,
    setCurrentLessonIndex,
    selectedLesson,
    setSelectedLesson,
    setIsLessonModalOpen,
    setIsUpgradeModalOpen,
  });

  const LessonComponent =
    selectedLesson && lessonComponentMap[selectedLesson.id]
          ? (lessonComponentMap[selectedLesson.id] as unknown as React.ComponentType<AllLessonProps>) // Cast here
          : null;

  // ---------------- LOADING STATE ----------------
  if (!studentData)
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-orange-500 via-purple-600 to-blue-600 flex justify-center items-center text-white text-2xl">
        Loading Your Adventure...
      </div>
    );

  // toggle mute (passed down to modal/header)
  const toggleMute = () => setIsMuted((p) => !p);

  // When lesson completes inside modal, close modal and stop bg music
  const onLessonCompleteFromModal = () => {
    setIsLessonModalOpen(false);
    // handler for marking complete
    handlers.handleCompleteLessonInModal();
    // pause bg music explicitly
    if (bgMusicRef.current) {
      bgMusicRef.current.pause();
      bgMusicRef.current.currentTime = 0;
    }
  };

  // ---------------- MAIN UI ----------------
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-orange-500 via-purple-600 to-blue-600 flex flex-col items-center overflow-hidden">
      <Navbar childData={studentData} />

      <div className="w-full flex-grow flex flex-col items-center p-4">
        <h1 className="text-4xl font-bold text-white mb-4 text-center drop-shadow-lg">
          Your Learning Path
        </h1>

        {/* PATH SECTION */}
        <LessonPath
          lessons={lessons}
          nodeRefs={nodeRefs}
          scrollContainerRef={scrollContainerRef}
          mascotDisplayPosition={mascotDisplayPosition}
          setMascotDisplayPosition={setMascotDisplayPosition}
          currentLessonIndex={currentLessonIndex}
          studentData={studentData}
          handleLessonClick={handlers.handleLessonClick}
          isMobile={isMobile}
        />
      </div>

      {/* LESSON MODAL */}
      <Modal
        isOpen={isLessonModalOpen}
        onClose={() => {
          setIsLessonModalOpen(false);
          if (bgMusicRef.current) {
            bgMusicRef.current.pause();
            bgMusicRef.current.currentTime = 0;
          }
        }}
        title={selectedLesson?.title || "Lesson"}
        isMuted={isMuted}
        toggleMute={toggleMute}
      >
        <SpeechProvider isMuted={isMuted}>
          {LessonComponent ? (
            <LessonComponent
              onComplete={onLessonCompleteFromModal}
              isMuted={isMuted}
            />
          ) : (
            <div className="p-4">
              <p className="text-white">This content is not available yet.</p>
            </div>
          )}
        </SpeechProvider>
      </Modal>
      {/* UPGRADE MODAL */}
      <Modal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        title="Upgrade to Continue"
        isMuted={isMuted}
        toggleMute={toggleMute}
      >
        <div className="p-4 text-center">
          <p className="text-lg mb-4 text-white">
            You’ve completed all the free lessons! Unlock the rest of your adventure
            by following the instructions below.
          </p>

          <div className="my-6 p-4 bg-white/20 rounded-lg text-left">
            <h4 className="font-bold text-white mb-2">Mobile Money Payment:</h4>
            <ul className="list-disc list-inside text-white space-y-1">
              <li>
                Amount: <span className="font-semibold">K95/month</span>
              </li>
              <li>
                Pay to: <span className="font-semibold">0967001972</span> or{" "}
                <span className="font-semibold">0978933791</span>
              </li>
              <li>
                Account: <span className="font-semibold">Booxclash Learn LTD</span>
              </li>
              <li className="mt-2">
                <b>Important:</b> Forward the payment SMS to the number paid.
              </li>
            </ul>
          </div>

          <button
            onClick={handlers.handleUpgradeRequest}
            className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-all"
          >
            Send Reminder to Parent
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default ProgressMap;
