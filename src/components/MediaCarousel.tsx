import { useState } from 'react';
import type { PostMedia } from '../types';
import ImageModal from './ImageModal';
import { VideoPlayer } from './VideoPlayer';

interface MediaCarouselProps {
  media: PostMedia[];
}

const MediaCarousel = ({ media }: MediaCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalIndex, setModalIndex] = useState(0);

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

  const openModal = () => {
    setModalIndex(currentIndex);
    setModalOpen(true);
  };

  return (
    <>
      <div className="relative w-full bg-black rounded-lg overflow-hidden">
        {/* Media Content */}
        {currentMedia.media_type === 'image' ? (
          <img
            src={currentMedia.media_url}
            alt={`Media ${currentIndex + 1}`}
            loading="lazy"
            decoding="async"
            className="w-full h-auto max-h-[600px] object-contain cursor-pointer hover:opacity-90 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              openModal();
            }}
          />
        ) : (
          <VideoPlayer
            src={currentMedia.media_url}
            className="w-full h-auto max-h-[600px]"
            autoPlay={false}
          />
        )}

      {/* Navigation Arrows (only if multiple media) */}
      {media.length > 1 && (
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
      </div>

      {/* Image Modal */}
      <ImageModal
        media={media}
        initialIndex={modalIndex}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
};

export default MediaCarousel;
