import { useState, useRef } from 'react';
import type { PostMedia } from '../types';
import { VideoPlayer } from './VideoPlayer';

interface MediaCarouselProps {
  media: PostMedia[];
  onDoubleTap?: () => void;
  isLiked?: boolean;
}

const MediaCarousel = ({ media, onDoubleTap, isLiked }: MediaCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);
  
  const touchStartXRef = useRef(0);
  const touchEndXRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastTapRef = useRef(0);
  const singleTapTimerRef = useRef<NodeJS.Timeout | null>(null);

  if (!media || media.length === 0) return null;

  const currentMedia = media[currentIndex];

  // Handle swipe in PostCard view
  const handleTouchStart = (e: React.TouchEvent) => {
    if (currentMedia.media_type !== 'image') return;
    touchStartXRef.current = e.touches[0].clientX;
    touchEndXRef.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (currentMedia.media_type !== 'image') return;
    touchEndXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (currentMedia.media_type !== 'image' || media.length <= 1) return;

    const swipeDistance = touchStartXRef.current - touchEndXRef.current;
    const minSwipeDistance = 50;

    if (Math.abs(swipeDistance) >= minSwipeDistance) {
      if (swipeDistance > 0) {
        // Swiped left -> next
        setCurrentIndex((prev) => (prev === media.length - 1 ? 0 : prev + 1));
      } else {
        // Swiped right -> previous
        setCurrentIndex((prev) => (prev === 0 ? media.length - 1 : prev - 1));
      }
    }

    touchStartXRef.current = 0;
    touchEndXRef.current = 0;
  };

  // Handle swipe in fullscreen modal
  const handleFullscreenTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchEndXRef.current = e.touches[0].clientX;
  };

  const handleFullscreenTouchMove = (e: React.TouchEvent) => {
    touchEndXRef.current = e.touches[0].clientX;
  };

  const handleFullscreenTouchEnd = () => {
    if (media.length <= 1) return;

    const swipeDistance = touchStartXRef.current - touchEndXRef.current;
    const minSwipeDistance = 50;

    if (Math.abs(swipeDistance) >= minSwipeDistance) {
      if (swipeDistance > 0) {
        // Swiped left -> next
        setCurrentIndex((prev) => (prev === media.length - 1 ? 0 : prev + 1));
      } else {
        // Swiped right -> previous
        setCurrentIndex((prev) => (prev === 0 ? media.length - 1 : prev - 1));
      }
    }

    touchStartXRef.current = 0;
    touchEndXRef.current = 0;
  };

  const closeFullscreen = () => {
    setShowFullscreen(false);
  };

  return (
    <>
      <div 
        ref={containerRef}
        className="relative w-full bg-black rounded-lg overflow-hidden"
        style={{ height: '500px' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Media Content - Fixed height with letterboxing */}
        <div className="w-full h-full flex items-center justify-center">
          {currentMedia.media_type === 'image' ? (
            <img
              src={currentMedia.media_url}
              alt={`Media ${currentIndex + 1}`}
              loading="lazy"
              decoding="async"
              className="max-w-full max-h-full object-contain select-none cursor-pointer"
              onClick={(e) => {
                const now = Date.now();
                const DOUBLE_TAP_DELAY = 300;

                // Check for double tap
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
                  if (onDoubleTap) {
                    onDoubleTap();
                    // Show animation only when liking
                    if (!isLiked) {
                      setShowHeartAnimation(true);
                      setTimeout(() => setShowHeartAnimation(false), 1000);
                    }
                  }
                } else {
                  // Single tap - wait to see if it's a double tap
                  singleTapTimerRef.current = setTimeout(() => {
                    setShowFullscreen(true);
                    singleTapTimerRef.current = null;
                  }, DOUBLE_TAP_DELAY);
                }
                
                lastTapRef.current = now;
              }}
              draggable={false}
            />
          ) : (
            <VideoPlayer
              src={currentMedia.media_url}
              className="w-full h-full"
              autoPlay={false}
            />
          )}
        </div>

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
        
        {/* Double Tap Heart Animation */}
        {showHeartAnimation && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
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
              src={currentMedia.media_url}
              alt={`Media ${currentIndex + 1}`}
              className="max-w-full max-h-full object-contain select-none"
              draggable={false}
            />
          </div>

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
