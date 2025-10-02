import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Settings } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { useFollow } from '../hooks/useFollow';
import type { Post } from '../types';
import { getLevelInfo, getProgress, getPointsToNextLevel } from '../utils/levelSystem';

interface UserProfile {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  total_points: number;
  created_at: string;
}

interface UserStats {
  postsCount: number;
  followersCount: number;
  followingCount: number;
}

const UserProfile = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats>({ postsCount: 0, followersCount: 0, followingCount: 0 });
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'posts' | 'liked'>('posts');

  const isOwnProfile = currentUser?.username === username;
  const { isFollowing, isLoading: isFollowLoading, toggleFollow } = useFollow(profile?.id || null);

  useEffect(() => {
    if (username) {
      fetchUserData();
    }
  }, [username]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single();

      if (profileError) throw profileError;
      if (!profileData) throw new Error('Profile not found');
      setProfile(profileData);

      // Fetch user posts count
      const { count: postsCount } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profileData.id);

      // Fetch followers count
      const { count: followersCount } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', profileData.id);

      // Fetch following count
      const { count: followingCount } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', profileData.id);

      setStats({
        postsCount: postsCount || 0,
        followersCount: followersCount || 0,
        followingCount: followingCount || 0,
      });

      // Fetch user posts with media
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select(`
          *,
          user:profiles(*),
          media:post_media(*)
        `)
        .eq('user_id', profileData.id)
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;
      setPosts(postsData || []);

    } catch (err: any) {
      console.error('Error fetching user data:', err);
      setError('Kullanıcı bulunamadı');
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    const success = await toggleFollow();
    if (success) {
      // Update follower count locally
      setStats((prev) => ({
        ...prev,
        followersCount: isFollowing
          ? Math.max(0, prev.followersCount - 1)
          : prev.followersCount + 1,
      }));
    }
  };

  const getAvatarUrl = (avatarUrl: string | null) => {
    if (!avatarUrl) return null;
    const trimmedUrl = avatarUrl.trim();
    if (trimmedUrl.startsWith('http')) return trimmedUrl;
    return `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/avatars/${trimmedUrl}`;
  };

  const getMediaUrl = (mediaUrl: string) => {
    const trimmedUrl = mediaUrl.trim();
    if (trimmedUrl.startsWith('http')) return trimmedUrl;
    return `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/posts/${trimmedUrl}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="text-6xl mb-4">😕</div>
        <h2 className="text-2xl font-bold mb-2">Kullanıcı Bulunamadı</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-4">{error}</p>
        <button
          onClick={() => navigate('/home')}
          className="px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-lg font-semibold"
        >
          Ana Sayfaya Dön
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold">{profile.username}</h1>
          {isOwnProfile && (
            <button
              onClick={() => navigate('/profile/edit')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition"
            >
              <Settings className="w-5 h-5" />
            </button>
          )}
          {!isOwnProfile && <div className="w-9" />}
        </div>
      </div>

      {/* Profile Info */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-start gap-4 mb-6">
          {/* Avatar */}
          {profile.avatar_url && getAvatarUrl(profile.avatar_url) ? (
            <img
              src={getAvatarUrl(profile.avatar_url) || ''}
              alt={profile.username}
              crossOrigin="anonymous"
              className="w-20 h-20 rounded-full object-cover"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-2xl font-bold">
              {profile.username[0]?.toUpperCase() || '?'}
            </div>
          )}

          {/* Stats */}
          <div className="flex-1">
            <div className="flex items-center justify-around text-center">
              <div>
                <div className="text-xl font-bold">{stats.postsCount}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Posts</div>
              </div>
              <div>
                <div className="text-xl font-bold">{stats.followersCount}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Followers</div>
              </div>
              <div>
                <div className="text-xl font-bold">{stats.followingCount}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Following</div>
              </div>
              <div>
                <div className="text-xl font-bold">{profile.total_points}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Points</div>
              </div>
            </div>
          </div>
        </div>

        {/* Name & Bio */}
        <div className="mb-4">
          <h2 className="font-semibold text-gray-900 dark:text-white">{profile.full_name}</h2>
          {profile.bio && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{profile.bio}</p>
          )}
        </div>

        {/* Level Progress Bar */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{getLevelInfo(profile.total_points).badge}</span>
              <div>
                <div className="text-sm font-bold text-gray-900 dark:text-white">
                  {getLevelInfo(profile.total_points).name}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Level {getLevelInfo(profile.total_points).level}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {getPointsToNextLevel(profile.total_points) > 0 ? (
                  <>
                    <span className="font-semibold text-primary">{getPointsToNextLevel(profile.total_points)}</span> puan kaldı
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
                width: `${getProgress(profile.total_points)}%`,
              }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
            </div>
          </div>
          
          <div className="flex justify-between items-center mt-1.5">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {getLevelInfo(profile.total_points).minPoints}
            </span>
            <span className="text-xs font-semibold text-primary">
              {Math.round(getProgress(profile.total_points))}%
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {getLevelInfo(profile.total_points).maxPoints === Infinity ? '∞' : getLevelInfo(profile.total_points).maxPoints}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        {isOwnProfile ? (
          <button
            onClick={() => navigate('/profile/edit')}
            className="w-full py-2 border border-gray-300 dark:border-gray-700 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition"
          >
            Edit Profile
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleFollowToggle}
              disabled={isFollowLoading}
              className={`flex-1 py-2 rounded-lg font-semibold transition disabled:opacity-50 ${
                isFollowing
                  ? 'border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                  : 'bg-gradient-to-r from-primary to-secondary text-white'
              }`}
            >
              {isFollowLoading ? (
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
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/messages/${profile.id}`);
              }}
              className="flex-1 py-2 border border-gray-300 dark:border-gray-700 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition"
            >
              Mesaj
            </button>
          </div>
        )}
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
        {activeTab === 'posts' && (
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
                        crossOrigin="anonymous"
                        className="w-full h-full object-cover"
                      />
                    )
                  )}
                </div>
              ))
            ) : (
              <div className="col-span-3 text-center py-12">
                <div className="text-6xl mb-4">📸</div>
                <p className="text-gray-500 dark:text-gray-400">No posts yet</p>
              </div>
            )}
          </div>
        )}
        {activeTab === 'liked' && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">❤️</div>
            <p className="text-gray-500 dark:text-gray-400">Liked posts will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;