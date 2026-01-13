import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, RefreshCw, CheckCircle, AlertCircle, ArrowRight, Volume2 } from 'lucide-react';

// --- Types ---

export interface ListenRepeatProps {
  title?: string;
  instruction?: string;
  word: string;      // The text to display (e.g., "Hello")
  audioUrl: string;  // The native speaker audio
  onComplete: (success: boolean) => void;
}

// --- Component ---

const ListenAndRepeat: React.FC<ListenRepeatProps> = ({
  title = "Speak",
  instruction = "Listen, then record yourself saying the word.",
  word,
  audioUrl,
  onComplete,
}) => {
  // States
  const [isPlayingNative, setIsPlayingNative] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlayingUser, setIsPlayingUser] = useState(false);
  
  const [, setUserAudioBlob] = useState<Blob | null>(null);
  const [userAudioUrl, setUserAudioUrl] = useState<string | null>(null);
  
  // Feedback: 'idle' -> 'recording' -> 'analyzing' -> 'success' | 'retry'
  const [status, setStatus] = useState<'idle' | 'recording' | 'analyzing' | 'success' | 'retry'>('idle');

  // Refs
  const nativeAudioRef = useRef<HTMLAudioElement | null>(null);
  const userAudioRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // --- Audio Setup ---
  useEffect(() => {
    nativeAudioRef.current = new Audio(audioUrl);
    nativeAudioRef.current.onended = () => setIsPlayingNative(false);
    
    return () => {
      // Cleanup URLs to avoid memory leaks
      if (userAudioUrl) URL.revokeObjectURL(userAudioUrl);
    };
  }, [audioUrl, userAudioUrl]);

  // --- Handlers ---

  const playNative = () => {
    if (nativeAudioRef.current) {
      setIsPlayingNative(true);
      nativeAudioRef.current.currentTime = 0;
      nativeAudioRef.current.play().catch(e => console.error("Audio Play Error:", e));
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setUserAudioBlob(blob);
        setUserAudioUrl(url);
        
        // Stop all tracks to release mic
        stream.getTracks().forEach(track => track.stop());
        
        // Move to analysis
        analyzeRecording();
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setStatus('recording');
    } catch (err) {
      console.error("Mic access denied:", err);
      alert("Microphone access is needed to practice speaking.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Mock Analysis (Simulate an API call)
  const analyzeRecording = () => {
    setStatus('analyzing');
    
    setTimeout(() => {
      // Logic: For this demo, we assume success if they recorded something > 0.5s.
      // In a real app, you would send 'userAudioBlob' to an STT API here.
      const isGoodEnough = Math.random() > 0.3; // 70% chance of success for demo fun
      
      if (isGoodEnough) {
        setStatus('success');
      } else {
        setStatus('retry');
      }
    }, 1500);
  };

  const playUserAudio = () => {
    if (userAudioUrl) {
      if (userAudioRef.current) {
        userAudioRef.current.pause(); // Stop previous
      }
      userAudioRef.current = new Audio(userAudioUrl);
      userAudioRef.current.onended = () => setIsPlayingUser(false);
      
      setIsPlayingUser(true);
      userAudioRef.current.play();
    }
  };

  const handleNext = () => {
    onComplete(true);
  };

  const handleRetry = () => {
    setStatus('idle');
    setUserAudioBlob(null);
  };

  // --- Visual Components ---

  // Fake Waveform Bars
  const Waveform = ({ active, colorClass }: { active: boolean, colorClass: string }) => (
    <div className="flex items-center justify-center gap-1 h-12">
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className={`w-2 rounded-full transition-all duration-300 ${colorClass}`}
          style={{
            height: active ? `${Math.random() * 100}%` : '20%',
            animation: active ? `pulse 0.5s infinite ${i * 0.1}s` : 'none'
          }}
        />
      ))}
    </div>
  );

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden font-sans">
      
      {/* Header */}
      <div className="p-6 text-center border-b border-slate-100 bg-slate-50">
        <h2 className="text-xl font-bold text-slate-800">{title}</h2>
        <p className="text-slate-500 text-sm mt-1">{instruction}</p>
      </div>

      <div className="p-8 flex flex-col items-center space-y-8">
        
        {/* The Word */}
        <div className="text-center">
          <h1 className="text-5xl font-black text-slate-800 tracking-tight mb-2">
            {word}
          </h1>
          <button
            onClick={playNative}
            disabled={isPlayingNative}
            className="flex items-center justify-center mx-auto text-blue-600 hover:text-blue-700 font-bold text-sm bg-blue-50 px-3 py-1 rounded-full transition-colors"
          >
            <Volume2 className={`w-4 h-4 mr-2 ${isPlayingNative ? 'animate-pulse' : ''}`} />
            Native Speaker
          </button>
        </div>

        {/* Comparison Area */}
        <div className="w-full grid grid-cols-2 gap-4">
          {/* Native Wave */}
          <div className="flex flex-col items-center p-3 rounded-lg bg-slate-50 border border-slate-100">
             <span className="text-xs font-bold text-slate-400 mb-2 uppercase">Target</span>
             <Waveform active={isPlayingNative} colorClass="bg-blue-400" />
          </div>

          {/* User Wave */}
          <div className="flex flex-col items-center p-3 rounded-lg bg-slate-50 border border-slate-100">
             <span className="text-xs font-bold text-slate-400 mb-2 uppercase">You</span>
             <Waveform active={isRecording || isPlayingUser} colorClass={status === 'success' ? "bg-green-400" : "bg-orange-400"} />
          </div>
        </div>

        {/* Interaction Area */}
        <div className="h-24 flex items-center justify-center">
          
          {/* State: Idle / Retry */}
          {(status === 'idle' || status === 'retry') && (
            <button
              onClick={startRecording}
              className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 shadow-xl flex items-center justify-center text-white transition-all hover:scale-105 active:scale-95"
            >
              <Mic className="w-8 h-8" />
            </button>
          )}

          {/* State: Recording */}
          {status === 'recording' && (
            <button
              onClick={stopRecording}
              className="w-20 h-20 rounded-full bg-slate-800 ring-4 ring-red-100 shadow-xl flex items-center justify-center text-red-500 transition-all animate-pulse"
            >
              <Square className="w-8 h-8 fill-current" />
            </button>
          )}

          {/* State: Analyzing */}
          {status === 'analyzing' && (
            <div className="flex flex-col items-center text-slate-400">
              <RefreshCw className="w-10 h-10 animate-spin mb-2 text-blue-500" />
              <span className="text-xs font-bold">Analyzing...</span>
            </div>
          )}

          {/* State: Success */}
          {status === 'success' && (
            <div className="flex flex-col items-center gap-2">
               <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                 <CheckCircle className="w-10 h-10 text-green-600" />
               </div>
            </div>
          )}
        </div>

        {/* Feedback Message */}
        <div className="h-10 text-center">
           {status === 'retry' && (
             <p className="text-red-500 font-medium text-sm flex items-center justify-center gap-1">
               <AlertCircle className="w-4 h-4" /> Try to speak louder and clearer.
             </p>
           )}
           {status === 'success' && (
             <div className="flex gap-4">
                <button 
                  onClick={playUserAudio}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 underline"
                >
                  Hear yourself
                </button>
             </div>
           )}
        </div>

      </div>

      {/* Footer */}
      {status === 'success' && (
        <div className="p-4 bg-green-50 border-t border-green-100 flex justify-between items-center animate-in slide-in-from-bottom-2">
          <span className="text-green-800 font-bold ml-2">Great pronunciation!</span>
          <button
            onClick={handleNext}
            className="bg-slate-900 text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-slate-800 flex items-center transition-colors"
          >
            Continue <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        </div>
      )}
      
      {status === 'retry' && (
        <div className="p-4 bg-red-50 border-t border-red-100 flex justify-center animate-in slide-in-from-bottom-2">
           <button onClick={handleRetry} className="text-red-700 font-bold text-sm hover:underline">
             Tap mic to try again
           </button>
        </div>
      )}

    </div>
  );
};

export default ListenAndRepeat;