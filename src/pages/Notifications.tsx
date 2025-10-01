import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, UserPlus, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

interface Notification {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'mention' | 'purchase';
  post_id: string | null;
  comment_id: string | null;
  is_read: boolean;
  created_at: string;
  actor: {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string | null;
  };
  post?: {
    id: string;
    media: {
      media_url: string;
      media_type: string;
    }[];
  };
}

const Notifications = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    if (user) {
      fetchNotifications();
      subscribeToNotifications();
    }
  }, [user, filter]);

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      setLoading(true);

      let query = supabase
        .from('notifications')
        .select(`
          *,
          actor:actor_id(id, username, full_name, avatar_url),
          post:post_id(id, media:post_media(media_url, media_type))
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (filter === 'unread') {
        query = query.eq('is_read', false);
      }

      const { data, error } = await query;

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToNotifications = () => {
    if (!user) return;

    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await supabase.from('notifications').delete().eq('id', notificationId);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }

    // Navigate based on type
    if (notification.type === 'follow') {
      navigate(`/u/${notification.actor.username}`);
    } else if (notification.post_id) {
      navigate(`/post/${notification.post_id}`);
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

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="w-8 h-8 text-red-500 fill-current" />;
      case 'comment':
        return <MessageCircle className="w-8 h-8 text-blue-500" />;
      case 'follow':
        return <UserPlus className="w-8 h-8 text-green-500" />;
      case 'purchase':
        return <span className="text-3xl">💎</span>;
      default:
        return <Heart className="w-8 h-8 text-gray-500" />;
    }
  };

  const getNotificationText = (notification: Notification) => {
    switch (notification.type) {
      case 'like':
        return 'postunu beğendi';
      case 'comment':
        return 'postuna yorum yaptı';
      case 'follow':
        return 'seni takip etmeye başladı';
      case 'purchase':
        return 'premium içeriğini satın aldı';
      default:
        return 'bir işlem yaptı';
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="min-h-screen pb-20 bg-gray-50 dark:bg-black">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold">Bildirimler</h1>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-primary hover:text-secondary font-semibold transition"
              >
                Tümünü Okundu İşaretle
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition ${
                filter === 'all'
                  ? 'bg-gradient-to-r from-primary to-secondary text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              Tümü
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition flex items-center gap-2 ${
                filter === 'unread'
                  ? 'bg-gradient-to-r from-primary to-secondary text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              Okunmamış
              {unreadCount > 0 && (
                <span className="bg-white bg-opacity-30 px-2 py-0.5 rounded-full text-xs">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-w-2xl mx-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : notifications.length > 0 ? (
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`flex items-start gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-900 transition cursor-pointer group ${
                  !notification.is_read ? 'bg-blue-50 dark:bg-blue-900/10' : 'bg-white dark:bg-black'
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                {/* Notification Icon */}
                <div className="flex-shrink-0 pt-1">
                  {getNotificationIcon(notification.type)}
                </div>

                {/* Avatar */}
                <div
                  className="flex-shrink-0 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/u/${notification.actor.username}`);
                  }}
                >
                  {notification.actor.avatar_url && getAvatarUrl(notification.actor.avatar_url) ? (
                    <img
                      src={getAvatarUrl(notification.actor.avatar_url) || ''}
                      alt={notification.actor.username}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold">
                      {notification.actor.username[0]?.toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-semibold">{notification.actor.full_name}</span>
                    <span className="text-gray-600 dark:text-gray-400">
                      {' '}{getNotificationText(notification)}
                    </span>
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {formatDistanceToNow(new Date(notification.created_at), {
                      addSuffix: true,
                      locale: tr,
                    })}
                  </p>
                </div>

                {/* Post Thumbnail */}
                {notification.post?.media && notification.post.media[0] && (
                  <div className="flex-shrink-0">
                    {notification.post.media[0].media_type === 'video' ? (
                      <video
                        src={getMediaUrl(notification.post.media[0].media_url)}
                        className="w-12 h-12 object-cover rounded"
                      />
                    ) : (
                      <img
                        src={getMediaUrl(notification.post.media[0].media_url)}
                        alt="Post"
                        className="w-12 h-12 object-cover rounded"
                      />
                    )}
                  </div>
                )}

                {/* Delete Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNotification(notification.id);
                  }}
                  className="flex-shrink-0 p-2 opacity-0 group-hover:opacity-100 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition"
                >
                  <Trash2 className="w-4 h-4 text-gray-500" />
                </button>

                {/* Unread Indicator */}
                {!notification.is_read && (
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <div className="text-6xl mb-4">🔔</div>
            <h3 className="text-xl font-bold mb-2">Hiç bildirim yok</h3>
            <p className="text-gray-500 dark:text-gray-400 text-center">
              {filter === 'unread'
                ? 'Tüm bildirimler okundu'
                : 'Henüz hiç bildirim almadınız'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
