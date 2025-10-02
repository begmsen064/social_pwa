import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { supabase } from '../lib/supabase';
import type { Post } from '../types';
import PostCard from '../components/PostCard';

const Home = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [filter, setFilter] = useState<'all' | 'following'>('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const observerTarget = useRef<HTMLDivElement>(null);

  // Manual refresh function
  const handleRefresh = async () => {
    // Scroll to top smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Reset state
    setPage(1);
    setHasMore(true);
    setPosts([]);
    
    // Fetch fresh data
    await fetchPosts(false, 1);
    
    if (user) {
      // Refresh profile to get updated points
      await refreshUser();
      await fetchUnreadNotifications();
      await fetchUnreadMessages();
    }
  };

  // Listen for refresh event from BottomNav
  useEffect(() => {
    const handleHomeRefreshEvent = () => {
      handleRefresh();
    };
    
    window.addEventListener('refreshHome', handleHomeRefreshEvent);
    
    return () => {
      window.removeEventListener('refreshHome', handleHomeRefreshEvent);
    };
  }, [user]);

  useEffect(() => {
    // Reset pagination when filter changes
    setPage(1);
    setHasMore(true);
    setPosts([]);
    fetchPosts(false, 1);
    if (user) {
      fetchUnreadNotifications();
      fetchUnreadMessages();
    }
  }, [user, filter]); // Re-fetch when filter changes

  // Keep session alive and refresh data periodically
  useEffect(() => {
    if (!user) return;

    // Refresh session every 5 minutes
    const sessionInterval = setInterval(async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error refreshing session:', error);
          return;
        }
        if (!session) {
          // Session expired, redirect to login
          navigate('/login');
        }
      } catch (err) {
        console.error('Session refresh error:', err);
      }
    }, 5 * 60 * 1000); // 5 minutes

    // Refresh feed data every 30 seconds
    const dataInterval = setInterval(() => {
      fetchPosts(true, 1); // Skip loading indicator
      fetchUnreadNotifications();
      fetchUnreadMessages();
    }, 30 * 1000); // 30 seconds

    return () => {
      clearInterval(sessionInterval);
      clearInterval(dataInterval);
    };
  }, [user, navigate]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          loadMorePosts();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loading, loadingMore, page]);

  const fetchPosts = async (skipLoading = false, pageNum = 1) => {
    if (!user) return;
    
    try {
      if (!skipLoading) {
        setLoading(true);
      }
      setError('');

      const POSTS_PER_PAGE = 10;
      const from = (pageNum - 1) * POSTS_PER_PAGE;
      const to = from + POSTS_PER_PAGE - 1;

      let query = supabase
        .from('posts')
        .select(`
          *,
          user:profiles(*),
          media:post_media(*)
        `);

      // If filter is 'following', only show posts from users we follow
      if (filter === 'following') {
        // Get list of users I follow
        const { data: followingData } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', user.id);

        const followingIds = followingData?.map(f => f.following_id) || [];
        
        // Include my own posts too
        followingIds.push(user.id);

        if (followingIds.length > 0) {
          query = query.in('user_id', followingIds);
        } else {
          // If not following anyone, just show own posts
          query = query.eq('user_id', user.id);
        }
      }

      // Fetch posts
      const { data: postsData, error: fetchError } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (fetchError) throw fetchError;

      // Check which premium posts the user has purchased
      const postIds = postsData?.map(p => p.id) || [];
      let purchasedPostIds: string[] = [];

      if (postIds.length > 0) {
        const { data: purchasesData } = await supabase
          .from('post_purchases')
          .select('post_id')
          .in('post_id', postIds)
          .eq('buyer_id', user.id);

        purchasedPostIds = purchasesData?.map(p => p.post_id) || [];
      }

      // Add is_purchased flag to posts
      const newPosts = postsData?.map(post => ({
        ...post,
        is_purchased: purchasedPostIds.includes(post.id),
      })) || [];
      
      // If we got less than expected, no more posts
      if (newPosts.length < POSTS_PER_PAGE) {
        setHasMore(false);
      }

      setPosts(newPosts);
    } catch (err: any) {
      console.error('Error fetching posts:', err);
      setError('Postlar yüklenirken bir hata oluştu');
    } finally {
      if (!skipLoading) {
        setLoading(false);
      }
    }
  };

  const loadMorePosts = async () => {
    if (!user || loadingMore || !hasMore) return;

    try {
      setLoadingMore(true);
      const nextPage = page + 1;

      const POSTS_PER_PAGE = 10;
      const from = (nextPage - 1) * POSTS_PER_PAGE;
      const to = from + POSTS_PER_PAGE - 1;

      let query = supabase
        .from('posts')
        .select(`
          *,
          user:profiles(*),
          media:post_media(*)
        `);

      // Apply same filter
      if (filter === 'following') {
        const { data: followingData } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', user.id);

        const followingIds = followingData?.map(f => f.following_id) || [];
        followingIds.push(user.id);

        if (followingIds.length > 0) {
          query = query.in('user_id', followingIds);
        } else {
          query = query.eq('user_id', user.id);
        }
      }

      const { data: postsData, error: fetchError } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (fetchError) throw fetchError;

      // Check which premium posts the user has purchased
      const postIds = postsData?.map(p => p.id) || [];
      let purchasedPostIds: string[] = [];

      if (postIds.length > 0) {
        const { data: purchasesData } = await supabase
          .from('post_purchases')
          .select('post_id')
          .in('post_id', postIds)
          .eq('buyer_id', user.id);

        purchasedPostIds = purchasesData?.map(p => p.post_id) || [];
      }

      // Add is_purchased flag to posts
      const newPosts = postsData?.map(post => ({
        ...post,
        is_purchased: purchasedPostIds.includes(post.id),
      })) || [];
      
      if (newPosts.length < POSTS_PER_PAGE) {
        setHasMore(false);
      }

      if (newPosts.length > 0) {
        setPosts((prev) => [...prev, ...newPosts]);
        setPage(nextPage);
      } else {
        setHasMore(false);
      }
    } catch (err: any) {
      console.error('Error loading more posts:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  const fetchUnreadNotifications = async () => {
    if (!user) return;

    try {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      setUnreadCount(count || 0);
    } catch (error) {
      console.error('Error fetching unread notifications:', error);
    }
  };

  const fetchUnreadMessages = async () => {
    if (!user) return;

    try {
      // Assuming you have a messages table with is_read and receiver_id columns
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .eq('is_read', false);

      setUnreadMessagesCount(count || 0);
    } catch (error) {
      console.error('Error fetching unread messages:', error);
      // If messages table doesn't exist yet, silently fail
      setUnreadMessagesCount(0);
    }
  };


  return (
    <div 
      ref={containerRef}
      className="min-h-screen overflow-y-auto"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200 dark:border-gray-800">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Social PWA
        </h1>
        <div className="flex items-center gap-2">
          {/* Messages */}
          <button
            onClick={() => navigate('/messages')}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition relative"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {unreadMessagesCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            )}
          </button>
          {/* Notifications */}
          <button
            onClick={() => navigate('/notifications')}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition relative"
          >
            <Bell className="w-6 h-6" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            )}
          </button>
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            {theme === 'dark' ? (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Welcome Card */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-4">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
          Hoş geldin
        </p>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
          {user?.full_name}
        </h2>
        <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-primary/10 to-secondary/10 dark:from-primary/20 dark:to-secondary/20 rounded-lg px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🏆</span>
            <span className="text-sm text-gray-600 dark:text-gray-400">Toplam Puan</span>
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            {user?.total_points}
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 px-4 py-4 bg-gray-50 dark:bg-gray-950">
        <button
          onClick={() => setFilter('all')}
          className={`flex-1 py-2.5 rounded-lg font-semibold transition ${
            filter === 'all'
              ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-md'
              : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800'
          }`}
        >
          Tüm Postlar
        </button>
        <button
          onClick={() => setFilter('following')}
          className={`flex-1 py-2.5 rounded-lg font-semibold transition ${
            filter === 'following'
              ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-md'
              : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800'
          }`}
        >
          Takip Ettiklerim
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* Posts Feed */}
      {!loading && !error && (
        <div>
          {posts.length > 0 ? (
            <>
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onPostDeleted={() => fetchPosts()}
                  onPostUpdated={() => fetchPosts()}
                />
              ))}
              
              {/* Infinite Scroll Observer Target */}
              <div ref={observerTarget} className="h-20 flex items-center justify-center">
                {loadingMore && (
                  <div className="flex flex-col items-center gap-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Daha fazla post yüklenyor...</p>
                  </div>
                )}
                {!hasMore && posts.length > 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Tüm postlar yüklendi ✨
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="bg-white dark:bg-gray-900 rounded-xl p-12 border border-gray-200 dark:border-gray-800 text-center">
              <div className="text-6xl mb-4">📸</div>
              <h3 className="text-xl font-bold mb-2">Henüz post yok</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                İlk postu sen paylaş!
              </p>
              <a
                href="/post/new"
                className="inline-block px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-lg font-semibold hover:shadow-lg transition-all"
              >
                Yeni Post Paylaş
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Home;
