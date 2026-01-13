import React, { createContext, useContext, useCallback } from "react";
import useTextToSpeech from "./useTextSpeech"; // adjust path

interface SpeechContextType {
  speak: (options: { text: string }) => void;
  stop: () => void;
  isMuted: boolean;
}

const SpeechContext = createContext<SpeechContextType | undefined>(undefined);

interface SpeechProviderProps {
  isMuted: boolean;
  children: React.ReactNode;
}

export const SpeechProvider: React.FC<SpeechProviderProps> = ({ isMuted, children }) => {
  const { speak: speakBase, cancel: cancelBase } = useTextToSpeech();

  // Wrap speak so it respects the global mute
  const speak = useCallback(
    ({ text }: { text: string }) => {
      if (!isMuted) speakBase({ text });
    },
    [isMuted, speakBase]
  );

  const stop = useCallback(() => {
    cancelBase();
  }, [cancelBase]);

  return (
    <SpeechContext.Provider value={{ speak, stop, isMuted }}>
      {children}
    </SpeechContext.Provider>
  );
};

export const useSpeech = (): SpeechContextType => {
  const context = useContext(SpeechContext);
  if (!context) {
    throw new Error("useSpeech must be used within a SpeechProvider");
  }
  return context;
};
