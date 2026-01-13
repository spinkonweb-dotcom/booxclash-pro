// src/types/vanta.net.d.ts

declare module "vanta/dist/vanta.net.min" {
  import * as THREE from "three";

  interface VantaNetOptions {
    el: HTMLElement | null;                // DOM element to attach the effect
    THREE: typeof THREE;                   // THREE namespace
    mouseControls?: boolean;               // Enable mouse interaction
    touchControls?: boolean;               // Enable touch interaction
    gyroControls?: boolean;                // Enable gyroscope interaction
    minHeight?: number;                    // Minimum height of the canvas
    minWidth?: number;                     // Minimum width of the canvas
    scale?: number;                        // General scaling
    scaleMobile?: number;                  // Scaling for mobile
    spacing?: number;                      // Distance between points
    maxDistance?: number;                  // Maximum link distance between points
    color?: number;                        // Line color (hex)
    backgroundColor?: number;              // Background color (hex)
    materialOverride?: THREE.Material;     // Custom material override
  }

  interface VantaEffect {
    setOptions: (options: Partial<VantaNetOptions>) => void;
    destroy: () => void;
  }

  export default function NET(options: VantaNetOptions): VantaEffect;
}
