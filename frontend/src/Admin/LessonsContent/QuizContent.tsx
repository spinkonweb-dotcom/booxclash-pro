import React, { useState } from "react";

// This type is now an exact match of the one in the parent component.
export type QuizQuestionType = {
  id: string;
  type: "multiple-choice";
  question: string;
  options?: string[];
  answer: string;
  image?: string;
  explanation?: string;
  points?: number;
};

// The props interface matches how the component is called in the parent.
type QuizContentProps = {
  questions: QuizQuestionType[];
  setQuestions: (questions: QuizQuestionType[]) => void;
};

const defaultMCOptions = ["", "", "", ""];

// Creates a new, empty multiple-choice question with default values.
const createEmptyQuestion = (): QuizQuestionType => ({
  id: crypto.randomUUID(),
  type: "multiple-choice",
  question: "",
  options: [...defaultMCOptions],
  answer: "",
  image: "",
  explanation: "",
  points: 1, // Default points
});

const QuizContent: React.FC<QuizContentProps> = ({
  questions,
  setQuestions,
}) => {
  const [current, setCurrent] = useState<QuizQuestionType>(createEmptyQuestion());

  // Generic handler for all text and number inputs.
  const handleChange = <K extends keyof QuizQuestionType>(
    key: K,
    value: QuizQuestionType[K]
  ) => {
    setCurrent((prev) => ({ ...prev, [key]: value }));
  };

  // Specific handler for the multiple-choice option inputs.
  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...(current.options || [])];
    newOptions[index] = value;
    setCurrent({ ...current, options: newOptions });
  };

  const handleAdd = () => {
    const trimmedQ = current.question.trim();
    const trimmedA = current.answer.trim();

    if (!trimmedQ || !trimmedA) {
      alert("Please complete the question and answer fields.");
      return;
    }

    if (current.options?.some((opt) => !opt.trim())) {
      alert("All four options must be filled.");
      return;
    }
    
    // Add the fully-formed question object to the parent's state.
    setQuestions([...questions, { ...current, question: trimmedQ, answer: trimmedA }]);
    
    // Reset the form for the next question.
    setCurrent(createEmptyQuestion());
  };

  const handleDelete = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id));
  };

  return (
    <div className="space-y-4 bg-white p-4 rounded shadow-md border">
      <h3 className="text-lg font-semibold">📝 Quiz Section</h3>
      
      {/* --- FORM FOR ADDING A NEW QUESTION --- */}
      <div className="p-4 border rounded-lg bg-gray-50 space-y-3">
        <h4 className="font-medium text-md">Add New Quiz Question</h4>
        <div>
          <label className="block text-sm font-medium">Question</label>
          <input
            type="text"
            value={current.question}
            onChange={(e) => handleChange("question", e.target.value)}
            placeholder="Enter the quiz question"
            className="w-full mt-1 border rounded p-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Options</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1">
            {current.options?.map((opt, i) => (
              <input
                key={i}
                type="text"
                value={opt}
                onChange={(e) => handleOptionChange(i, e.target.value)}
                placeholder={`Option ${i + 1}`}
                className="border p-2 rounded"
              />
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">Correct Answer</label>
          <input
            type="text"
            value={current.answer}
            onChange={(e) => handleChange("answer", e.target.value)}
            placeholder="Must match one of the options exactly"
            className="w-full mt-1 border rounded p-2"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium">Points</label>
                <input
                  type="number"
                  value={current.points}
                  onChange={(e) => handleChange("points", Number(e.target.value))}
                  className="w-full mt-1 border rounded p-2"
                  min="1"
                />
            </div>
            <div>
                <label className="block text-sm font-medium">Image URL (Optional)</label>
                <input
                  type="text"
                  value={current.image}
                  onChange={(e) => handleChange("image", e.target.value)}
                  placeholder="https://example.com/image.png"
                  className="w-full mt-1 border rounded p-2"
                />
            </div>
        </div>

        <div>
            <label className="block text-sm font-medium">Explanation (Optional)</label>
            <textarea
              value={current.explanation}
              onChange={(e) => handleChange("explanation", e.target.value)}
              placeholder="Explain why the correct answer is right"
              className="w-full mt-1 border rounded p-2"
              rows={2}
            />
        </div>

        <button
          type="button"
          onClick={handleAdd}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 w-full"
        >
          ➕ Add Question to Quiz
        </button>
      </div>

      {/* --- DISPLAY ADDED QUESTIONS --- */}
      {questions.length > 0 && (
        <div className="mt-4 pt-4 border-t">
          <h4 className="font-medium mb-2">Added Quiz Questions:</h4>
          <ul className="space-y-2">
            {questions.map((q, i) => (
              <li key={q.id} className="flex justify-between items-start text-sm border p-3 rounded bg-gray-50">
                <div className="pr-4">
                    <p><strong>{i + 1}. {q.question}</strong> <em>({q.points} points)</em></p>
                    <p className="text-xs text-gray-600 mt-1">Options: {q.options?.join(", ")}</p>
                    <p className="text-xs text-green-700">Answer: {q.answer}</p>
                    {q.explanation && <p className="text-xs text-blue-700 mt-1">Explanation: {q.explanation}</p>}
                </div>
                <button
                  onClick={() => handleDelete(q.id)}
                  className="text-red-600 hover:underline text-xs flex-shrink-0 font-semibold"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default QuizContent;