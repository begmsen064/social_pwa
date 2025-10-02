import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, LogOut } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import type { Post } from '../types';
import { getLevelInfo, getProgress, getPointsToNextLevel } from '../utils/levelSystem';

interface UserStats {
  postsCount: number;
  followersCount: number;
  followingCount: number;
}

const Profile = () => {
  const { user, signOut } = useAuthStore();
  const navigate = useNavigate();
  const [stats, setStats] = useState<UserStats>({ postsCount: 0, followersCount: 0, followingCount: 0 });
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'posts' | 'liked'>('posts');
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch user posts count
      const { count: postsCount } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Fetch followers count
      const { count: followersCount } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', user.id);

      // Fetch following count
      const { count: followingCount } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', user.id);

      setStats({
        postsCount: postsCount || 0,
        followersCount: followersCount || 0,
        followingCount: followingCount || 0,
      });

      // Fetch user posts with media
      const { data: postsData } = await supabase
        .from('posts')
        .select(`
          *,
          user:profiles(*),
          media:post_media(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setPosts(postsData || []);
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const getAvatarUrl = (avatarUrl: string | null) => {
    if (!avatarUrl) return null;
    if (avatarUrl.startsWith('http')) return avatarUrl;
    // Avatar filename includes timestamp (userid-timestamp.ext) which naturally busts cache
    return `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/avatars/${avatarUrl}`;
  };

  const getMediaUrl = (mediaUrl: string) => {
    if (mediaUrl.startsWith('http')) return mediaUrl;
    return `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/posts/${mediaUrl}`;
  };

  if (!user) return null;

  return (
    <div className="min-h-screen pb-20 bg-gray-50 dark:bg-black">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <h1 className="text-lg font-semibold">{user.username}</h1>
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/profile/edit')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button
              onClick={handleSignOut}
              className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition text-red-600"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Cover Photo & Profile Info */}
      <div className="max-w-2xl mx-auto bg-white dark:bg-gray-900 overflow-hidden">
        {/* Cover Photo */}
        <div className="relative h-48 bg-gradient-to-br from-primary via-purple-500 to-secondary overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
        </div>

        {/* Avatar (overlapping cover) */}
        <div className="px-4">
          <div className="relative -mt-16 mb-4">
            <div 
              onClick={() => setShowAvatarModal(true)} 
              className="cursor-pointer w-32 h-32 rounded-full border-4 border-white dark:border-gray-900 bg-white dark:bg-gray-900 overflow-hidden hover:opacity-90 transition"
            >
              {user.avatar_url && getAvatarUrl(user.avatar_url) ? (
                <img
                  src={getAvatarUrl(user.avatar_url) || ''}
                  alt={user.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-4xl font-bold">
                  {user.username[0]?.toUpperCase() || '?'}
                </div>
              )}
            </div>
          </div>

          {/* Name & Bio */}
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{user.full_name}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">@{user.username}</p>
            {user.bio && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{user.bio}</p>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.postsCount}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Posts</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.followersCount}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Followers</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.followingCount}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Following</div>
            </div>
            <div className="bg-gradient-to-br from-primary/10 to-secondary/10 dark:from-primary/20 dark:to-secondary/20 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">{user.total_points}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Points</div>
            </div>
          </div>

          {/* Level Progress Bar */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{getLevelInfo(user.total_points).badge}</span>
                <div>
                  <div className="text-sm font-bold text-gray-900 dark:text-white">
                    {getLevelInfo(user.total_points).name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Level {getLevelInfo(user.total_points).level}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {getPointsToNextLevel(user.total_points) > 0 ? (
                    <>
                      <span className="font-semibold text-primary">{getPointsToNextLevel(user.total_points)}</span> puan kaldı
                    </>
                  ) : (
                    <span className="font-semibold text-green-500">Max Level! ✨</span>
                  )}
                </div>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="relative w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-500 ease-out"
                style={{ 
                  width: `${getProgress(user.total_points)}%`,
                }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
              </div>
            </div>
            
            <div className="flex justify-between items-center mt-1.5">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {getLevelInfo(user.total_points).minPoints}
              </span>
              <span className="text-xs font-semibold text-primary">
                {Math.round(getProgress(user.total_points))}%
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {getLevelInfo(user.total_points).maxPoints === Infinity ? '∞' : getLevelInfo(user.total_points).maxPoints}
              </span>
            </div>
          </div>

          {/* Edit Profile Button */}
          <button
            onClick={() => navigate('/profile/edit')}
            className="w-full py-2.5 mb-4 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg font-semibold transition"
          >
            Edit Profile
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-2xl mx-auto flex">
          <button
            onClick={() => setActiveTab('posts')}
            className={`flex-1 py-3 text-center font-semibold border-t-2 transition ${
              activeTab === 'posts'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 dark:text-gray-400'
            }`}
          >
            <svg className="w-6 h-6 mx-auto" fill="currentColor" viewBox="0 0 24 24">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
            </svg>
          </button>
          <button
            onClick={() => setActiveTab('liked')}
            className={`flex-1 py-3 text-center font-semibold border-t-2 transition ${
              activeTab === 'liked'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 dark:text-gray-400'
            }`}
          >
            <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Posts Grid */}
      <div className="max-w-2xl mx-auto px-4 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : activeTab === 'posts' ? (
          <div className="grid grid-cols-3 gap-1">
            {posts.length > 0 ? (
              posts.map((post) => (
                <div
                  key={post.id}
                  onClick={() => navigate(`/post/${post.id}`)}
                  className="aspect-square bg-gray-200 dark:bg-gray-800 cursor-pointer hover:opacity-75 transition"
                >
                  {post.media && post.media[0] && (
                    post.media[0].media_type === 'video' ? (
                      <video
                        src={getMediaUrl(post.media[0].media_url)}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img
                        src={getMediaUrl(post.media[0].media_url)}
                        alt="Post"
                        className="w-full h-full object-cover"
                      />
                    )
                  )}
                </div>
              ))
            ) : (
              <div className="col-span-3 text-center py-12">
                <div className="text-6xl mb-4">📸</div>
                <p className="text-gray-500 dark:text-gray-400 mb-4">Henüz post yok</p>
                <button
                  onClick={() => navigate('/post/new')}
                  className="px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-lg font-semibold"
                >
                  İlk Postunu Paylaş
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">❤️</div>
            <p className="text-gray-500 dark:text-gray-400">Beğenilen postlar burada görünecek</p>
          </div>
        )}
      </div>

      {/* Avatar Modal */}
      {showAvatarModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
          onClick={() => setShowAvatarModal(false)}
        >
          <div className="relative w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            {/* Close Button */}
            <button
              onClick={() => setShowAvatarModal(false)}
              className="absolute -top-12 right-0 p-2 text-white hover:text-gray-300 transition"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Avatar Image */}
            <div className="aspect-square bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-2xl">
              {user.avatar_url && getAvatarUrl(user.avatar_url) ? (
                <img
                  src={getAvatarUrl(user.avatar_url) || ''}
                  alt={user.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-9xl font-bold">
                  {user.username[0]?.toUpperCase() || '?'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
