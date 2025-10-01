import { useState, useEffect, useRef } from 'react';
import type { PostMedia } from '../types';

interface ImageModalProps {
  media: PostMedia[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

const ImageModal = ({ media, initialIndex, isOpen, onClose }: ImageModalProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const touchStartXRef = useRef(0);
  const touchEndXRef = useRef(0);
  const touchStartYRef = useRef(0);
  const touchEndYRef = useRef(0);
  const [scale, setScale] = useState(1);
  const [translateX, setTranslateX] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  const initialDistanceRef = useRef(0);
  const lastScaleRef = useRef(1);
  const lastTranslateRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  // Reset zoom when currentIndex changes
  useEffect(() => {
    setScale(1);
    setTranslateX(0);
    setTranslateY(0);
    lastScaleRef.current = 1;
    lastTranslateRef.current = { x: 0, y: 0 };
  }, [currentIndex]);

  useEffect(() => {
    if (isOpen) {
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? media.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === media.length - 1 ? 0 : prev + 1));
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

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

  // Handle swipe gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Two fingers - pinch zoom
      e.preventDefault();
      initialDistanceRef.current = getDistance(e.touches);
      lastScaleRef.current = scale;
    } else if (e.touches.length === 1) {
      touchStartXRef.current = e.touches[0].clientX;
      touchEndXRef.current = e.touches[0].clientX;
      touchStartYRef.current = e.touches[0].clientY;
      touchEndYRef.current = e.touches[0].clientY;
      
      if (scale > 1) {
        // If zoomed, prepare for pan
        lastTranslateRef.current = { x: translateX, y: translateY };
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Two fingers - pinch zoom
      e.preventDefault();
      const currentDistance = getDistance(e.touches);
      let newScale = (currentDistance / initialDistanceRef.current) * lastScaleRef.current;
      
      // Smooth scaling with dampening
      const scaleDiff = newScale - lastScaleRef.current;
      newScale = lastScaleRef.current + (scaleDiff * 0.5); // 50% dampening
      
      // Limit scale between 1x and 3x (reduced max)
      newScale = Math.min(Math.max(newScale, 1), 3);
      
      setScale(newScale);
    } else if (e.touches.length === 1) {
      if (scale > 1.1) { // Only pan if significantly zoomed
        // Zoomed - pan with bounds
        e.preventDefault();
        const deltaX = e.touches[0].clientX - touchStartXRef.current;
        const deltaY = e.touches[0].clientY - touchStartYRef.current;
        
        // Limit pan range based on zoom level
        const maxPan = 300 * scale;
        const newX = Math.min(Math.max(lastTranslateRef.current.x + deltaX, -maxPan), maxPan);
        const newY = Math.min(Math.max(lastTranslateRef.current.y + deltaY, -maxPan), maxPan);
        
        setTranslateX(newX);
        setTranslateY(newY);
      } else {
        // Not zoomed - track for swipe navigation
        touchEndXRef.current = e.touches[0].clientX;
      }
    }
  };

  const handleTouchEnd = () => {
    // If zoomed out completely, reset position
    if (scale <= 1.15) {
      setScale(1);
      setTranslateX(0);
      setTranslateY(0);
      lastScaleRef.current = 1;
      lastTranslateRef.current = { x: 0, y: 0 };
    }

    // Only handle swipe navigation if not zoomed
    if (scale <= 1.1) {
      const swipeDistance = touchStartXRef.current - touchEndXRef.current;
      const minSwipeDistance = 75;

      if (Math.abs(swipeDistance) >= minSwipeDistance) {
        if (swipeDistance > 0) {
          goToNext();
        } else {
          goToPrevious();
        }
      }
    }

    // Reset values
    touchStartXRef.current = 0;
    touchEndXRef.current = 0;
  };

  // Double tap to zoom
  const handleDoubleTap = () => {
    if (scale > 1) {
      // Zoom out with animation
      setScale(1);
      setTranslateX(0);
      setTranslateY(0);
      lastScaleRef.current = 1;
      lastTranslateRef.current = { x: 0, y: 0 };
    } else {
      // Zoom in to 2x (reduced from 2x to be more reasonable)
      setScale(2);
      lastScaleRef.current = 2;
      setTranslateX(0);
      setTranslateY(0);
      lastTranslateRef.current = { x: 0, y: 0 };
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black"
      onClick={onClose}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-[10000] w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-all backdrop-blur-sm"
        aria-label="Close"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      {/* Media Counter */}
      {media.length > 1 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[10000] px-4 py-2 bg-black/70 text-white text-sm rounded-full backdrop-blur-sm">
          {currentIndex + 1} / {media.length}
        </div>
      )}


      {/* Media Content */}
      <div
        className="w-full h-full flex items-center justify-center p-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {currentMedia.media_type === 'image' ? (
          <img
            src={currentMedia.media_url}
            alt={`Media ${currentIndex + 1}`}
            className="max-w-full max-h-full object-contain select-none"
            loading="lazy"
            onDoubleClick={handleDoubleTap}
            style={{
              transform: `scale(${scale}) translate(${translateX / scale}px, ${translateY / scale}px)`,
              cursor: scale > 1 ? 'move' : 'zoom-in',
              touchAction: scale > 1 ? 'none' : 'pan-y',
              transition: scale === 1 ? 'transform 0.3s ease-out' : 'none',
            }}
            draggable={false}
          />
        ) : (
          <video
            src={currentMedia.media_url}
            poster={currentMedia.thumbnail_url}
            controls
            className="max-w-full max-h-full object-contain"
            autoPlay
          />
        )}
      </div>

      {/* Dots Indicator */}
      {media.length > 1 && (
        <div className="absolute bottom-8 left-0 right-0 flex items-center justify-center gap-2 z-[10000]">
          {media.map((_, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setCurrentIndex(index);
              }}
              className={`h-2 rounded-full transition-all ${
                index === currentIndex
                  ? 'bg-white w-8'
                  : 'bg-white/50 hover:bg-white/70 w-2'
              }`}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Hints */}
      {scale === 1 && media.length > 1 && (
        <div className="absolute bottom-20 left-0 right-0 text-center z-[10000]">
          <p className="text-white/70 text-sm font-medium">
            ← Kaydır → | Çift tıkla: Yakınlaştır
          </p>
        </div>
      )}
      {scale > 1 && (
        <div className="absolute bottom-20 left-0 right-0 text-center z-[10000]">
          <p className="text-white/70 text-sm font-medium">
            Çift tıkla: Uzaklaştır | Sürükle: Hareket ettir
          </p>
        </div>
      )}
    </div>
  );
};

export default ImageModal;