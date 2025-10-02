import { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX, Play, Maximize, Minimize } from 'lucide-react';

interface VideoPlayerProps {
  src: string;
  className?: string;
  autoPlay?: boolean;
  onDoubleTap?: () => void;
  isLiked?: boolean;
}

export const VideoPlayer = ({ src, className = '', autoPlay = false, onDoubleTap, isLiked }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(true); // Start muted for autoplay
  const [progress, setProgress] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [showPlayIcon, setShowPlayIcon] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const hideControlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const loadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTapRef = useRef(0);
  const singleTapTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      const progress = (video.currentTime / video.duration) * 100;
      setProgress(progress);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleLoadedData = () => {
      setIsLoading(false);
      setLoadProgress(100);
    };
    const handleWaiting = () => setIsLoading(true);
    const handleCanPlay = () => {
      setIsLoading(false);
      setLoadProgress(100);
    };
    const handleProgress = () => {
      // Calculate buffered percentage
      if (video.buffered.length > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);
        const duration = video.duration;
        if (duration > 0) {
          const percent = (bufferedEnd / duration) * 100;
          setLoadProgress(Math.min(percent, 100));
        }
      }
    };
    const handleError = (e: Event) => {
      console.error('Video error:', e);
      // Don't show error immediately, might be temporary or network issue
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
      // Wait longer for large videos - 10 seconds
      loadTimeoutRef.current = setTimeout(() => {
        // Auto-retry once for network issues
        if (retryCount === 0) {
          console.log('Auto-retrying video load...');
          setRetryCount(1);
          video.load();
          // If still fails after another 10s, show error
          loadTimeoutRef.current = setTimeout(() => {
            setHasError(true);
            setIsLoading(false);
          }, 10000);
        } else {
          setHasError(true);
          setIsLoading(false);
        }
      }, 10000);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('progress', handleProgress);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('progress', handleProgress);
      video.removeEventListener('error', handleError);
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
    };
  }, []);

  // Auto-pause video when scrolled out of view
  useEffect(() => {
    const container = containerRef.current;
    const video = videoRef.current;
    if (!container || !video) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // If video is less than 50% visible and playing, pause it
          if (!entry.isIntersecting || entry.intersectionRatio < 0.5) {
            if (!video.paused) {
              video.pause();
            }
          }
        });
      },
      {
        threshold: 0.5, // Trigger when 50% of video is visible
      }
    );

    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, []);

  // Retry loading video if error
  const retryVideo = () => {
    const video = videoRef.current;
    if (!video) return;
    
    setHasError(false);
    setIsLoading(true);
    setRetryCount(prev => prev + 1);
    
    // Force reload
    video.load();
  };

  useEffect(() => {
    // Auto-hide controls after 3 seconds
    if (showControls && isPlaying) {
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current);
      }
      hideControlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }

    return () => {
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current);
      }
    };
  }, [showControls, isPlaying]);

  const togglePlayPause = async (e?: React.MouseEvent) => {
    const video = videoRef.current;
    if (!video || hasError) return;

    // Handle double tap for like
    if (e && onDoubleTap) {
      const now = Date.now();
      const DOUBLE_TAP_DELAY = 300;

      if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
        // Double tap detected
        e.preventDefault();
        e.stopPropagation();
        
        // Clear single tap timer
        if (singleTapTimerRef.current) {
          clearTimeout(singleTapTimerRef.current);
          singleTapTimerRef.current = null;
        }
        
        // Handle double tap (like)
        onDoubleTap();
        if (!isLiked) {
          setShowHeartAnimation(true);
          setTimeout(() => setShowHeartAnimation(false), 1000);
        }
        lastTapRef.current = now;
        return; // Don't toggle play/pause on double tap
      }
      
      // Single tap - wait to see if it's a double tap
      lastTapRef.current = now;
      singleTapTimerRef.current = setTimeout(() => {
        singleTapTimerRef.current = null;
        // Now execute the play/pause
        performPlayPause();
      }, DOUBLE_TAP_DELAY);
      return;
    }

    // If no double-tap handler, just play/pause immediately
    await performPlayPause();
  };

  const performPlayPause = async () => {
    const video = videoRef.current;
    if (!video || hasError) return;

    try {
      if (isPlaying) {
        video.pause();
        setShowPlayIcon(true);
        setTimeout(() => setShowPlayIcon(false), 500);
      } else {
        // Check if video is ready to play
        if (video.readyState < 2) {
          // Video not ready yet, show loading
          setIsLoading(true);
          // Wait for video to be ready
          await new Promise((resolve) => {
            const onCanPlay = () => {
              video.removeEventListener('canplay', onCanPlay);
              resolve(true);
            };
            video.addEventListener('canplay', onCanPlay);
            // Timeout after 5 seconds
            setTimeout(() => {
              video.removeEventListener('canplay', onCanPlay);
              resolve(false);
            }, 5000);
          });
        }
        
        setIsLoading(true);
        const playPromise = video.play();
        
        if (playPromise !== undefined) {
          await playPromise;
          setShowPlayIcon(true);
          setTimeout(() => setShowPlayIcon(false), 500);
          setIsLoading(false);
        }
      }
      setShowControls(true);
    } catch (error: any) {
      // Ignore AbortError which happens when play is interrupted
      if (error.name !== 'AbortError') {
        console.error('Error playing video:', error);
      }
      setIsLoading(false);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    setIsMuted(!isMuted);
    setShowControls(true);
  };

  const toggleFullscreen = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const container = containerRef.current;
    if (!container) return;

    try {
      if (!document.fullscreenElement) {
        await container.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error('Error toggling fullscreen:', error);
    }
    setShowControls(true);
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const handleMouseMove = () => {
    setShowControls(true);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    video.currentTime = pos * video.duration;
    setShowControls(true);
  };

  return (
    <div 
      ref={containerRef}
      className={`relative bg-black ${className}`}
      style={{ minHeight: '100%' }}
      onMouseMove={handleMouseMove}
      onClick={togglePlayPause}
    >
      {/* Double Tap Heart Animation */}
      {showHeartAnimation && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <svg
            className="w-24 h-24 text-white drop-shadow-2xl"
            fill="currentColor"
            viewBox="0 0 24 24"
            style={{
              animation: 'ping 1s cubic-bezier(0, 0, 0.2, 1) 1',
            }}
          >
            <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
          </svg>
        </div>
      )}
      {/* Video Element */}
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-contain"
        style={{ minHeight: '100%' }}
        playsInline
        loop
        muted={isMuted}
        autoPlay={autoPlay}
        preload="auto"
        crossOrigin="anonymous"
      />

      {/* Play/Pause Animation Icon */}
      {showPlayIcon && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-20 h-20 bg-black/60 rounded-full flex items-center justify-center animate-ping">
            {isPlaying ? (
              <Play className="w-10 h-10 text-white fill-white" />
            ) : (
              <div className="flex gap-1">
                <div className="w-2 h-10 bg-white rounded-sm" />
                <div className="w-2 h-10 bg-white rounded-sm" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Loading Spinner and Progress */}
      {isLoading && (
        <>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/20">
            <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
          {/* Loading Progress Percentage */}
          <div className="absolute top-4 left-4 pointer-events-none">
            <div className="bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-lg">
              <span className="text-white text-sm font-medium">%{Math.round(loadProgress)}</span>
            </div>
          </div>
        </>
      )}

      {/* Error State */}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60">
          <svg className="w-16 h-16 text-white mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-white text-sm mb-2">Video yüklenemedi</p>
          <p className="text-white/70 text-xs mb-4">Ağ bağlantınızı kontrol edin</p>
          <button
            onClick={(e) => {
              e.stopPropagation();
              retryVideo();
            }}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg text-sm font-medium transition pointer-events-auto backdrop-blur-sm"
          >
            🔄 Tekrar Dene {retryCount > 0 && `(${retryCount})`}
          </button>
        </div>
      )}

      {/* Play Button Overlay (when paused) */}
      {!isPlaying && !isLoading && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-16 h-16 bg-black/60 rounded-full flex items-center justify-center">
            <Play className="w-8 h-8 text-white fill-white ml-1" />
          </div>
        </div>
      )}

      {/* Controls Overlay */}
      <div
        className={`absolute inset-0 pointer-events-none transition-opacity duration-300 z-20 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Top Gradient */}
        <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-black/50 to-transparent" />

        {/* Bottom Gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/50 to-transparent" />

        {/* Top Right Controls */}
        <div className="absolute top-4 right-4 flex items-center gap-2 z-30">
          {/* Mute/Unmute Button */}
          <button
            onClick={toggleMute}
            className="p-2 bg-black/60 rounded-full hover:bg-black/80 transition pointer-events-auto z-30"
          >
            {isMuted ? (
              <VolumeX className="w-5 h-5 text-white" />
            ) : (
              <Volume2 className="w-5 h-5 text-white" />
            )}
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="p-2 bg-black/60 rounded-full hover:bg-black/80 transition pointer-events-auto z-30"
          >
            {isFullscreen ? (
              <Minimize className="w-5 h-5 text-white" />
            ) : (
              <Maximize className="w-5 h-5 text-white" />
            )}
          </button>
        </div>
      </div>

      {/* Progress Bar - Always Visible with larger hit area */}
      <div
        className="absolute bottom-0 left-0 right-0 h-8 cursor-pointer pointer-events-auto z-10 flex items-end"
        onClick={handleProgressClick}
      >
        {/* Visual progress bar */}
        <div className="w-full h-1 bg-white/30">
          <div
            className="h-full bg-white transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};