import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import type { Post } from '../types';
import PostCard from '../components/PostCard';

const HashtagFeed = () => {
  const { tag } = useParams<{ tag: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (tag) {
      fetchPosts();
    }
  }, [tag]);

  const fetchPosts = async (pageNum = 1) => {
    if (!user || !tag) return;

    try {
      setLoading(true);
      setError('');

      const POSTS_PER_PAGE = 10;
      const from = (pageNum - 1) * POSTS_PER_PAGE;
      const to = from + POSTS_PER_PAGE - 1;

      // Search for posts containing the hashtag (case insensitive)
      const searchPattern = `%#${tag.toLowerCase()}%`;

      const { data: postsData, error: fetchError } = await supabase
        .from('posts')
        .select(`
          *,
          user:profiles(*),
          media:post_media(*)
        `)
        .ilike('caption', searchPattern)
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
      setPage(1);
    } catch (err: any) {
      console.error('Error fetching hashtag posts:', err);
      setError('Postlar yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const loadMorePosts = async () => {
    if (!user || !tag || loadingMore || !hasMore) return;

    try {
      setLoadingMore(true);
      const nextPage = page + 1;

      const POSTS_PER_PAGE = 10;
      const from = (nextPage - 1) * POSTS_PER_PAGE;
      const to = from + POSTS_PER_PAGE - 1;

      const searchPattern = `%#${tag.toLowerCase()}%`;

      const { data: postsData, error: fetchError } = await supabase
        .from('posts')
        .select(`
          *,
          user:profiles(*),
          media:post_media(*)
        `)
        .ilike('caption', searchPattern)
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

  if (!tag) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Geçersiz hashtag</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              #{tag}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {posts.length} gönderi
            </p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4">
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg">
            {error}
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : posts.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-12 px-4">
          <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Henüz gönderi yok
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-center">
            #{tag} hashtag'i ile henüz gönderi paylaşılmamış
          </p>
        </div>
      ) : (
        /* Posts List */
        <div>
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onPostDeleted={fetchPosts}
              onPostUpdated={fetchPosts}
            />
          ))}

          {/* Load More Indicator */}
          <div ref={observerTarget} className="py-8 flex justify-center">
            {loadingMore && (
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            )}
            {!hasMore && posts.length > 0 && (
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Tüm gönderiler yüklendi
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default HashtagFeed;
