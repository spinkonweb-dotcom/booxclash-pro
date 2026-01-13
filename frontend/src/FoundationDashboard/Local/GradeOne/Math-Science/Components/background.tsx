import React, { useEffect, useRef } from "react";
import * as THREE from "three";

const Background: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const vantaRef = useRef<HTMLDivElement>(null);
  const vantaEffect = useRef<any>(null);

  useEffect(() => {
    let effect: any;
    let isDestroyed = false;

    const initVanta = async () => {
      // Make THREE available globally for Vanta
      if (typeof window !== "undefined") {
        // @ts-ignore
        window.THREE = THREE;
      }

      const DOTS = (await import("vanta/dist/vanta.dots.min")).default;

      if (!vantaEffect.current && vantaRef.current) {
        try {
          effect = DOTS({
            el: vantaRef.current,
            THREE,
            mouseControls: true,
            touchControls: true,
            gyroControls: false,
            minHeight: 200.0,
            minWidth: 200.0,
            scale: 1.0,
            scaleMobile: 1.0,
            backgroundColor: 0x0a0a0a,
            color: 0xff6600,
          });
          vantaEffect.current = effect;
        } catch (err) {
          console.error("[VANTA] Init error:", err);
        }
      }
    };

    initVanta();

    return () => {
      if (!isDestroyed && vantaEffect.current) {
        try {
          vantaEffect.current.destroy();
        } catch (err) {
          console.warn("Vanta cleanup issue ignored:", err);
        }
        vantaEffect.current = null;
      }
      isDestroyed = true;
    };
  }, []);

  return (
    <div
      ref={vantaRef}
      className="w-full h-full flex items-center justify-center relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500 via-purple-600 to-blue-600 opacity-40"></div>
      <div className="relative z-10 w-full h-full flex items-center justify-center">
        {children}
      </div>
    </div>
  );
};

export default Background;
