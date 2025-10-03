import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Post } from '../../types';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

const AdminPosts = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          user:profiles(*),
          media:post_media(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Bu postu silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) {
      return;
    }

    try {
      setDeleting(postId);

      // Get post media to delete from storage
      const post = posts.find(p => p.id === postId);
      if (post?.media && post.media.length > 0) {
        for (const media of post.media) {
          const filePath = media.media_url.split('/posts/')[1];
          if (filePath) {
            await supabase.storage.from('posts').remove([filePath]);
          }
        }
      }

      // Delete post (cascade will delete media, comments, likes)
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;

      alert('Post silindi');
      fetchPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Post silinirken hata oluştu');
    } finally {
      setDeleting(null);
    }
  };

  const getMediaUrl = (mediaUrl: string) => {
    const trimmedUrl = mediaUrl.trim();
    if (trimmedUrl.startsWith('http')) return trimmedUrl;
    return `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/posts/${trimmedUrl}`;
  };

  const filteredPosts = posts.filter((post) =>
    post.caption?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.user?.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.user?.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen pb-20 bg-gray-50 dark:bg-black">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <button
            onClick={() => navigate('/admin')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold">Post Yönetimi</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Post veya kullanıcı ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Posts List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            {filteredPosts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        Thumbnail
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        Kullanıcı
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        İçerik
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        İstatistik
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        Tarih
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        İşlem
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {filteredPosts.map((post) => (
                      <tr key={post.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                        {/* Thumbnail */}
                        <td className="px-4 py-3">
                          {post.media && post.media[0] ? (
                            <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                              {post.media[0].media_type === 'video' ? (
                                <div className="relative w-full h-full">
                                  <video
                                    src={getMediaUrl(post.media[0].media_url)}
                                    className="w-full h-full object-cover"
                                  />
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                      <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                                    </svg>
                                  </div>
                                </div>
                              ) : (
                                <img
                                  src={getMediaUrl(post.media[0].media_url)}
                                  alt="Post"
                                  crossOrigin="anonymous"
                                  className="w-full h-full object-cover"
                                />
                              )}
                            </div>
                          ) : (
                            <div className="w-16 h-16 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                              <span className="text-gray-400 text-xs">No media</span>
                            </div>
                          )}
                        </td>

                        {/* User */}
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900 dark:text-white">
                            @{post.user?.username}
                          </div>
                          {post.price > 0 && (
                            <span className="inline-block mt-1 px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 text-xs font-medium rounded">
                              💎 {post.price}p
                            </span>
                          )}
                        </td>

                        {/* Content */}
                        <td className="px-4 py-3 max-w-xs">
                          {post.caption ? (
                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                              {post.caption}
                            </p>
                          ) : (
                            <span className="text-sm text-gray-400 italic">Açıklama yok</span>
                          )}
                        </td>

                        {/* Stats */}
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1 text-sm">
                            <span className="text-gray-600 dark:text-gray-400">❤️ {post.likes_count}</span>
                            <span className="text-gray-600 dark:text-gray-400">💬 {post.comments_count}</span>
                          </div>
                        </td>

                        {/* Date */}
                        <td className="px-4 py-3">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: tr })}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleDeletePost(post.id)}
                            disabled={deleting === post.id}
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium transition disabled:opacity-50"
                            title="Postu sil"
                          >
                            {deleting === post.id ? (
                              <>
                                <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                                Siliniyor...
                              </>
                            ) : (
                              <>
                                <Trash2 className="w-4 h-4" />
                                Sil
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">Post bulunamadı</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPosts;
