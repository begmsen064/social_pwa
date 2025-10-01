import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface Liker {
  id: string;
  user: {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string | null;
  };
}

interface LikersModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
}

export const LikersModal = ({ isOpen, onClose, postId }: LikersModalProps) => {
  const navigate = useNavigate();
  const [likers, setLikers] = useState<Liker[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchLikers();
    }
  }, [isOpen, postId]);

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

  const fetchLikers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('likes')
        .select(`
          id,
          profiles:user_id (
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .eq('post_id', postId)
        .eq('type', 'like')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform data
      const transformedData = (data || []).map(item => ({
        id: item.id,
        user: Array.isArray(item.profiles) ? item.profiles[0] : item.profiles
      })).filter(item => item.user) as Liker[];

      setLikers(transformedData);
    } catch (error) {
      console.error('Error fetching likers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserClick = (username: string) => {
    navigate(`/u/${username}`);
    onClose();
  };

  const getAvatarUrl = (avatarUrl: string | null) => {
    if (!avatarUrl) return null;
    if (avatarUrl.startsWith('http')) return avatarUrl;
    return `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/avatars/${avatarUrl}`;
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
      <div className="relative w-full sm:max-w-md bg-white dark:bg-gray-900 sm:rounded-2xl rounded-t-2xl flex flex-col max-h-[80vh] sm:shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Beğenenler
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Likers List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 dark:border-gray-700 border-t-blue-500" />
            </div>
          ) : likers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Henüz beğeni yok
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {likers.map((liker) => (
                <div
                  key={liker.id}
                  onClick={() => handleUserClick(liker.user.username)}
                  className="flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition"
                >
                  {/* Avatar */}
                  {liker.user.avatar_url && getAvatarUrl(liker.user.avatar_url) ? (
                    <img
                      src={getAvatarUrl(liker.user.avatar_url) || ''}
                      alt={liker.user.username}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold">
                      {liker.user.full_name?.[0]?.toUpperCase() || liker.user.username[0]?.toUpperCase()}
                    </div>
                  )}

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white truncate">
                      {liker.user.full_name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      @{liker.user.username}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};