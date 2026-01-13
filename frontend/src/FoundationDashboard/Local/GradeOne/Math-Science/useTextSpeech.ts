import { useState, useCallback } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";
interface SpeakOptions {
  text: string;
  tone?: 'correct' | 'wrong';
}

// We define the hook without 'export const' here
const useTextToSpeech = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const speak = useCallback(async (options: SpeakOptions) => {
    if (isSpeaking) return;

    try {
      setIsSpeaking(true);

      const response = await fetch(`${API_BASE}/api/tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: options.text }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch audio from the backend.');
      }

      // --- Custom logic for Gemini TTS API ---
      // If you switch to the Gemini TTS API, this fetch logic will need to be updated 
      // to handle the base64 PCM data conversion to WAV blob.
      
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      // Play the audio
      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl); // Clean up the URL
      };
      audio.onerror = (e) => {
        console.error('Audio playback error:', e);
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
      };

      await audio.play();

    } catch (error) {
      console.error('TTS API call failed:', error);
      setIsSpeaking(false);
    }
  }, [isSpeaking]);

  const cancel = useCallback(() => {
    // For this simple implementation, cancellation is not supported
    console.warn('Cancel function is not fully implemented for this audio playback method.');
    setIsSpeaking(false);
  }, []);

  return { speak, cancel, isSpeaking, supported: true };
};

// We use 'export default' at the end to satisfy the import requirements
export default useTextToSpeech;