import { useState, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Post } from '../types';
import MediaCarousel from './MediaCarousel';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useLike } from '../hooks/useLike';
import { CommentsModal } from './comments/CommentsModal';
import { PostMenu } from './PostMenu';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { EditPostModal } from './EditPostModal';
import { ReportModal } from './ReportModal';
import { LikersModal } from './LikersModal';
import { PurchaseModal } from './PurchaseModal';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

interface PostCardProps {
  post: Post;
  onPostDeleted?: () => void;
  onPostUpdated?: () => void;
}

const PostCard = memo(({ post, onPostDeleted, onPostUpdated }: PostCardProps) => {
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);
  const { isLiked, likesCount, isLoading, toggleLike } = useLike(
    post.id,
    post.likes_count || 0,
    post.user_id
  );
  const [showComments, setShowComments] = useState(false);
  const [commentsCount, setCommentsCount] = useState(post.comments_count || 0);
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showLikersModal, setShowLikersModal] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPurchased, setIsPurchased] = useState(post.is_purchased || false);

  const isOwner = currentUser?.id === post.user_id;
  const isPremium = post.price > 0;
  const isLocked = isPremium && !isPurchased && !isOwner;

  const timeAgo = formatDistanceToNow(new Date(post.created_at), {
    addSuffix: true,
    locale: tr,
  });

  // Double tap to like/unlike (animation handled in MediaCarousel)
  const handleDoubleTap = () => {
    toggleLike();
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      // Delete post media from storage
      if (post.media && post.media.length > 0) {
        for (const media of post.media) {
          const filePath = media.media_url.split('/posts/')[1];
          if (filePath) {
            await supabase.storage.from('posts').remove([filePath]);
          }
        }
      }

      // Delete post from database (cascade will delete media, comments, likes)
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', post.id);

      if (error) throw error;

      setShowDeleteModal(false);
      onPostDeleted?.();
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Post silinirken bir hata oluştu.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = async (caption: string, location: string) => {
    try {
      const { error } = await supabase
        .from('posts')
        .update({
          caption: caption || null,
          location: location || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', post.id);

      if (error) throw error;

      onPostUpdated?.();
    } catch (error) {
      console.error('Error updating post:', error);
      throw error;
    }
  };

  const handleReport = async (_reason: string, _description: string) => {
    try {
      // TODO: Create reports table and save to database
      // For now, just show success message
      alert('Rapor gönderildi. Teşekkür ederiz!');
    } catch (error) {
      console.error('Error submitting report:', error);
      throw error;
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/post/${post.id}`;
    const shareText = post.caption ? `${post.caption.substring(0, 100)}...` : 'Bir gönderi paylaşıldı';

    // Check if Web Share API is supported
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${post.user?.username}'nin gönderisi`,
          text: shareText,
          url: shareUrl,
        });
      } catch (error) {
        // User cancelled or error occurred
        if ((error as Error).name !== 'AbortError') {
          console.error('Error sharing:', error);
        }
      }
    } else {
      // Fallback: Copy to clipboard
      try {
        await navigator.clipboard.writeText(shareUrl);
        alert('Link kopyalandı! 📋');
      } catch (error) {
        console.error('Error copying to clipboard:', error);
        // Final fallback: Show link in prompt
        prompt('Link kopyalamak için Ctrl+C / Cmd+C kullanın:', shareUrl);
      }
    }
  };

  const getAvatarUrl = (avatarUrl: string | null) => {
    if (!avatarUrl) return null;
    if (avatarUrl.startsWith('http')) return avatarUrl;
    // Extract timestamp from filename (format: userid-timestamp.ext)
    // This provides natural cache busting as filename changes on each upload
    return `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/avatars/${avatarUrl}`;
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden mb-4">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div 
          className="flex items-center gap-3 cursor-pointer"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            navigate(`/u/${post.user?.username}`);
          }}
        >
          {/* Avatar */}
          {post.user?.avatar_url && getAvatarUrl(post.user.avatar_url) ? (
            <img
              src={getAvatarUrl(post.user.avatar_url) || ''}
              alt={post.user.username}
              loading="lazy"
              decoding="async"
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold">
              {post.user?.full_name?.charAt(0).toUpperCase() || 'U'}
            </div>
          )}

          <div>
            <p className="font-semibold text-gray-900 dark:text-gray-100 hover:underline">
              {post.user?.full_name || 'Unknown User'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 hover:underline">
              @{post.user?.username} • {timeAgo}
            </p>
          </div>
        </div>

        {/* Menu Button */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>

          <PostMenu
            isOpen={showMenu}
            onClose={() => setShowMenu(false)}
            isOwner={isOwner}
            onDelete={() => setShowDeleteModal(true)}
            onEdit={() => setShowEditModal(true)}
            onReport={() => setShowReportModal(true)}
          />
        </div>
      </div>

      {/* Media Carousel */}
      {post.media && post.media.length > 0 && (
        <div className="relative overflow-hidden bg-black">
          {/* Blur effect for locked premium content */}
          <div className={isLocked ? 'filter blur-xl scale-110' : ''}>
            <MediaCarousel 
              media={post.media} 
              onDoubleTap={isLocked ? undefined : handleDoubleTap}
              isLiked={isLiked}
            />
          </div>
          
          {/* Premium Lock Overlay */}
          {isLocked && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm">
              <div className="text-center px-6">
                <div className="mb-4">
                  <div className="w-20 h-20 mx-auto bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center shadow-2xl">
                    <span className="text-4xl">💎</span>
                  </div>
                </div>
                <h3 className="text-white text-xl font-bold mb-2">
                  Premium İçerik
                </h3>
                <p className="text-white text-sm mb-4 opacity-90">
                  Bu içeriği görüntülemek için {post.price} puan gerekiyor
                </p>
                <button
                  onClick={() => setShowPurchaseModal(true)}
                  className="px-6 py-3 bg-white text-gray-900 rounded-lg font-bold hover:shadow-2xl transition-all transform hover:scale-105"
                >
                  🔓 İçeriği Aç ({post.price} Puan)
                </button>
              </div>
            </div>
          )}
          
        </div>
      )}

      {/* Actions */}
      <div className="p-4">
        <div className="flex items-center gap-4 mb-3">
          <div className="flex items-center gap-1">
            {/* Like Button */}
            <button
              onClick={toggleLike}
              disabled={isLoading}
              className={`flex items-center transition group ${
                isLiked ? 'text-primary' : 'hover:text-primary'
              } disabled:opacity-50`}
            >
              <svg
                className={`w-6 h-6 group-hover:scale-110 transition-transform ${
                  isLiked ? 'fill-current' : ''
                }`}
                fill={isLiked ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </button>
            
            {/* Likes Count - Clickable */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowLikersModal(true);
              }}
              className="text-sm font-semibold hover:text-primary transition"
            >
              {likesCount}
            </button>
          </div>

          {/* Comment Button */}
          <button
            onClick={() => setShowComments(true)}
            className="flex items-center gap-2 hover:text-blue-500 transition group"
          >
            <svg
              className="w-6 h-6 group-hover:scale-110 transition-transform"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <span className="text-sm font-semibold">{commentsCount}</span>
          </button>

          {/* Share Button */}
          <button
            onClick={handleShare}
            className="flex items-center gap-2 hover:text-green-500 transition group ml-auto"
          >
            <svg
              className="w-6 h-6 group-hover:scale-110 transition-transform"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
              />
            </svg>
          </button>
        </div>

        {/* Caption */}
        {post.caption && (
          <div className="mb-2">
            <p className="text-sm text-gray-900 dark:text-gray-100">
              <span 
                className="font-semibold mr-2 cursor-pointer hover:underline"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  navigate(`/u/${post.user?.username}`);
                }}
              >
                {post.user?.username}
              </span>
              {post.caption}
            </p>
          </div>
        )}

        {/* Location */}
        {post.location && (
          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span>{post.location}</span>
          </div>
        )}
      </div>

      {/* Comments Modal */}
      <CommentsModal
        isOpen={showComments}
        onClose={() => setShowComments(false)}
        postId={post.id}
        onCommentAdded={() => setCommentsCount((prev) => prev + 1)}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />

      {/* Edit Post Modal */}
      <EditPostModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={handleEdit}
        initialCaption={post.caption || ''}
        initialLocation={post.location || ''}
      />

      {/* Report Modal */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        onSubmit={handleReport}
      />

      {/* Likers Modal */}
      <LikersModal
        isOpen={showLikersModal}
        onClose={() => setShowLikersModal(false)}
        postId={post.id}
      />

      {/* Purchase Modal */}
      {isPremium && (
        <PurchaseModal
          isOpen={showPurchaseModal}
          onClose={() => setShowPurchaseModal(false)}
          postId={post.id}
          sellerId={post.user_id}
          sellerName={post.user?.full_name || post.user?.username || 'Kullanıcı'}
          price={post.price}
          onPurchaseSuccess={() => {
            setIsPurchased(true);
            setShowPurchaseModal(false);
          }}
        />
      )}
    </div>
  );
});

export default PostCard;

// Display name for debugging
PostCard.displayName = 'PostCard';
