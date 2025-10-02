import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, TrendingUp, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { FollowButton } from '../components/FollowButton';
import type { Post } from '../types';

interface Profile {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  followers_count?: number;
}

const Explore = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'posts' | 'users'>('posts');
  const [searchQuery, setSearchQuery] = useState('');
  const [trendingPosts, setTrendingPosts] = useState<Post[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<Profile[]>([]);
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    fetchTrendingData();
  }, []);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchQuery.trim()) {
        searchUsers();
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const fetchTrendingData = async () => {
    try {
      setLoading(true);

      // Fetch trending posts (most liked in last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: postsData } = await supabase
        .from('posts')
        .select(`
          *,
          user:profiles(*),
          media:post_media(*)
        `)
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('likes_count', { ascending: false })
        .limit(20);

      setTrendingPosts(postsData || []);

      // Fetch suggested users (users with most followers, excluding current user)
      const { data: usersData } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', user?.id || '')
        .order('total_points', { ascending: false })
        .limit(10);

      // Get followers count for each user
      if (usersData) {
        const usersWithFollowers = await Promise.all(
          usersData.map(async (user) => {
            const { count } = await supabase
              .from('follows')
              .select('*', { count: 'exact', head: true })
              .eq('following_id', user.id);
            return { ...user, followers_count: count || 0 };
          })
        );
        setSuggestedUsers(usersWithFollowers);
      }
    } catch (error) {
      console.error('Error fetching trending data:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async () => {
    try {
      setSearching(true);
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', user?.id || '')
        .or(`username.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%`)
        .limit(20);

      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setSearching(false);
    }
  };

  const getAvatarUrl = (avatarUrl: string | null) => {
    if (!avatarUrl) return null;
    if (avatarUrl.startsWith('http')) return avatarUrl;
    return `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/avatars/${avatarUrl}`;
  };

  const getMediaUrl = (mediaUrl: string) => {
    if (mediaUrl.startsWith('http')) return mediaUrl;
    return `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/posts/${mediaUrl}`;
  };

  return (
    <div className="min-h-screen pb-20 bg-gray-50 dark:bg-black">
      {/* Header with Search */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-xl font-bold mb-3">Keşfet</h1>
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Kullanıcı ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-gray-800 border-none rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            />
            {searching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-primary"></div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4">
        {/* Search Results */}
        {searchQuery.trim() && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Search className="w-5 h-5" />
              Arama Sonuçları
            </h2>
            {searchResults.length > 0 ? (
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                {searchResults.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition border-b border-gray-100 dark:border-gray-800 last:border-b-0"
                  >
                    <div
                      onClick={() => navigate(`/u/${user.username}`)}
                      className="flex items-center gap-3 flex-1 cursor-pointer min-w-0"
                    >
                      {user.avatar_url && getAvatarUrl(user.avatar_url) ? (
                        <img
                          src={getAvatarUrl(user.avatar_url) || ''}
                          alt={user.username}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold">
                          {user.username[0]?.toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{user.full_name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">@{user.username}</p>
                      </div>
                    </div>
                    <FollowButton userId={user.id} compact />
                  </div>
                ))}
              </div>
            ) : !searching ? (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">Sonuç bulunamadı</p>
            ) : null}
          </div>
        )}

        {/* Tabs */}
        {!searchQuery.trim() && (
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setActiveTab('posts')}
              className={`flex-1 py-2.5 px-4 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
                activeTab === 'posts'
                  ? 'bg-gradient-to-r from-primary to-secondary text-white'
                  : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              Trend Postlar
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`flex-1 py-2.5 px-4 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
                activeTab === 'users'
                  ? 'bg-gradient-to-r from-primary to-secondary text-white'
                  : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800'
              }`}
            >
              <Users className="w-4 h-4" />
              Önerilen
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        )}

        {/* Trending Posts Tab */}
        {!loading && !searchQuery.trim() && activeTab === 'posts' && (
          <div>
            {trendingPosts.length > 0 ? (
              <div className="grid grid-cols-3 gap-1">
                {trendingPosts.map((post) => (
                  <div
                    key={post.id}
                    onClick={() => navigate(`/post/${post.id}`)}
                    className="aspect-square bg-gray-200 dark:bg-gray-800 cursor-pointer hover:opacity-75 transition relative group"
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
                    {/* Overlay with likes count */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition flex items-center gap-2 text-white font-semibold">
                        <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                          <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                        </svg>
                        <span>{post.likes_count || 0}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔥</div>
                <p className="text-gray-500 dark:text-gray-400">Henüz trend post yok</p>
              </div>
            )}
          </div>
        )}

        {/* Suggested Users Tab */}
        {!loading && !searchQuery.trim() && activeTab === 'users' && (
          <div>
            {suggestedUsers.length > 0 ? (
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                {suggestedUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition border-b border-gray-100 dark:border-gray-800 last:border-b-0"
                  >
                    <div
                      onClick={() => navigate(`/u/${user.username}`)}
                      className="flex items-center gap-3 flex-1 cursor-pointer min-w-0"
                    >
                      {user.avatar_url && getAvatarUrl(user.avatar_url) ? (
                        <img
                          src={getAvatarUrl(user.avatar_url) || ''}
                          alt={user.username}
                          className="w-14 h-14 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-xl font-bold">
                          {user.username[0]?.toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{user.full_name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">@{user.username}</p>
                        {user.bio && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">{user.bio}</p>
                        )}
                      </div>
                    </div>
                    <FollowButton userId={user.id} compact />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">👥</div>
                <p className="text-gray-500 dark:text-gray-400">Önerilen kullanıcı bulunamadı</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Explore;
