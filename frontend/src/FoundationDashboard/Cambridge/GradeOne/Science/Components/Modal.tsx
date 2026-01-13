// src/pages/ProgressMap/Components/Modal.tsx
import React, { useEffect, useRef } from "react";
import { X, Volume2, VolumeX } from "lucide-react";
import * as THREE from "three";
import WAVES from "vanta/dist/vanta.waves.min"; // or your preferred Vanta effect
import Background from "./background";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  isMuted?: boolean;
  toggleMute?: () => void;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  isMuted = false,
  toggleMute,
}) => {
  const vantaRef = useRef<HTMLDivElement>(null);
  const vantaEffect = useRef<any>(null);

  // ✅ Initialize Vanta background
  useEffect(() => {
    if (isOpen && !vantaEffect.current && vantaRef.current) {
      vantaEffect.current = WAVES({
        el: vantaRef.current,
        THREE,
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        color: 0x1e90ff,
        shininess: 50,
        waveHeight: 20,
        waveSpeed: 1.2,
        zoom: 0.85,
      });
    }
    return () => {
      if (vantaEffect.current) {
        vantaEffect.current.destroy();
        vantaEffect.current = null;
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center">
      <Background>
      <div
        ref={vantaRef}
        className="absolute inset-0 w-full h-full"
      ></div>

      {/* ✅ Overlay to darken + allow interaction */}
      <div className="absolute inset-0"></div>

      {/* ✅ FULL SCREEN MODAL CONTENT */}
      <div className="relative w-full h-full flex flex-col text-white overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/20">
          <h3 className="text-2xl font-bold">{title}</h3>

          <div className="flex gap-4 items-center">
            {toggleMute && (
              <button
                onClick={toggleMute}
                className="hover:text-gray-300"
                aria-label={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? <VolumeX size={22} /> : <Volume2 size={22} />}
              </button>
            )}
            <button
              onClick={onClose}
              className="hover:text-gray-300"
              aria-label="Close"
            >
              <X size={26} />
            </button>
          </div>
        </div>

        {/* ✅ Fullscreen lesson area */}
        <div className="flex-1 overflow-auto p-4">{children}</div>
      </div>
      </Background>
    </div>
  );
};

export default Modal;
