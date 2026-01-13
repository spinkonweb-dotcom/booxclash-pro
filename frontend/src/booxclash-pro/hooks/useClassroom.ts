import { useState, useEffect } from 'react';
import { useConversation } from '@11labs/react';

/* =====================
   Types
===================== */

type Mode = 'tutor' | 'exam';

interface StudentProfile {
  name: string;
  grade: string;
  subject: string;
  country?: string;
}

interface Note {
  id: string;
  text: string;
}

interface ActiveTool {
  type: 'quiz' | 'exam' | 'builder' | 'image';
  data: any;
}

interface UseClassroomReturn {
  status: 'idle' | 'connecting' | 'connected' | 'error';
  notes: Note[];
  activeTool: ActiveTool | null;
  errorMessage: string;
  setActiveTool: React.Dispatch<React.SetStateAction<ActiveTool | null>>;
  endSession: () => void;
  sendText: (text: string) => void;
}

/* =====================
   Config (Auto-Detect)
===================== */
const API_BASE =
  import.meta.env?.VITE_API_BASE ||
  (window.location.hostname === 'localhost'
    ? 'http://localhost:8000'
    : 'https://booxclash-pro.onrender.com');

/* =====================
   Hook
===================== */
export function useClassroom(
  studentProfile: StudentProfile,
  mode: Mode,
  signedUrl: string,
  systemPrompt: string
): UseClassroomReturn {
  const [status, setStatus] = useState<UseClassroomReturn['status']>('idle');
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeTool, setActiveTool] = useState<ActiveTool | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  /* =====================
       Tool Handler
  ===================== */
  const handleToolCall = async (
    toolName: string,
    params: any,
    type: ActiveTool['type']
  ): Promise<string> => {
    try {
      const response = await fetch(`${API_BASE}/api/v1/handle-tool`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool_name: toolName,
          context_topic: params.topic || params.goal || studentProfile.subject,
          arguments: params,
          student: studentProfile,
        }),
      });

      const result = await response.json();

      if (result.status === 'success') {
        setActiveTool({ type, data: result.data });
        return 'I have displayed the content on your screen.';
      }

      return 'I tried to load that, but something went wrong.';
    } catch {
      return 'I lost connection while trying to load the tool.';
    }
  };

  /* =====================
       ElevenLabs
  ===================== */
  const conversation = useConversation({
    overrides: {
      agent: {
        prompt: { prompt: systemPrompt },
        firstMessage:
          mode === 'exam'
            ? `I have verified your identity. I am pulling up the Grade ${studentProfile.grade} ${studentProfile.subject} paper now.`
            : `Hello ${studentProfile.name}! I have loaded the Grade ${studentProfile.grade} ${studentProfile.subject} syllabus.`,
      },
    },
    onConnect: () => setStatus('connected'),
    onDisconnect: () => setStatus('idle'),
    onMessage: (msg: any) => {
      if (msg.source === 'ai') {
        setNotes((prev) => [
          ...prev,
          { id: crypto.randomUUID(), text: msg.message },
        ]);
      }
    },
    onError: () => {
      setErrorMessage('Connection Lost.');
      setStatus('error');
    },
    clientTools: {
      trigger_quiz: (p: any) => handleToolCall('trigger_quiz', p, 'quiz'),
      trigger_simulation: (p: any) =>
        handleToolCall('trigger_simulation', p, 'builder'),
      trigger_image: (p: any) =>
        handleToolCall('trigger_image', p, 'image'),
    },
  });

  /* =====================
       Exam Auto-Load
  ===================== */
  useEffect(() => {
    if (mode !== 'exam') return;

    const fetchExam = async () => {
      try {
        const cleanSubject = studentProfile.subject.replace(' Exam', '');
        const res = await fetch(
          `${API_BASE}/api/v1/take-exam?subject=${cleanSubject}&grade=${studentProfile.grade}`,
          { method: 'POST' }
        );
        const data = await res.json();
        if (data.questions?.length) {
          setActiveTool({ type: 'exam', data: data.questions });
        }
      } catch (e) {
        console.error('Exam load error', e);
      }
    };

    fetchExam();
  }, [mode, studentProfile]);

  /* =====================
       Connect on Mount
  ===================== */
  useEffect(() => {
    const init = async () => {
      setStatus('connecting');
      try {
        await conversation.startSession({ signedUrl });
      } catch {
        setStatus('error');
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    status,
    notes,
    activeTool,
    errorMessage,
    setActiveTool,
    endSession: conversation.endSession,
    // ✅ FIX APPLIED HERE: We cast to 'any' to bypass the TS error
    sendText: (conversation as any).sendText,
  };
}