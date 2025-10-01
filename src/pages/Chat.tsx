import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
}

interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  reaction: string;
}

interface OtherUser {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
}

const Chat = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [lastTap, setLastTap] = useState<{ [key: string]: number }>({});
  const [reactions, setReactions] = useState<{ [messageId: string]: MessageReaction[] }>({});

  useEffect(() => {
    if (user && userId) {
      initializeChat();
    }
  }, [user, userId]);

  // Separate effect for realtime subscription
  useEffect(() => {
    if (!conversationId) return;

    const cleanup = subscribeToMessages(conversationId);
    return cleanup;
  }, [conversationId]);

  const initializeChat = async () => {
    if (!user || !userId) return;

    try {
      setLoading(true);

      // Fetch other user info
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .eq('id', userId)
        .single();

      if (userError) throw userError;
      setOtherUser(userData);

      // Get or create conversation
      const { data: convId, error: convError } = await supabase
        .rpc('get_or_create_conversation', {
          p_user1_id: user.id,
          p_user2_id: userId,
        });

      if (convError) throw convError;
      setConversationId(convId);

      // Fetch messages (includes reactions)
      await fetchMessages(convId);

      // Mark messages as read
      await markMessagesAsRead(convId);

    } catch (error) {
      console.error('Error initializing chat:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (convId: string) => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return;
    }

    setMessages(data || []);
    
    // Fetch reactions for these messages
    if (data && data.length > 0) {
      await fetchReactions(data.map(m => m.id));
    }
    
    // Scroll to bottom immediately and after render
    setTimeout(() => scrollToBottom(), 0);
    setTimeout(() => scrollToBottom(), 100);
    setTimeout(() => scrollToBottom(), 300);
  };

  const fetchReactions = async (messageIds: string[]) => {
    try {
      if (messageIds.length === 0) return;

      const { data, error } = await supabase
        .from('message_reactions')
        .select('*')
        .in('message_id', messageIds);

      if (error) throw error;

      // Group reactions by message_id
      const groupedReactions: { [messageId: string]: MessageReaction[] } = {};
      (data || []).forEach((reaction) => {
        if (!groupedReactions[reaction.message_id]) {
          groupedReactions[reaction.message_id] = [];
        }
        groupedReactions[reaction.message_id].push(reaction);
      });

      setReactions(groupedReactions);
    } catch (error) {
      console.error('Error fetching reactions:', error);
    }
  };

  const subscribeToMessages = (convId: string) => {
    const channel = supabase
      .channel(`chat_${convId}_${Date.now()}`) // Unique channel name
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${convId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          
          // Prevent duplicate messages
          setMessages((prev) => {
            const exists = prev.some(m => m.id === newMessage.id);
            if (exists) return prev;
            return [...prev, newMessage];
          });
          
          setTimeout(() => scrollToBottom(true), 100);

          // Mark as read if I'm the receiver
          if (newMessage.receiver_id === user?.id) {
            markMessageAsRead(newMessage.id);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'message_reactions',
        },
        (payload) => {
          const newReaction = payload.new as MessageReaction;
          
          setReactions((prev) => {
            const messageReactions = prev[newReaction.message_id] || [];
            
            // Prevent duplicate reactions
            const exists = messageReactions.some(r => r.id === newReaction.id);
            if (exists) return prev;
            
            return {
              ...prev,
              [newReaction.message_id]: [...messageReactions, newReaction]
            };
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'message_reactions',
        },
        (payload) => {
          const oldReaction = payload.old as { id: string; message_id?: string };
          
          setReactions((prev) => {
            // If we have message_id, use it directly
            if (oldReaction.message_id) {
              const messageReactions = prev[oldReaction.message_id] || [];
              return {
                ...prev,
                [oldReaction.message_id]: messageReactions.filter(r => r.id !== oldReaction.id)
              };
            }
            
            // If no message_id, search through all reactions to find and remove by id
            const newReactions = { ...prev };
            
            for (const [messageId, reactions] of Object.entries(newReactions)) {
              const filteredReactions = reactions.filter(r => r.id !== oldReaction.id);
              if (filteredReactions.length !== reactions.length) {
                newReactions[messageId] = filteredReactions;
                break;
              }
            }
            
            return newReactions;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const markMessagesAsRead = async (convId: string) => {
    if (!user) return;

    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('conversation_id', convId)
      .eq('receiver_id', user.id)
      .eq('is_read', false);
  };

  const markMessageAsRead = async (messageId: string) => {
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('id', messageId);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !conversationId || !user || !userId || sending) return;

    try {
      setSending(true);

      const { error } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: user.id,
        receiver_id: userId,
        content: newMessage.trim(),
      });

      if (error) throw error;

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Mesaj gönderilemedi');
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = (smooth = false) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: smooth ? 'smooth' : 'auto',
        block: 'end'
      });
    }
  };

  const handleMessageDoubleTap = async (messageId: string) => {
    if (!user) return;

    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (lastTap[messageId] && now - lastTap[messageId] < DOUBLE_TAP_DELAY) {
      // Double tap detected - toggle reaction
      const messageReactions = reactions[messageId] || [];
      const myReaction = messageReactions.find(r => r.user_id === user.id);

      try {
        if (myReaction) {
          // Remove my reaction
          const { error } = await supabase
            .from('message_reactions')
            .delete()
            .eq('id', myReaction.id);

          if (error) throw error;

          // Update local state
          setReactions((prev) => ({
            ...prev,
            [messageId]: messageReactions.filter(r => r.id !== myReaction.id)
          }));
        } else {
          // Add my reaction
          const { data, error } = await supabase
            .from('message_reactions')
            .insert({
              message_id: messageId,
              user_id: user.id,
              reaction: 'heart'
            })
            .select()
            .single();

          if (error) throw error;

          // Update local state
          setReactions((prev) => ({
            ...prev,
            [messageId]: [...messageReactions, data]
          }));
        }
      } catch (error) {
        console.error('Error updating reaction:', error);
      }

      // Clear tap timing
      setLastTap((prev) => ({ ...prev, [messageId]: 0 }));
    } else {
      // First tap - record time
      setLastTap((prev) => ({ ...prev, [messageId]: now }));
    }
  };

  const getAvatarUrl = (avatarUrl: string | null) => {
    if (!avatarUrl) return null;
    if (avatarUrl.startsWith('http')) return avatarUrl;
    return `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/avatars/${avatarUrl}`;
  };

  if (loading || !otherUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col fixed inset-0 bg-gray-50 dark:bg-black">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3">
        <div className="flex items-center gap-3 max-w-2xl mx-auto">
          <button
            onClick={() => navigate('/messages')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div
            className="flex items-center gap-3 flex-1 cursor-pointer"
            onClick={() => navigate(`/u/${otherUser.username}`)}
          >
            {otherUser.avatar_url && getAvatarUrl(otherUser.avatar_url) ? (
              <img
                src={getAvatarUrl(otherUser.avatar_url) || ''}
                alt={otherUser.username}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold">
                {otherUser.username[0]?.toUpperCase()}
              </div>
            )}
            <div>
              <h2 className="font-semibold">{otherUser.full_name}</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">@{otherUser.username}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 max-w-2xl mx-auto w-full">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-gray-500 dark:text-gray-400 mb-2">Henüz mesaj yok</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">İlk mesajı sen gönder!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message, index) => {
              const isMe = message.sender_id === user?.id;
              const showTime =
                index === 0 ||
                new Date(message.created_at).getTime() -
                  new Date(messages[index - 1].created_at).getTime() >
                  300000; // 5 minutes

              return (
                <div key={message.id}>
                  {showTime && (
                    <div className="text-center text-xs text-gray-500 dark:text-gray-400 my-4">
                      {formatDistanceToNow(new Date(message.created_at), {
                        addSuffix: true,
                        locale: tr,
                      })}
                    </div>
                  )}
                  <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className="relative max-w-[70%]">
                      <div
                        onClick={() => handleMessageDoubleTap(message.id)}
                        className={`px-4 py-2 rounded-2xl cursor-pointer select-none ${
                          isMe
                            ? 'bg-primary text-white rounded-br-sm'
                            : 'bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-sm'
                        }`}
                      >
                        <p className="text-sm break-words">{message.content}</p>
                      </div>
                      {reactions[message.id] && reactions[message.id].length > 0 && (
                        <div className={`absolute -bottom-1 ${isMe ? '-left-1' : '-right-1'} bg-white dark:bg-gray-900 rounded-full px-1 py-0.5 shadow-sm border border-gray-200 dark:border-gray-700 flex items-center gap-0.5`}>
                          <span className="text-[10px] leading-none">❤️</span>
                          {reactions[message.id].length > 1 && (
                            <span className="text-[9px] font-semibold text-gray-700 dark:text-gray-300 leading-none">
                              {reactions[message.id].length}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 px-4 py-3">
        <form onSubmit={sendMessage} className="flex items-center gap-2 max-w-2xl mx-auto">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Mesaj yaz..."
            className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 rounded-full focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="p-2.5 bg-primary text-white rounded-full hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;