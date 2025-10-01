import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Post } from '../types';
import PostCard from '../components/PostCard';

const PostDetail = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (postId) {
      fetchPost();
    }
  }, [postId]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      setError('');

      const { data, error: fetchError } = await supabase
        .from('posts')
        .select(`
          *,
          user:profiles(*),
          media:post_media(*)
        `)
        .eq('id', postId)
        .single();

      if (fetchError) throw fetchError;

      setPost(data);
    } catch (err: any) {
      console.error('Error fetching post:', err);
      setError('Post bulunamadı');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="text-6xl mb-4">😕</div>
        <h2 className="text-2xl font-bold mb-2">Post Bulunamadı</h2>
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
        <div className="flex items-center gap-4 max-w-2xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold">Post</h1>
        </div>
      </div>

      {/* Post Content */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        <PostCard
          post={post}
          onPostDeleted={() => navigate('/home')}
          onPostUpdated={() => fetchPost()}
        />
      </div>
    </div>
  );
};

export default PostDetail;