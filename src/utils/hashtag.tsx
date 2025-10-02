import { Link } from 'react-router-dom';

/**
 * Parse text and return segments with hashtags marked
 */
export const parseHashtags = (text: string) => {
  const hashtagRegex = /#[\wşŞıİğĞüÜöÖçÇ]+/g;
  const parts: { text: string; isHashtag: boolean }[] = [];
  let lastIndex = 0;
  let match;

  while ((match = hashtagRegex.exec(text)) !== null) {
    // Add text before hashtag
    if (match.index > lastIndex) {
      parts.push({
        text: text.substring(lastIndex, match.index),
        isHashtag: false,
      });
    }

    // Add hashtag
    parts.push({
      text: match[0],
      isHashtag: true,
    });

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push({
      text: text.substring(lastIndex),
      isHashtag: false,
    });
  }

  return parts;
};

/**
 * Render text with clickable hashtags
 */
export const renderTextWithHashtags = (text: string) => {
  if (!text) return null;

  const parts = parseHashtags(text);

  return parts.map((part, index) => {
    if (part.isHashtag) {
      const tag = part.text.substring(1); // Remove # symbol
      return (
        <Link
          key={index}
          to={`/hashtag/${encodeURIComponent(tag)}`}
          className="text-primary hover:text-secondary font-semibold transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          {part.text}
        </Link>
      );
    }
    return <span key={index}>{part.text}</span>;
  });
};

/**
 * Extract hashtags from text
 */
export const extractHashtags = (text: string): string[] => {
  if (!text) return [];
  
  const hashtagRegex = /#[\wşŞıİğĞüÜöÖçÇ]+/g;
  const matches = text.match(hashtagRegex);
  
  if (!matches) return [];
  
  // Remove # and convert to lowercase for consistency
  return matches.map(tag => tag.substring(1).toLowerCase());
};
