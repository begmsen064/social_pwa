import { useState, useEffect, useRef } from 'react';
import { X, Send } from 'lucide-react';
import { useComments } from '../../hooks/useComments';
import { CommentItem } from './CommentItem';

interface CommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
  onCommentAdded?: () => void;
}

export const CommentsModal = ({ isOpen, onClose, postId, onCommentAdded }: CommentsModalProps) => {
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { comments, loading, error, addComment } = useComments(postId);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

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

  // Scroll to bottom when comments load
  useEffect(() => {
    if (scrollRef.current && comments.length > 0) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [comments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!commentText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const success = await addComment(commentText);
    
    if (success) {
      setCommentText('');
      onCommentAdded?.();
      
      // Scroll to bottom after adding comment
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 100);
    }
    
    setIsSubmitting(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center sm:justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bottom-16 sm:bottom-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full sm:max-w-lg sm:max-h-[80vh] bg-white dark:bg-gray-900 sm:rounded-2xl rounded-t-2xl flex flex-col max-h-[calc(100vh-4rem)] sm:max-h-[80vh] sm:shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Comments
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Comments List */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-4 py-2"
        >
          {loading && comments.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 dark:border-gray-700 border-t-blue-500" />
            </div>
          ) : comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                No comments yet
              </p>
              <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
                Be the first to comment!
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {comments.map((comment) => (
                <CommentItem key={comment.id} comment={comment} />
              ))}
            </div>
          )}

          {error && (
            <div className="py-4 text-center">
              <p className="text-red-500 text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Input Form */}
        <div className="border-t border-gray-200 dark:border-gray-800 p-4">
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Add a comment..."
              maxLength={500}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!commentText.trim() || isSubmitting}
              className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </form>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 text-right">
            {commentText.length}/500
          </p>
        </div>
      </div>
    </div>
  );
};