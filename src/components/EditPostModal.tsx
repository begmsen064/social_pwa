import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { TURKISH_CITIES } from '../data/cities';

interface EditPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (caption: string, location: string) => Promise<void>;
  initialCaption: string;
  initialLocation: string;
}

export const EditPostModal = ({ isOpen, onClose, onSave, initialCaption, initialLocation }: EditPostModalProps) => {
  const [caption, setCaption] = useState(initialCaption);
  const [location, setLocation] = useState(initialLocation);
  const [isSaving, setIsSaving] = useState(false);
  const [showHashtagSuggestions, setShowHashtagSuggestions] = useState(false);
  const [hashtagSuggestions, setHashtagSuggestions] = useState<string[]>([]);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [filteredCities, setFilteredCities] = useState<string[]>([]);
  const captionInputRef = useRef<HTMLTextAreaElement>(null);
  const hashtagSuggestionsRef = useRef<HTMLDivElement>(null);
  const locationInputRef = useRef<HTMLInputElement>(null);
  const citySuggestionsRef = useRef<HTMLDivElement>(null);

  // Reset states when modal opens
  useEffect(() => {
    if (isOpen) {
      setCaption(initialCaption);
      setLocation(initialLocation);
    }
  }, [isOpen, initialCaption, initialLocation]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        hashtagSuggestionsRef.current &&
        !hashtagSuggestionsRef.current.contains(event.target as Node) &&
        captionInputRef.current &&
        !captionInputRef.current.contains(event.target as Node)
      ) {
        setShowHashtagSuggestions(false);
      }
      
      if (
        citySuggestionsRef.current &&
        !citySuggestionsRef.current.contains(event.target as Node) &&
        locationInputRef.current &&
        !locationInputRef.current.contains(event.target as Node)
      ) {
        setShowCitySuggestions(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Normalize Turkish characters for search
  const normalizeTurkish = (text: string): string => {
    return text
      .replace(/İ/g, 'i')
      .replace(/I/g, 'i')
      .replace(/ı/g, 'i')
      .replace(/Ğ/g, 'g')
      .replace(/ğ/g, 'g')
      .replace(/Ü/g, 'u')
      .replace(/ü/g, 'u')
      .replace(/Ş/g, 's')
      .replace(/ş/g, 's')
      .replace(/Ö/g, 'o')
      .replace(/ö/g, 'o')
      .replace(/Ç/g, 'c')
      .replace(/ç/g, 'c')
      .toLowerCase();
  };

  // Fetch popular hashtags
  const fetchPopularHashtags = async (search: string) => {
    try {
      const { data: posts } = await supabase
        .from('posts')
        .select('caption')
        .not('caption', 'is', null)
        .order('created_at', { ascending: false })
        .limit(500);

      if (!posts) return [];

      const hashtagCount: { [key: string]: number } = {};
      posts.forEach(post => {
        if (post.caption) {
          const hashtags = post.caption.match(/#[\wşŞıİğĞüÜöÖçÇ]+/g);
          if (hashtags) {
            hashtags.forEach((tag: string) => {
              const cleanTag = tag.substring(1).toLowerCase();
              hashtagCount[cleanTag] = (hashtagCount[cleanTag] || 0) + 1;
            });
          }
        }
      });

      const sortedHashtags = Object.entries(hashtagCount)
        .sort((a, b) => b[1] - a[1])
        .map(([tag]) => tag);

      if (search) {
        return sortedHashtags.filter(tag => 
          tag.toLowerCase().includes(search.toLowerCase())
        ).slice(0, 10);
      }

      return sortedHashtags.slice(0, 10);
    } catch (error) {
      console.error('Error fetching hashtags:', error);
      return [];
    }
  };

  // Handle caption change with hashtag detection
  const handleCaptionChange = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart;
    setCaption(value);
    setCursorPosition(cursorPos);

    const textBeforeCursor = value.substring(0, cursorPos);
    const hashtagMatch = textBeforeCursor.match(/#([\wşŞıİğĞüÜöÖçÇ]*)$/);

    if (hashtagMatch) {
      const searchTerm = hashtagMatch[1];
      const suggestions = await fetchPopularHashtags(searchTerm);
      setHashtagSuggestions(suggestions);
      setShowHashtagSuggestions(suggestions.length > 0);
    } else {
      setShowHashtagSuggestions(false);
    }
  };

  // Insert hashtag at cursor position
  const insertHashtag = (tag: string) => {
    const textBeforeCursor = caption.substring(0, cursorPosition);
    const textAfterCursor = caption.substring(cursorPosition);
    
    const hashtagMatch = textBeforeCursor.match(/#([\wşŞıİğĞüÜöÖçÇ]*)$/);
    if (hashtagMatch) {
      const hashtagStartPos = textBeforeCursor.lastIndexOf('#');
      const newText = 
        caption.substring(0, hashtagStartPos) + 
        `#${tag} ` + 
        textAfterCursor;
      
      setCaption(newText);
      setShowHashtagSuggestions(false);
      
      setTimeout(() => {
        if (captionInputRef.current) {
          const newCursorPos = hashtagStartPos + tag.length + 2;
          captionInputRef.current.setSelectionRange(newCursorPos, newCursorPos);
          captionInputRef.current.focus();
        }
      }, 0);
    }
  };

  // Handle location change
  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocation(value);

    if (value.trim()) {
      const normalizedValue = normalizeTurkish(value);
      const filtered = TURKISH_CITIES.filter(city =>
        normalizeTurkish(city).includes(normalizedValue)
      );
      setFilteredCities(filtered);
      setShowCitySuggestions(true);
    } else {
      setShowCitySuggestions(false);
    }
  };

  // Handle city selection
  const handleCitySelect = (city: string) => {
    setLocation(city);
    setShowCitySuggestions(false);
    locationInputRef.current?.blur();
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(caption, location);
      onClose();
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-lg w-full shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Postu Düzenle
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* Caption */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Açıklama
              <span className="ml-2 text-xs text-primary font-normal">(# ekleyerek hashtag önerileri al)</span>
            </label>
            <textarea
              ref={captionInputRef}
              value={caption}
              onChange={handleCaptionChange}
              rows={4}
              maxLength={2200}
              placeholder="Açıklama yazın... #hashtag ekleyebilirsin"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <div className="mt-1 flex items-center justify-between text-xs">
              <div className="flex flex-wrap gap-1">
                {caption.match(/#[\wşŞıİğĞüÜöÖçÇ]+/g)?.map((tag, index) => (
                  <span 
                    key={index} 
                    className="inline-flex items-center px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <span className="text-gray-500 dark:text-gray-400">
                {caption.length} / 2200
              </span>
            </div>
            
            {/* Hashtag Suggestions */}
            {showHashtagSuggestions && hashtagSuggestions.length > 0 && (
              <div
                ref={hashtagSuggestionsRef}
                className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto"
              >
                {hashtagSuggestions.map((tag, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => insertHashtag(tag)}
                    className="w-full text-left px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors flex items-center"
                  >
                    <span className="text-primary font-semibold mr-2">#</span>
                    {tag}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Location */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Konum
            </label>
            <input
              ref={locationInputRef}
              type="text"
              value={location}
              onChange={handleLocationChange}
              onFocus={() => {
                if (location.trim()) {
                  const normalizedValue = normalizeTurkish(location);
                  const filtered = TURKISH_CITIES.filter(city =>
                    normalizeTurkish(city).includes(normalizedValue)
                  );
                  setFilteredCities(filtered);
                  setShowCitySuggestions(true);
                }
              }}
              maxLength={100}
              placeholder="Şehir seçin veya yazın..."
              autoComplete="off"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            
            {/* City Suggestions */}
            {showCitySuggestions && filteredCities.length > 0 && (
              <div
                ref={citySuggestionsRef}
                className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto"
              >
                {filteredCities.map((city) => (
                  <button
                    key={city}
                    type="button"
                    onClick={() => handleCitySelect(city)}
                    className="w-full text-left px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors flex items-center"
                  >
                    <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    {city}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition disabled:opacity-50"
          >
            İptal
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Kaydediliyor...
              </>
            ) : (
              'Kaydet'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};