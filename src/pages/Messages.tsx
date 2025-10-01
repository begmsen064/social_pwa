import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MessageCircle, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

interface Conversation {
  id: string;
  user1_id: string;
  user2_id: string;
  last_message: string | null;
  last_message_at: string;
  other_user: {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string | null;
  };
  unread_count: number;
}

const Messages = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user) {
      fetchConversations();
      const cleanup = subscribeToMessages();
      return cleanup;
    }
  }, [user]);

  // Refresh when returning to page (from chat)
  useEffect(() => {
    if (user && location.pathname === '/messages') {
      // Scroll to top
      window.scrollTo(0, 0);
      fetchConversations();
    }
  }, [location.pathname, user]);

  const fetchConversations = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch conversations with user info
      const { data: convos, error } = await supabase
        .from('conversations')
        .select(`
          *,
          user1:user1_id(id, username, full_name, avatar_url),
          user2:user2_id(id, username, full_name, avatar_url)
        `)
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order('last_message_at', { ascending: false });

      if (error) throw error;

      // Process conversations to get other user and unread count
      const processedConvos = await Promise.all(
        (convos || []).map(async (convo: any) => {
          const otherUser = convo.user1_id === user.id ? convo.user2 : convo.user1;

          // Skip if other user data is missing
          if (!otherUser) {
            console.warn('Missing user data for conversation:', convo.id);
            return null;
          }

          // Get unread count
          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', convo.id)
            .eq('receiver_id', user.id)
            .eq('is_read', false);

          return {
            id: convo.id,
            user1_id: convo.user1_id,
            user2_id: convo.user2_id,
            last_message: convo.last_message,
            last_message_at: convo.last_message_at,
            other_user: otherUser,
            unread_count: count || 0,
          };
        })
      );

      // Filter out null conversations
      setConversations(processedConvos.filter((c): c is Conversation => c !== null));

    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToMessages = () => {
    if (!user) return () => {};

    const channel = supabase
      .channel('messages_updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        async (payload: any) => {
          const newMessage = payload.new;

          // Update the specific conversation
          setConversations((prevConvos) => {
            const updatedConvos = prevConvos.map((convo) => {
              if (convo.id === newMessage.conversation_id) {
                // Update last message and timestamp
                const updated = {
                  ...convo,
                  last_message: newMessage.content,
                  last_message_at: newMessage.created_at,
                };

                // Increment unread count if I'm the receiver
                if (newMessage.receiver_id === user.id) {
                  updated.unread_count = convo.unread_count + 1;
                }

                return updated;
              }
              return convo;
            });

            // Sort by last_message_at (most recent first)
            return updatedConvos.sort((a, b) => 
              new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
            );
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
        },
        (payload: any) => {
          const updatedMessage = payload.new;

          // Update unread count if message was marked as read
          if (updatedMessage.is_read && updatedMessage.receiver_id === user.id) {
            setConversations((prevConvos) => 
              prevConvos.map((convo) => {
                if (convo.id === updatedMessage.conversation_id) {
                  return {
                    ...convo,
                    unread_count: Math.max(0, convo.unread_count - 1),
                  };
                }
                return convo;
              })
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const getAvatarUrl = (avatarUrl: string | null) => {
    if (!avatarUrl) return null;
    if (avatarUrl.startsWith('http')) return avatarUrl;
    return `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/avatars/${avatarUrl}`;
  };

  const filteredConversations = conversations.filter((convo) =>
    convo.other_user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    convo.other_user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen pb-20 bg-gray-50 dark:bg-black">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-xl font-bold mb-3">Mesajlar</h1>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-gray-800 border-none rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            />
          </div>
        </div>
      </div>

      {/* Conversations List */}
      <div className="max-w-2xl mx-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : filteredConversations.length > 0 ? (
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {filteredConversations.map((convo) => (
              <div
                key={convo.id}
                onClick={() => navigate(`/messages/${convo.other_user.id}`)}
                className="flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer transition bg-white dark:bg-black"
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  {convo.other_user.avatar_url && getAvatarUrl(convo.other_user.avatar_url) ? (
                    <img
                      src={getAvatarUrl(convo.other_user.avatar_url) || ''}
                      alt={convo.other_user.username}
                      className="w-14 h-14 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-xl font-bold">
                      {convo.other_user.username[0]?.toUpperCase()}
                    </div>
                  )}
                  {convo.unread_count > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                      <span className="text-xs text-white font-bold">{convo.unread_count}</span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                      {convo.other_user.full_name}
                    </h3>
                    <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
                      {formatDistanceToNow(new Date(convo.last_message_at), {
                        addSuffix: true,
                        locale: tr,
                      })}
                    </span>
                  </div>
                  <p
                    className={`text-sm truncate ${
                      convo.unread_count > 0
                        ? 'text-gray-900 dark:text-white font-semibold'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {convo.last_message || 'Henüz mesaj yok'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <MessageCircle className="w-20 h-20 text-gray-300 dark:text-gray-700 mb-4" />
            <h3 className="text-xl font-bold mb-2">Hiç mesajınız yok</h3>
            <p className="text-gray-500 dark:text-gray-400 text-center mb-6">
              {searchQuery ? 'Arama sonucu bulunamadı' : 'Yeni bir sohbet başlatın'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;