import { useState, useRef } from 'react';
import type { PostMedia } from '../types';
import { VideoPlayer } from './VideoPlayer';

interface MediaCarouselProps {
  media: PostMedia[];
}

const MediaCarousel = ({ media }: MediaCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showFullscreen, setShowFullscreen] = useState(false);
  
  const touchStartXRef = useRef(0);
  const touchEndXRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

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
              onClick={() => setShowFullscreen(true)}
              draggable={false}
            />
          ) : (
            <VideoPlayer
              src={currentMedia.media_url}
              className="max-w-full max-h-full"
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
