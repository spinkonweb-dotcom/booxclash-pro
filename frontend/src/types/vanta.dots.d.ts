declare module "vanta/dist/vanta.dots.min" {
    import * as THREE from "three";
  
    interface VantaDotsOptions {
      el: HTMLElement | null;
      THREE: typeof THREE;
      mouseControls?: boolean;
      touchControls?: boolean;
      gyroControls?: boolean;
      minHeight?: number;
      minWidth?: number;
      scale?: number;
      scaleMobile?: number;
      color?: number;
      backgroundColor?: number;
      size?: number; // Dot size
      spacing?: number; // Distance between dots
      showLines?: boolean; // Whether to show connecting lines
    }
  
    interface VantaEffect {
      setOptions: (options: Partial<VantaDotsOptions>) => void;
      destroy: () => void;
    }
  
    export default function DOTS(options: VantaDotsOptions): VantaEffect;
  }
  