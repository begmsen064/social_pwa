import { useState, useRef } from 'react';
import type { PostMedia } from '../types';
import { VideoPlayer } from './VideoPlayer';

interface MediaCarouselProps {
  media: PostMedia[];
}

const MediaCarousel = ({ media }: MediaCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [isZooming, setIsZooming] = useState(false);
  
  // Use refs for smooth, lag-free zoom and pan
  const scaleRef = useRef(1);
  const translateXRef = useRef(0);
  const translateYRef = useRef(0);
  const zoomCenterXRef = useRef(0);
  const zoomCenterYRef = useRef(0);
  
  const touchStartXRef = useRef(0);
  const touchEndXRef = useRef(0);
  const touchStartYRef = useRef(0);
  const initialDistanceRef = useRef(0);
  const lastScaleRef = useRef(1);
  const lastTranslateRef = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const fullscreenImageRef = useRef<HTMLImageElement>(null);
  const hasPinchedRef = useRef(false);
  const isPanningRef = useRef(false);
  const animationFrameRef = useRef<number>();

  if (!media || media.length === 0) return null;

  const currentMedia = media[currentIndex];

  // Get distance between two touch points
  const getDistance = (touches: React.TouchList) => {
    const touch1 = touches[0];
    const touch2 = touches[1];
    return Math.hypot(
      touch2.clientX - touch1.clientX,
      touch2.clientY - touch1.clientY
    );
  };

  // Apply transform directly to DOM for smooth, lag-free updates using RAF
  const applyTransform = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    animationFrameRef.current = requestAnimationFrame(() => {
      if (fullscreenImageRef.current) {
        const scale = scaleRef.current;
        const x = translateXRef.current;
        const y = translateYRef.current;
        const zoomX = zoomCenterXRef.current;
        const zoomY = zoomCenterYRef.current;
        
        fullscreenImageRef.current.style.transform = `scale(${scale}) translate(${(x + zoomX * (scale - 1)) / scale}px, ${(y + zoomY * (scale - 1)) / scale}px)`;
      }
    });
  };

  // Handle touch gestures in fullscreen modal
  const handleFullscreenTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      e.stopPropagation();
      setIsZooming(true);
      hasPinchedRef.current = false;
      isPanningRef.current = false;
      
      initialDistanceRef.current = getDistance(e.touches);
      lastScaleRef.current = scaleRef.current;
      
      // Calculate center point between two fingers
      const img = fullscreenImageRef.current;
      if (img) {
        const rect = img.getBoundingClientRect();
        const centerX = ((e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left - rect.width / 2);
        const centerY = ((e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top - rect.height / 2);
        zoomCenterXRef.current = centerX;
        zoomCenterYRef.current = centerY;
      }
    } else if (e.touches.length === 1) {
      touchStartXRef.current = e.touches[0].clientX;
      touchEndXRef.current = e.touches[0].clientX;
      touchStartYRef.current = e.touches[0].clientY;
      
      if (scaleRef.current > 1) {
        isPanningRef.current = true;
        lastTranslateRef.current = { x: translateXRef.current, y: translateYRef.current };
      }
    }
  };

  const handleFullscreenTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Pinch zoom
      e.preventDefault();
      e.stopPropagation();
      
      const currentDistance = getDistance(e.touches);
      const newScale = (currentDistance / initialDistanceRef.current) * lastScaleRef.current;
      const clampedScale = Math.min(Math.max(newScale, 1), 4);
      
      // Mark as pinched if significant scale change
      if (Math.abs(clampedScale - lastScaleRef.current) > 0.05) {
        hasPinchedRef.current = true;
      }
      
      scaleRef.current = clampedScale;
      
      // Update zoom center dynamically
      const img = fullscreenImageRef.current;
      if (img) {
        const rect = img.getBoundingClientRect();
        const centerX = ((e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left - rect.width / 2);
        const centerY = ((e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top - rect.height / 2);
        zoomCenterXRef.current = centerX;
        zoomCenterYRef.current = centerY;
      }
      
      applyTransform();
    } else if (e.touches.length === 1) {
      if (isPanningRef.current && scaleRef.current > 1.1) {
        // Pan in all directions when zoomed
        e.preventDefault();
        e.stopPropagation();
        
        const deltaX = e.touches[0].clientX - touchStartXRef.current;
        const deltaY = e.touches[0].clientY - touchStartYRef.current;
        
        const maxPan = 400 * scaleRef.current;
        const newX = Math.min(Math.max(lastTranslateRef.current.x + deltaX, -maxPan), maxPan);
        const newY = Math.min(Math.max(lastTranslateRef.current.y + deltaY, -maxPan), maxPan);
        
        translateXRef.current = newX;
        translateYRef.current = newY;
        
        applyTransform();
      } else if (scaleRef.current <= 1.1) {
        // Track for swipe navigation only if not zoomed
        touchEndXRef.current = e.touches[0].clientX;
      }
    }
  };

  const handleFullscreenTouchEnd = () => {
    // Handle swipe navigation ONLY if:
    // - User hasn't pinched
    // - Not currently panning
    // - Scale is normal
    if (!hasPinchedRef.current && !isPanningRef.current && !isZooming && scaleRef.current <= 1.1 && media.length > 1) {
      const swipeDistance = touchStartXRef.current - touchEndXRef.current;
      const minSwipeDistance = 100; // Higher threshold to prevent accidental changes

      if (Math.abs(swipeDistance) >= minSwipeDistance) {
        if (swipeDistance > 0) {
          // Swiped left -> next
          setCurrentIndex((prev) => (prev === media.length - 1 ? 0 : prev + 1));
        } else {
          // Swiped right -> previous
          setCurrentIndex((prev) => (prev === 0 ? media.length - 1 : prev - 1));
        }
      }
    }

    // Instagram style: always reset when fingers released
    scaleRef.current = 1;
    translateXRef.current = 0;
    translateYRef.current = 0;
    zoomCenterXRef.current = 0;
    zoomCenterYRef.current = 0;
    setIsZooming(false);
    hasPinchedRef.current = false;
    isPanningRef.current = false;
    lastScaleRef.current = 1;
    lastTranslateRef.current = { x: 0, y: 0 };

    touchStartXRef.current = 0;
    touchEndXRef.current = 0;
    
    // Reset transform
    if (fullscreenImageRef.current) {
      fullscreenImageRef.current.style.transform = 'scale(1) translate(0px, 0px)';
    }
  };

  const closeFullscreen = () => {
    setShowFullscreen(false);
    scaleRef.current = 1;
    translateXRef.current = 0;
    translateYRef.current = 0;
    setIsZooming(false);
  };

  return (
    <>
      <div 
        ref={containerRef}
        className="relative w-full bg-black rounded-lg overflow-hidden"
      >
        {/* Media Content */}
        {currentMedia.media_type === 'image' ? (
          <img
            src={currentMedia.media_url}
            alt={`Media ${currentIndex + 1}`}
            loading="lazy"
            decoding="async"
            className="w-full h-auto max-h-[600px] object-contain select-none cursor-pointer"
            onClick={() => setShowFullscreen(true)}
            draggable={false}
          />
        ) : (
          <VideoPlayer
            src={currentMedia.media_url}
            className="w-full h-auto max-h-[600px]"
            autoPlay={false}
          />
        )}

      {/* Dots Indicator - Only if multiple media */}
      {media.length > 1 && (
        <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-2">
          {media.map((_, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setCurrentIndex(index);
              }}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex
                  ? 'bg-white w-6'
                  : 'bg-white/50 hover:bg-white/70'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}

        {/* Media Counter */}
        {media.length > 1 && (
          <div className="absolute top-4 right-4 px-3 py-1 bg-black/70 text-white text-sm rounded-full backdrop-blur-sm">
            {currentIndex + 1} / {media.length}
          </div>
        )}
      </div>

      {/* Fullscreen Modal - Instagram Style */}
      {showFullscreen && currentMedia.media_type === 'image' && (
        <div 
          className="fixed inset-0 z-[9999] bg-black"
          onTouchStart={handleFullscreenTouchStart}
          onTouchMove={handleFullscreenTouchMove}
          onTouchEnd={handleFullscreenTouchEnd}
        >
          {/* Close button */}
          <button
            onClick={closeFullscreen}
            className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Image container */}
          <div className="w-full h-full flex items-center justify-center">
            <img
              ref={fullscreenImageRef}
              src={currentMedia.media_url}
              alt={`Media ${currentIndex + 1}`}
              className="max-w-full max-h-full object-contain select-none"
              style={{
                transformOrigin: 'center',
                touchAction: 'none',
              }}
              draggable={false}
            />
          </div>

          {/* Zoom Level Indicator */}
          {scaleRef.current > 1.1 && (
            <div className="absolute top-8 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/60 text-white text-sm rounded-full backdrop-blur-sm">
              {scaleRef.current.toFixed(1)}x
            </div>
          )}

          {/* Image counter for multiple images */}
          {media.length > 1 && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/60 text-white text-sm rounded-full backdrop-blur-sm">
              {currentIndex + 1} / {media.length}
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default MediaCarousel;
