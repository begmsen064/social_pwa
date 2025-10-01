import { useState, useRef } from 'react';
import type { PostMedia } from '../types';
import { VideoPlayer } from './VideoPlayer';

interface MediaCarouselProps {
  media: PostMedia[];
}

const MediaCarousel = ({ media }: MediaCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [scale, setScale] = useState(1);
  const [translateX, setTranslateX] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  const touchStartXRef = useRef(0);
  const touchEndXRef = useRef(0);
  const touchStartYRef = useRef(0);
  const initialDistanceRef = useRef(0);
  const lastScaleRef = useRef(1);
  const lastTranslateRef = useRef({ x: 0, y: 0 });

  if (!media || media.length === 0) return null;

  const goToPrevious = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? media.length - 1 : prev - 1));
  };

  const goToNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === media.length - 1 ? 0 : prev + 1));
  };

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

  // Handle touch gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    if (currentMedia.media_type !== 'image') return;

    if (e.touches.length === 2) {
      e.preventDefault();
      initialDistanceRef.current = getDistance(e.touches);
      lastScaleRef.current = scale;
    } else if (e.touches.length === 1) {
      touchStartXRef.current = e.touches[0].clientX;
      touchEndXRef.current = e.touches[0].clientX;
      touchStartYRef.current = e.touches[0].clientY;
      
      if (scale > 1) {
        lastTranslateRef.current = { x: translateX, y: translateY };
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (currentMedia.media_type !== 'image') return;

    if (e.touches.length === 2) {
      e.preventDefault();
      const currentDistance = getDistance(e.touches);
      let newScale = (currentDistance / initialDistanceRef.current) * lastScaleRef.current;
      
      // Smooth scaling with dampening
      const scaleDiff = newScale - lastScaleRef.current;
      newScale = lastScaleRef.current + (scaleDiff * 0.5);
      newScale = Math.min(Math.max(newScale, 1), 3);
      
      setScale(newScale);
    } else if (e.touches.length === 1) {
      if (scale > 1.1) {
        e.preventDefault();
        const deltaX = e.touches[0].clientX - touchStartXRef.current;
        const deltaY = e.touches[0].clientY - touchStartYRef.current;
        
        const maxPan = 300 * scale;
        const newX = Math.min(Math.max(lastTranslateRef.current.x + deltaX, -maxPan), maxPan);
        const newY = Math.min(Math.max(lastTranslateRef.current.y + deltaY, -maxPan), maxPan);
        
        setTranslateX(newX);
        setTranslateY(newY);
      } else {
        touchEndXRef.current = e.touches[0].clientX;
      }
    }
  };

  const handleTouchEnd = () => {
    if (currentMedia.media_type !== 'image') return;

    if (scale <= 1.15) {
      setScale(1);
      setTranslateX(0);
      setTranslateY(0);
      lastScaleRef.current = 1;
      lastTranslateRef.current = { x: 0, y: 0 };
    }

    touchStartXRef.current = 0;
    touchEndXRef.current = 0;
  };

  return (
    <div 
      className="relative w-full bg-black rounded-lg overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Media Content */}
      {currentMedia.media_type === 'image' ? (
        <img
          src={currentMedia.media_url}
          alt={`Media ${currentIndex + 1}`}
          loading="lazy"
          decoding="async"
          className="w-full h-auto max-h-[600px] object-contain select-none"
          style={{
            transform: `scale(${scale}) translate(${translateX / scale}px, ${translateY / scale}px)`,
            transition: scale === 1 ? 'transform 0.3s ease-out' : 'none',
            touchAction: scale > 1 ? 'none' : 'pan-y',
          }}
          draggable={false}
        />
      ) : (
          <VideoPlayer
            src={currentMedia.media_url}
            className="w-full h-auto max-h-[600px]"
            autoPlay={false}
          />
        )}

      {/* Navigation Arrows (only if multiple media and not zoomed) */}
      {media.length > 1 && scale <= 1.1 && (
        <>
          {/* Previous Button */}
          <button
            onClick={goToPrevious}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-all backdrop-blur-sm"
            aria-label="Previous"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Next Button */}
          <button
            onClick={goToNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-all backdrop-blur-sm"
            aria-label="Next"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Dots Indicator */}
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
      </>
      )}

      {/* Media Counter */}
      {media.length > 1 && (
        <div className="absolute top-4 right-4 px-3 py-1 bg-black/70 text-white text-sm rounded-full backdrop-blur-sm">
          {currentIndex + 1} / {media.length}
        </div>
      )}

      {/* Zoom Indicator */}
      {scale > 1.1 && currentMedia.media_type === 'image' && (
        <div className="absolute top-4 left-4 px-3 py-1 bg-black/70 text-white text-xs rounded-full backdrop-blur-sm">
          {scale.toFixed(1)}x
        </div>
      )}
    </div>
  );
};

export default MediaCarousel;
