import React, { useState } from 'react';
import SetupPanel from './SetupPanel';
import ActiveSession from './ActiveSession';

/* =====================
   Types
===================== */

type Mode = 'tutor' | 'exam';

interface Profile {
  name: string;
  grade: string;
  subject: string;
  country: string;
}

interface SessionConfig {
  profile: Profile;
  mode: Mode;
  sessionData: {
    url: string;
    prompt: string;
  };
  initialMode?: Mode;
}

interface BooxClashProProps {
  initialMode?: Mode;
}

/* =====================
   API BASE (DEV + PROD)
===================== */

const API_BASE =
  import.meta.env?.VITE_API_BASE ||
  (window.location.hostname === 'localhost'
    ? 'http://localhost:8000'
    : 'https://booxclash-pro.onrender.com');

/* =====================
   Component
===================== */

const BooxClashPro: React.FC<BooxClashProProps> = ({
  initialMode = 'tutor',
}) => {
  const [step, setStep] = useState<'setup' | 'classroom'>('setup');
  const [config, setConfig] = useState<SessionConfig | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  /* =====================
       Start Session
  ===================== */

  const handleStart = async (profile: Profile, mode: Mode) => {
    setLoading(true);

    try {
      console.log('🎤 Requesting microphone access...');
      await navigator.mediaDevices.getUserMedia({ audio: true });

      const subjectPayload =
        mode === 'exam' ? `${profile.subject} Exam` : profile.subject;

      console.log(
        '🚀 Starting session:',
        `${API_BASE}/api/v1/start-session`
      );

      const res = await fetch(`${API_BASE}/api/v1/start-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_name: profile.name,
          grade: profile.grade,
          subject: subjectPayload,
          mode,
          country: profile.country,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error('Backend Error:', data);
        throw new Error(data.detail || 'Failed to start session');
      }

      console.log('✅ Session Created:', data);

      setConfig({
        profile,
        mode,
        sessionData: {
          url: data.signed_url,
          prompt: data.system_prompt,
        },
      });

      setStep('classroom');
    } catch (error: any) {
      console.error('❌ Setup Error:', error);
      alert(
        `Connection Failed: ${error.message}\n\nCheck:\n• Backend running\n• Microphone permissions`
      );
    } finally {
      setLoading(false);
    }
  };

  /* =====================
       Classroom View
  ===================== */

  if (step === 'classroom' && config) {
    return (
      <ActiveSession
        systemPrompt={config.sessionData.prompt}
        signedUrl={config.sessionData.url}
        studentProfile={config.profile}
        mode={config.mode}
        onExit={() => {
          setStep('setup');
          setConfig(null);
        }}
      />
    );
  }

  /* =====================
       Setup View
  ===================== */

  return (
    <SetupPanel
      onStart={handleStart}
      loading={loading}
      initialMode={initialMode}
    />
  );
}; 

export default BooxClashPro;