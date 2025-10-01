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
  const [isZooming, setIsZooming] = useState(false);
  const touchStartXRef = useRef(0);
  const touchEndXRef = useRef(0);
  const touchStartYRef = useRef(0);
  const initialDistanceRef = useRef(0);
  const lastScaleRef = useRef(1);
  const lastTranslateRef = useRef({ x: 0, y: 0 });

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

  // Handle touch gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    if (currentMedia.media_type !== 'image') return;

    if (e.touches.length === 2) {
      e.preventDefault();
      setIsZooming(true);
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

    // Instagram style: always reset when fingers released
    setScale(1);
    setTranslateX(0);
    setTranslateY(0);
    setIsZooming(false);
    lastScaleRef.current = 1;
    lastTranslateRef.current = { x: 0, y: 0 };

    touchStartXRef.current = 0;
    touchEndXRef.current = 0;
  };

  return (
    <>
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

      {/* Fullscreen Zoom Overlay - Instagram Style */}
      {isZooming && scale > 1 && currentMedia.media_type === 'image' && (
        <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center">
          <img
            src={currentMedia.media_url}
            alt={`Media ${currentIndex + 1}`}
            className="max-w-full max-h-full object-contain select-none"
            style={{
              transform: `scale(${scale}) translate(${translateX / scale}px, ${translateY / scale}px)`,
              touchAction: 'none',
            }}
            draggable={false}
          />
          {/* Zoom Level Indicator */}
          <div className="absolute top-8 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/60 text-white text-sm rounded-full backdrop-blur-sm">
            {scale.toFixed(1)}x
          </div>
        </div>
      )}
    </>
  );
};

export default MediaCarousel;
