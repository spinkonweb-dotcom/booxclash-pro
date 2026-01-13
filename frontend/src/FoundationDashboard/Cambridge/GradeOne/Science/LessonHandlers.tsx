import { Lesson } from "./Data/lessonData";

const FREE_LIMIT = 5; // adjust dynamically if needed
const LESSON_POINTS = 100;
const firstReviewIndex = 4;
const API_BASE = "https://backend-162267981396.us-central1.run.app";
const LessonHandlers = ({
  studentData,
  setStudentData,
  currentLessonIndex,
  setCurrentLessonIndex,
  selectedLesson,
  setSelectedLesson,
  setIsLessonModalOpen,
  setIsUpgradeModalOpen,
}: any) => {
  const handleLessonClick = (lesson: Lesson, index: number) => {
    if (!studentData) return;
    if (index >= FREE_LIMIT && !studentData.isPremium && index === currentLessonIndex) {
      setIsUpgradeModalOpen(true);
      return;
    }
    if ((lesson.type === "lesson" || lesson.type === "topic") && index <= currentLessonIndex) {
      setSelectedLesson(lesson);
      setIsLessonModalOpen(true);
    } else if (index > currentLessonIndex) {
      alert("This lesson is locked! Complete previous ones first.");
    }
  };

  const handleCompleteLessonInModal = async () => {
    if (!studentData || !selectedLesson) return;
    const isAlreadyDone = studentData.lessonsCompleted.some(
      (l: any) => l.lessonId === selectedLesson.id
    );
    if (!isAlreadyDone) {
      const updatedProgress = {
        points: studentData.points + LESSON_POINTS,
        streak: studentData.streak + 1,
        completedLesson: selectedLesson,
      };
      try {
        const res = await fetch(
          `${API_BASE}/api/children/${studentData._id}/progress`,
          {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${sessionStorage.getItem("token")}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(updatedProgress),
          }
        );
        if (!res.ok) throw new Error("Failed to save progress.");
        const data = await res.json();
        const updated = data.child;
        setStudentData(updated);
        sessionStorage.setItem("childData", JSON.stringify(updated));
        const newIndex = currentLessonIndex + 1;
        const isFirstReview =
          selectedLesson.type === "topic" && currentLessonIndex === firstReviewIndex;
        if (isFirstReview && !updated.isPremium) setIsUpgradeModalOpen(true);
        setCurrentLessonIndex(newIndex);
      } catch (err) {
        alert("Could not save your progress. Try again.");
      }
    }
    setIsLessonModalOpen(false);
    setSelectedLesson(null);
  };

  const handleUpgradeRequest = async () => {
    if (!studentData) return;
    try {
      const res = await fetch(
        `${API_BASE}/api/children/${studentData._id}/request-upgrade`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` },
        }
      );
      if (!res.ok) throw new Error();
      alert("Notification sent to your parent's email!");
      setIsUpgradeModalOpen(false);
    } catch {
      alert("Could not send notification. Try again.");
    }
  };

  return { handleLessonClick, handleCompleteLessonInModal, handleUpgradeRequest };
};

export default LessonHandlers;
