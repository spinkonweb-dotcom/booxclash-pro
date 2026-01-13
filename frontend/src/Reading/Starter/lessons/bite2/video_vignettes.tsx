import React, { useState, useRef, useEffect } from 'react';
import { Play, ArrowRight, RefreshCw, Sun, Moon, Coffee, GraduationCap, AlertCircle } from 'lucide-react';

// --- Types ---

export interface Vignette {
  id: string;
  greeting: string;
  contextLabel: string;
  videoUrl: string;
  posterUrl?: string;
  icon?: 'sun' | 'moon' | 'coffee' | 'school';
}

export interface VideoVignettesProps {
  title?: string;
  instruction?: string;
  vignettes?: Vignette[];
  onComplete: (success: boolean) => void;
}

// --- Component ---

const VideoVignettes: React.FC<VideoVignettesProps> = ({
  title = "Learn: Greetings",
  vignettes,
  onComplete,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoEnded, setVideoEnded] = useState(false);
  const [videoError, setVideoError] = useState(false); // <--- New Error State
  
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // --- Safety Guard ---
  if (!vignettes || vignettes.length === 0) {
    return <div className="p-8 text-center text-slate-400">Loading vignettes...</div>;
  }

  const currentVignette = vignettes[currentIndex];
  const isLastSlide = currentIndex === vignettes.length - 1;

  // --- Logic ---

  useEffect(() => {
    setVideoEnded(false);
    setIsPlaying(false);
    setVideoError(false); // Reset error on slide change
    
    if (videoRef.current) {
      videoRef.current.load();
    }
  }, [currentIndex]);

  const togglePlay = () => {
    if (!videoRef.current || videoError) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.error("Video play failed:", error);
          // Don't set error state here, let the onError handler catch it
        });
      }
    }
    setIsPlaying(!isPlaying);
  };

  const handleVideoEnd = () => {
    setIsPlaying(false);
    setVideoEnded(true);
  };

  const handleError = () => {
    console.error("Video failed to load source:", currentVignette.videoUrl);
    setVideoError(true);
    setIsPlaying(false);
  };

  const handleNext = () => {
    if (isLastSlide) {
      onComplete(true);
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  // Helper to render icons
  const renderIcon = (type?: string) => {
    const className = "w-5 h-5 mr-2";
    switch (type) {
      case 'sun': return <Sun className={`${className} text-orange-500`} />;
      case 'moon': return <Moon className={`${className} text-indigo-500`} />;
      case 'coffee': return <Coffee className={`${className} text-amber-700`} />;
      case 'school': return <GraduationCap className={`${className} text-blue-600`} />;
      default: return null;
    }
  };

  return (
    <div className="max-w-md mx-auto bg-slate-900 text-white rounded-xl shadow-2xl overflow-hidden font-sans border border-slate-700">
      
      {/* Header & Progress */}
      <div className="p-4 bg-slate-800 border-b border-slate-700">
        <div className="flex justify-between items-center mb-2">
          <h2 className="font-bold text-lg">{title}</h2>
          <span className="text-xs text-slate-400">{currentIndex + 1} / {vignettes.length}</span>
        </div>
        
        {/* Progress Bar */}
        <div className="flex gap-1 h-1">
          {vignettes.map((_, idx) => (
            <div 
              key={idx}
              className={`flex-1 rounded-full transition-colors duration-300 ${idx <= currentIndex ? 'bg-blue-500' : 'bg-slate-600'}`} 
            />
          ))}
        </div>
      </div>

      {/* Video Content Area */}
      <div className="relative aspect-[4/3] bg-black group">
        
        {/* The Video Player */}
        <video
          ref={videoRef}
          src={currentVignette.videoUrl}
          poster={currentVignette.posterUrl}
          className={`w-full h-full object-cover transition-opacity ${videoError ? 'opacity-20' : 'opacity-100'}`}
          onEnded={handleVideoEnd}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onError={handleError} 
          playsInline
        />

        {/* --- ERROR UI --- */}
        {videoError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 p-4 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mb-2" />
            <p className="text-red-400 font-bold">Video not found</p>
            <p className="text-xs text-slate-400 mt-1 break-all">{currentVignette.videoUrl}</p>
          </div>
        )}

        {/* --- PLAY BUTTON OVERLAY --- */}
        {!isPlaying && !videoError && (
          <button
            onClick={togglePlay}
            className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/20 transition-colors group-hover:bg-black/30"
          >
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center ring-2 ring-white/50 hover:scale-110 transition-transform shadow-lg">
              {videoEnded ? (
                <RefreshCw className="w-8 h-8 text-white" />
              ) : (
                <Play className="w-8 h-8 text-white ml-1" />
              )}
            </div>
          </button>
        )}

        {/* Text Overlay (Bottom) */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/60 to-transparent pt-12">
          <div className="flex items-center text-xs font-bold uppercase tracking-widest text-blue-300 mb-1">
            {renderIcon(currentVignette.icon)}
            {currentVignette.contextLabel}
          </div>
          <h1 className="text-3xl font-black text-white drop-shadow-md">
            "{currentVignette.greeting}"
          </h1>
        </div>
      </div>

      {/* Footer Controls */}
      <div className="p-4 bg-slate-800 border-t border-slate-700 flex justify-between items-center">
        <div className="text-sm text-slate-400">
           {videoError ? "Skip to next" : (videoEnded ? "Watch again" : "Tap play to watch")}
        </div>

        <button
          onClick={handleNext}
          // Allow skipping if there is an error, otherwise require completion
          disabled={!videoEnded && !isLastSlide && !videoError} 
          className={`
            flex items-center px-6 py-3 rounded-lg font-bold transition-all
            ${(videoEnded || videoError)
              ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/50' 
              : 'bg-slate-700 text-slate-500 cursor-not-allowed'
            }
          `}
        >
          {isLastSlide ? "Finish" : "Next"} 
          <ArrowRight className="w-4 h-4 ml-2" />
        </button>
      </div>
    </div>
  );
};

export default VideoVignettes;