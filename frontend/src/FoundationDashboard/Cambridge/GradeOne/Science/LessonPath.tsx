import React, { useEffect, RefObject } from "react";
import LessonNode from "./Components/LessonNode";
import LessonCard from "./Components/LessonCard";
import DottedPath from "./Components/DottedPath";
import VerticalDottedPath from "./VerticalDottedPath";
import { Lesson } from "./Data/lessonData";
import { NodePosition } from "./DashboardGradeOneLocal";

// ---------------- TYPES ----------------
interface ChildData {
  _id: string;
  childName: string;
  avatarUrl?: string;
  childGrade: string;
  points: number;
  streak: number;
  subject: string;
  lessonsCompleted: any[];
  isPremium: boolean;
  progressStatus: "active" | "needs_upgrade" | "premium";
}

interface Props {
  lessons: Lesson[];
  nodeRefs: RefObject<(HTMLButtonElement | HTMLDivElement | null)[]>;
  scrollContainerRef: RefObject<HTMLDivElement>;
  mascotDisplayPosition: NodePosition | null;
  setMascotDisplayPosition: (pos: NodePosition) => void;
  currentLessonIndex: number;
  studentData: ChildData;
  handleLessonClick: (lesson: Lesson, index: number) => void;
  isMobile: boolean;
}

// ---------------- GRADE THEME ICONS ----------------
const GRADE_THEME_ICONS: Record<string, string> = {
  "1": "/images/themes/zambian-emerald.png",
  "2": "/images/themes/victoria-falls-icon.png",
  "3": "/images/themes/freedom-statue-icon.png",
  "4": "/images/themes/zambian-emerald.png",
  "5": "/images/themes/zambian-emerald.png",
  "6": "/images/themes/zambian-emerald.png",
};

// ---------------- MAIN COMPONENT ----------------
const LessonPath: React.FC<Props> = ({
  lessons,
  nodeRefs,
  scrollContainerRef,
  mascotDisplayPosition,
  setMascotDisplayPosition,
  currentLessonIndex,
  studentData,
  handleLessonClick,
  isMobile,
}) => {
  const firstTopicIndex = lessons.findIndex((l) => l.type === "topic");
  const FREE_LIMIT = firstTopicIndex !== -1 ? firstTopicIndex + 1 : 5;

  // ---------------- HANDLE POSITIONING ----------------
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer || !studentData) return;

    const calculatePositions = () => {
      const positions: NodePosition[] = [];
      const containerRect = scrollContainer.getBoundingClientRect();

      nodeRefs.current?.forEach((node) => {
        if (node) {
          const nodeRect = node.getBoundingClientRect();
          positions.push({
            x: nodeRect.left - containerRect.left + node.offsetWidth / 2,
            y: nodeRect.top - containerRect.top + node.offsetHeight / 2,
          });
        }
      });

      if (!mascotDisplayPosition && positions[currentLessonIndex]) {
        const initPos = { ...positions[currentLessonIndex] };
        if (isMobile) initPos.x = scrollContainer.offsetWidth / 2;
        setMascotDisplayPosition(initPos);
      }
    };

    setTimeout(calculatePositions, 100);
    window.addEventListener("resize", calculatePositions);
    return () => window.removeEventListener("resize", calculatePositions);
  }, [
    studentData,
    isMobile,
    currentLessonIndex,
    mascotDisplayPosition,
    setMascotDisplayPosition,
    nodeRefs,
    scrollContainerRef,
  ]);

  // ---------------- RENDER ----------------
  return (
    <div
      ref={scrollContainerRef}
      className="w-full max-w-5xl overflow-y-auto md:overflow-x-auto scrollbar-custom"
    >
<div className="relative flex items-center flex-col md:flex-row w-full py-8 md:w-max md:py-20">
        {lessons.map((lesson, index) => {
          const isPaywall = index >= FREE_LIMIT && !studentData.isPremium;
          const isLocked = index > currentLessonIndex || isPaywall;
          const isPaywallTrigger = isPaywall && index === FREE_LIMIT;

          const themeIcon =
            GRADE_THEME_ICONS[studentData.childGrade] ||
            GRADE_THEME_ICONS["1"];

          const nodeStyle = {
            transform: isMobile
              ? `translateX(${index % 2 === 0 ? "-30px" : "30px"})`
              : `translateY(${index % 2 === 0 ? "0px" : "-40px"})`,
          };

          let nodeComponent;

          // --- PAYWALL NODE ---
          if (isPaywallTrigger) {
            nodeComponent = (
              <LessonNode
                ref={(el) => {
                  nodeRefs.current![index] = el;
                }}
                lesson={lesson}
                isCompleted={false}
                isCurrent={true}
                isLocked={isLocked}
                isPaywallTrigger={true}
                paywallIconUrl={themeIcon}
                onClick={() => handleLessonClick(lesson, index)}
                style={nodeStyle}
              />
            );
          } else {
            // --- NORMAL LESSON NODE ---
            nodeComponent = (
              <LessonCard
                ref={(el) => {
                  nodeRefs.current![index] = el;
                }}
                lesson={lesson}
                isCompleted={index < currentLessonIndex}
                isCurrent={index === currentLessonIndex && !isPaywall}
                isLocked={isLocked}
                onClick={() => handleLessonClick(lesson, index)}
                style={nodeStyle}
              />
            );
          }

          return (
            <React.Fragment key={lesson.id}>
              {nodeComponent}
              {index < lessons.length - 1 && (
                <>
                  <DottedPath className="hidden md:block" />
                  <VerticalDottedPath className="block md:hidden" />
                </>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default LessonPath;
