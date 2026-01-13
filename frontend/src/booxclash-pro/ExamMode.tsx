import { useState, useEffect } from "react";
import { Clock, MessageSquare } from "lucide-react";

/* -------------------- TYPES -------------------- */

type Question = {
  id: string | number;
  text: string;
  A: string;
  B: string;
  C: string;
  D: string;
  answer: "A" | "B" | "C" | "D";
  image_url?: string;
};

type ExamModeProps = {
  subject: string;
  grade: string | number;
  questions: Question[];
  onClose: () => void;
};

type AnswersMap = {
  [key: string]: "A" | "B" | "C" | "D";
};

/* -------------------- COMPONENT -------------------- */

export default function ExamMode({
  subject,
  grade,
  questions,
  onClose,
}: ExamModeProps) {
  const [timeLeft, setTimeLeft] = useState<number>(90 * 60); // 90 minutes
  const [answers, setAnswers] = useState<AnswersMap>({});
  const [currentBatch, setCurrentBatch] = useState<number>(0);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);

  // Timer Logic
  useEffect(() => {
    if (submitted) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [submitted]);

  // Format time MM:SS
  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const handleSelect = (qId: string | number, option: "A" | "B" | "C" | "D") => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [qId]: option }));
  };

  const handleSubmit = () => {
    let correct = 0;
    questions.forEach((q) => {
      if (answers[q.id] === q.answer) correct++;
    });
    setScore(correct);
    setSubmitted(true);
  };

  // Pagination
  const QUESTIONS_PER_PAGE = 10;
  const startIndex = currentBatch * QUESTIONS_PER_PAGE;
  const visibleQuestions = questions.slice(
    startIndex,
    startIndex + QUESTIONS_PER_PAGE
  );
  const isLastPage =
    startIndex + QUESTIONS_PER_PAGE >= questions.length;

  return (
    <div className="fixed inset-0 bg-gray-50 z-50 flex flex-col font-sans">
      {/* HEADER */}
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-gray-800">
            Mock Examination
          </h1>
          <p className="text-sm text-gray-500">
            {subject} • Grade {grade} • {questions.length} Questions
          </p>
        </div>

        <div
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-lg font-bold ${
            timeLeft < 300
              ? "bg-red-100 text-red-600"
              : "bg-blue-50 text-blue-600"
          }`}
        >
          <Clock className="w-5 h-5" />
          {formatTime(timeLeft)}
        </div>
      </header>

      {/* MAIN */}
      <main className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full">
        {visibleQuestions.map((q, index) => (
          <div
            key={q.id}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6"
          >
            <div className="flex gap-4">
              <span className="text-gray-400 font-bold text-lg select-none">
                {startIndex + index + 1}.
              </span>

              <div className="flex-1">
                <p className="text-lg text-gray-800 mb-4 font-medium">
                  {q.text}
                </p>

                {q.image_url && (
                  <div className="mb-4 bg-gray-100 rounded-lg p-2 inline-block">
                    <img
                      src={q.image_url}
                      alt="Question Diagram"
                      className="max-h-64 object-contain"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(["A", "B", "C", "D"] as const).map((opt) => (
                    <button
                      key={opt}
                      onClick={() => handleSelect(q.id, opt)}
                      disabled={submitted}
                      className={`text-left px-4 py-3 rounded-lg border transition-all 
                        ${
                          answers[q.id] === opt
                            ? "bg-blue-600 text-white border-blue-600 ring-2 ring-blue-200"
                            : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                        }
                        ${
                          submitted && q.answer === opt
                            ? "bg-green-100 border-green-500 text-green-800"
                            : ""
                        }
                        ${
                          submitted &&
                          answers[q.id] === opt &&
                          answers[q.id] !== q.answer
                            ? "bg-red-100 border-red-500 text-red-800"
                            : ""
                        }
                      `}
                    >
                      <span className="font-bold mr-2">{opt}.</span>{" "}
                      {q[opt]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* NAVIGATION */}
        <div className="flex justify-between items-center mt-8 mb-12">
          <button
            disabled={currentBatch === 0}
            onClick={() => setCurrentBatch((b) => b - 1)}
            className="px-6 py-2 rounded-lg text-gray-600 hover:bg-gray-200 disabled:opacity-30"
          >
            Previous
          </button>

          {!isLastPage ? (
            <button
              onClick={() => setCurrentBatch((b) => b + 1)}
              className="bg-gray-800 text-white px-8 py-3 rounded-lg hover:bg-black transition"
            >
              Next Page
            </button>
          ) : !submitted ? (
            <button
              onClick={handleSubmit}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 font-bold shadow-lg shadow-blue-200 transition"
            >
              Submit Examination
            </button>
          ) : (
            <div className="text-right">
              <p className="text-xl font-bold text-gray-800">
                Score: {score} / {questions.length}
              </p>
              <button
                onClick={onClose}
                className="text-blue-600 underline text-sm"
              >
                Return to Dashboard
              </button>
            </div>
          )}
        </div>
      </main>

      {/* INVIGILATOR */}
      <div className="fixed bottom-6 right-6">
        {isChatOpen && (
          <div className="mb-4 bg-white w-72 h-64 rounded-xl shadow-xl border flex flex-col overflow-hidden">
            <div className="bg-gray-800 text-white p-3 text-sm font-medium flex justify-between">
              <span>Invigilator Desk</span>
              <button onClick={() => setIsChatOpen(false)}>×</button>
            </div>
            <div className="flex-1 p-4 bg-gray-50 text-sm text-gray-600 overflow-y-auto">
              <p className="bg-white p-2 rounded-lg shadow-sm inline-block">
                Raise your hand if you have a technical issue. I cannot help
                with answers.
              </p>
            </div>
            <div className="p-2 border-t bg-white">
              <input
                placeholder="Type message..."
                className="w-full text-xs p-2 border rounded"
              />
            </div>
          </div>
        )}

        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="bg-black text-white p-4 rounded-full shadow-lg hover:scale-105 transition flex items-center gap-2"
        >
          <MessageSquare className="w-5 h-5" />
          {isChatOpen ? "Close" : "Invigilator"}
        </button>
      </div>
    </div>
  );
}
