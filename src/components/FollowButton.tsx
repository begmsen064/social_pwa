import { useFollow } from '../hooks/useFollow';
import { useAuthStore } from '../store/authStore';

interface FollowButtonProps {
  userId: string;
  compact?: boolean;
  onFollowChange?: (isFollowing: boolean) => void;
}

export const FollowButton = ({ userId, compact = false, onFollowChange }: FollowButtonProps) => {
  const { user } = useAuthStore();
  const { isFollowing, isLoading, toggleFollow } = useFollow(userId);

  // Don't show button for own profile
  if (!user || user.id === userId) {
    return null;
  }

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent parent click handlers
    const success = await toggleFollow();
    if (success && onFollowChange) {
      onFollowChange(!isFollowing);
    }
  };

  if (compact) {
    return (
      <button
        onClick={handleClick}
        disabled={isLoading}
        className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition disabled:opacity-50 ${
          isFollowing
            ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600'
            : 'bg-primary hover:bg-primary/90 text-white'
        }`}
      >
        {isLoading ? '...' : isFollowing ? 'Takiptesin' : 'Takip Et'}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={`flex-1 py-2 rounded-lg font-semibold transition disabled:opacity-50 ${
        isFollowing
          ? 'border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
          : 'bg-gradient-to-r from-primary to-secondary text-white'
      }`}
    >
      {isLoading ? (
        <div className="flex items-center justify-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-current"></div>
          <span>Yükleniyor...</span>
        </div>
      ) : isFollowing ? (
        'Takip Ediliyor'
      ) : (
        'Takip Et'
      )}
    </button>
  );
};