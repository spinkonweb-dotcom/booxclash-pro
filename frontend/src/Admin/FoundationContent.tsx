import React, { useState, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";

import StartContent from "./LessonsContent/StartContent";
import KnowContent from "./LessonsContent/KnowContent";
import WatchContent from "./LessonsContent/WatchContent";
import DoContent from "./LessonsContent/DoContent";
import ReflectContent from "./LessonsContent/ReflectContent";
import QuizContent from "./LessonsContent/QuizContent";

type QuestionType = "multiple-choice" | "image" | "video" | "visual";

export type StartContentType = {
    type: QuestionType;
    prompt?: string;
    options?: string[];
    correctAnswer?: string;
    image?: string;
    videoLink?: string;
    points?: number;
};

export interface KnowVisualOption {
    text: string;
    image: string;
}

export type KnowQuestionType = {
    id: string;
    type: "short-answer" | "multiple-choice" | "visual";
    prompt: string;
    explanation: string;
    options?: string[];
    visualOptions?: KnowVisualOption[];
    correctAnswer?: string;
    suggestedAnswers?: string[];
    image?: string;
    points?: number;
};

export type WatchContentType = {
    videoLink: string;
    explanation: string;
    points?: number;
};

export type DoComponentType = {
    componentLink: string;
    points?: number;
};

export type ReflectContentType = {
    prompts: string[];
    points?: number;
};

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

type FoundationLesson = {
    _id?: string; // MongoDB ID from backend (present on fetched lessons)
    id: string; // frontend-generated UUID (present on new lessons)
    lessonId?: string; // The ID required by the backend for new lessons
    subject: string;
    topic: string;
    level: number;
    curriculum: "Local" | "Cambridge";
    thematicArea?: string; // NEW: Thematic area field
    start: StartContentType;
    knowQuestions: KnowQuestionType[];
    watchContent: WatchContentType;
    doComponent: DoComponentType;
    reflectPrompt: ReflectContentType;
    quiz: QuizQuestionType[];
};

const createDefaultLesson = (): FoundationLesson => ({
    id: uuidv4(),
    subject: "",
    topic: "",
    level: 1,
    curriculum: "Local",
    thematicArea: "", // Initialize the new field
    start: {
        type: "visual",
        prompt: "",
        correctAnswer: "",
        points: 5
    },
    knowQuestions: [],
    watchContent: {
        videoLink: "",
        explanation: "",
        points: 15
    },
    doComponent: {
        componentLink: "",
        points: 20
    },
    reflectPrompt: {
        prompts: [],
        points: 10
    },
    quiz: []
});

const thematicAreas = [
    { name: "Kaunda the Explorer", level: 1 },
    { name: "Chiluba the Doctor", level: 2 },
    { name: "Mwanawasa the Time Traveller", level: 3 },
    { name: "Sata the Engineer", level: 4 },
    { name: "Rupiah the Mixer", level: 5 },
];

const ContentManagement: React.FC = () => {
    const [content, setContent] = useState<FoundationLesson>(createDefaultLesson());
    const [lessons, setLessons] = useState<FoundationLesson[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);

    // State for managing status messages
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState<boolean>(true);

    const localSubjects = ["Math", "Science"];
    const cambridgeSubjects = ["Math", "Science"];
    const localLevels = [1, 2, 3, 4];
    const cambridgeStages = [1, 2, 3, 4];

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";

    const fetchLessons = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE}/api/foundation-lessons`);
            if (!res.ok) throw new Error("Failed to fetch lessons");
            const data = await res.json();
            setLessons(data);
        } catch (err) {
            console.error("Error fetching lessons:", err);
        }
    }, [API_BASE]);

    useEffect(() => {
        fetchLessons();
    }, [fetchLessons]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setContent((prev) => ({
            ...prev,
            [name]: name === "level" ? +value : value,
        }));
    };

    const handleCurriculumChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newCurriculum = e.target.value as "Local" | "Cambridge";
        setContent(prev => ({
            ...prev,
            curriculum: newCurriculum,
            subject: "",
            level: newCurriculum === "Local" ? 1 : 1
        }));
    };
const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = sessionStorage.getItem("token");
    
    const isEditing = !!editingId;
    const url = isEditing
        ? `${API_BASE}/api/foundation-lessons/${editingId}`
        : `${API_BASE}/api/foundation-lessons`;
    const method = isEditing ? "PUT" : "POST";

    // CORRECTED: Define the payload based on whether we are creating or updating
    let payload = { ...content }; // Start with a copy of the content state

    if (!isEditing) {
        // For a new lesson (POST), the backend expects `lessonId`
        // We'll map the frontend `id` to the backend's `lessonId`
        payload = {
            ...content,
            lessonId: content.id,
        };
    } else {
        // For an update (PUT), the backend uses the ID in the URL,
        // so we don't need to pass a `lessonId` or `_id` in the body.
        // We can safely delete the frontend `id` and backend `_id` from the payload
        // to keep it clean.
        delete (payload as any).id;
        delete (payload as any)._id;
    }
    try {
        const response = await fetch(url, {
            method,
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.message || "Failed to save lesson");
        }

        await fetchLessons();
        setContent(createDefaultLesson());
        setEditingId(null);
        setStatusMessage(isEditing ? "Lesson updated successfully!" : "Lesson saved successfully!");
        setIsSuccess(true);
        setTimeout(() => setStatusMessage(null), 5000);
    } catch (err: any) {
        console.error("Save failed:", err);
        setStatusMessage(`Save failed: ${err.message}`);
        setIsSuccess(false);
        setTimeout(() => setStatusMessage(null), 5000);
    }
};

    const handleEdit = (lesson: FoundationLesson) => {
        setContent(lesson);
        setEditingId(lesson._id || null);
    };

const handleDelete = async (lessonId: string) => {
    if (!confirm("Are you sure you want to delete this lesson?")) return;
    try {
        const token = sessionStorage.getItem("token"); // ADDED: Get the token

        const response = await fetch(`${API_BASE}/api/foundation-lessons/${lessonId}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}`, // ADDED: Include the authorization header
            },
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.message || "Failed to delete lesson");
        }
        
        await fetchLessons();
    } catch (err: any) {
        console.error("Failed to delete lesson:", err);
        // ADDED: Handle and display error message
        setStatusMessage(`Deletion failed: ${err.message}`);
        setIsSuccess(false);
        setTimeout(() => setStatusMessage(null), 5000); // Clear message after 5 seconds
    }
};

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-md">
            <h2 className="text-2xl font-bold mb-4">
                {editingId ? "Edit Foundation Lesson" : "Create Foundation Lesson"}
            </h2>

            {/* ADDED: Conditional rendering for status message */}
            {statusMessage && (
                <div className={`p-4 rounded-lg mb-4 text-center ${isSuccess ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {statusMessage}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium">Curriculum</label>
                        <select
                            name="curriculum"
                            value={content.curriculum}
                            onChange={handleCurriculumChange}
                            className="w-full mt-1 border rounded p-2"
                        >
                            <option value="Local">Local Curriculum</option>
                            <option value="Cambridge">Cambridge Curriculum</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Subject</label>
                        <select
                            name="subject"
                            value={content.subject}
                            onChange={handleChange}
                            className="w-full mt-1 border rounded p-2"
                        >
                            <option value="">Select subject</option>
                            {(content.curriculum === "Local" ? localSubjects : cambridgeSubjects).map((subj) => (
                                <option key={subj} value={subj}>{subj}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Topic</label>
                        <input
                            type="text"
                            name="topic"
                            value={content.topic}
                            onChange={handleChange}
                            className="w-full mt-1 border rounded p-2"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Level</label>
                        <select
                            name="level"
                            value={content.level}
                            onChange={handleChange}
                            className="w-full mt-1 border rounded p-2"
                        >
                            <option value={0}>Select Level</option>
                            {(content.curriculum === "Local" ? localLevels : cambridgeStages).map((lvl) => (
                                <option key={lvl} value={lvl}>Level {lvl}</option>
                            ))}
                        </select>
                    </div>
                    {/* NEW: Thematic Area Dropdown */}
                    <div>
                        <label className="block text-sm font-medium">Thematic Area</label>
                        <select
                            name="thematicArea"
                            value={content.thematicArea}
                            onChange={handleChange}
                            className="w-full mt-1 border rounded p-2"
                        >
                            <option value="">Select a thematic area</option>
                            {thematicAreas.map((theme) => (
                                <option key={theme.name} value={theme.name}>
                                    {theme.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <StartContent
                    initialData={content.start}
                    onChange={(data) => setContent(prev => ({ ...prev, start: data }))}
                />
                <KnowContent
                    questions={content.knowQuestions}
                    setQuestions={(data) => setContent(prev => ({ ...prev, knowQuestions: data }))}
                />
                <WatchContent
                    initialData={content.watchContent}
                    onChange={(data) => setContent(prev => ({ ...prev, watchContent: data }))}
                />
                <DoContent
                    initialData={content.doComponent}
                    onChange={(data) => setContent(prev => ({ ...prev, doComponent: data }))}
                />
                <ReflectContent
                    initialData={content.reflectPrompt}
                    onChange={(data) => setContent(prev => ({ ...prev, reflectPrompt: data }))}
                />
                <QuizContent
                    questions={content.quiz}
                    setQuestions={(data) => setContent(prev => ({ ...prev, quiz: data }))}
                />

                <button
                    type="submit"
                    className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg font-bold hover:bg-blue-700 transition"
                >
                    {editingId ? "Update Lesson" : "Save New Lesson"}
                </button>
            </form>

            <div className="mt-10">
                <h3 className="text-xl font-semibold mb-2">Saved Lessons</h3>
                {lessons.length > 0 ? (
                    <ul className="space-y-3">
                        {lessons.map((lesson) => (
                            <li key={lesson._id || lesson.id} className="border rounded p-3 bg-gray-50 flex justify-between items-center">
                                <div>
                                    <strong>{lesson.topic}</strong>
                                    <span className="text-sm text-gray-600">
                                        {" "}({lesson.subject} - {lesson.curriculum} Level {lesson.level} - {lesson.thematicArea})
                                    </span>
                                </div>
                                <div className="space-x-2">
                                    <button
                                        onClick={() => handleEdit(lesson)}
                                        className="px-3 py-1 bg-yellow-500 text-white rounded text-sm"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(lesson._id!)}
                                        className="px-3 py-1 bg-red-600 text-white rounded text-sm"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : <p className="text-gray-500">No lessons available.</p>}
            </div>
        </div>
    );
};

export default ContentManagement;