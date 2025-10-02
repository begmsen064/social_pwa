import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import type { Comment } from '../../hooks/useComments';

interface CommentItemProps {
  comment: Comment;
}

export const CommentItem = ({ comment }: CommentItemProps) => {
  const navigate = useNavigate();
  
  const getAvatarUrl = (avatarUrl: string | null) => {
    if (!avatarUrl) return null;
    const trimmedUrl = avatarUrl.trim();
    if (trimmedUrl.startsWith('http')) return trimmedUrl;
    return `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/avatars/${trimmedUrl}`;
  };

  return (
    <div className="flex gap-3 py-3">
      {/* Avatar */}
      <div 
        className="flex-shrink-0 cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          navigate(`/u/${comment.user.username}`);
        }}
      >
        {comment.user.avatar_url && getAvatarUrl(comment.user.avatar_url) ? (
          <img
            src={getAvatarUrl(comment.user.avatar_url) || ''}
            alt={comment.user.username}
            crossOrigin="anonymous"
            className="w-8 h-8 rounded-full object-cover hover:opacity-75 transition"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center hover:opacity-75 transition">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
              {comment.user.username?.[0]?.toUpperCase() || '?'}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2">
          <span 
            className="font-semibold text-sm text-gray-900 dark:text-white cursor-pointer hover:underline"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/u/${comment.user.username}`);
            }}
          >
            {comment.user.username}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
          </span>
        </div>
        <p className="text-sm text-gray-800 dark:text-gray-200 mt-0.5 break-words">
          {comment.content}
        </p>
      </div>
    </div>
  );
};