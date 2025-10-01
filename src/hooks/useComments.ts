import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user: {
    id: string;
    username: string;
    avatar_url: string | null;
    full_name: string | null;
  };
}

interface UseCommentsReturn {
  comments: Comment[];
  loading: boolean;
  error: string | null;
  addComment: (content: string) => Promise<boolean>;
  refetch: () => Promise<void>;
}

export const useComments = (postId: string): UseCommentsReturn => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const user = useAuthStore((state) => state.user);

  const fetchComments = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('comments')
        .select(`
          id,
          post_id,
          user_id,
          content,
          created_at,
          profiles (
            id,
            username,
            avatar_url,
            full_name
          )
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;

      // Transform data to match Comment interface
      const transformedData = data?.map(item => ({
        ...item,
        user: Array.isArray(item.profiles) ? item.profiles[0] : item.profiles
      })) as Comment[];

      setComments(transformedData || []);
    } catch (err) {
      console.error('Error fetching comments:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch comments');
    } finally {
      setLoading(false);
    }
  };

  const addComment = async (content: string): Promise<boolean> => {
    if (!user) {
      setError('You must be logged in to comment');
      return false;
    }

    if (!content.trim()) {
      setError('Comment cannot be empty');
      return false;
    }

    try {
      setError(null);

      // Optimistic update - create temporary comment
      const tempId = `temp-${Date.now()}`;
      const optimisticComment: Comment = {
        id: tempId,
        post_id: postId,
        user_id: user.id,
        content: content.trim(),
        created_at: new Date().toISOString(),
        user: {
          id: user.id,
          username: user.username || 'user',
          avatar_url: user.avatar_url || null,
          full_name: user.full_name || 'User',
        },
      };

      // Add to UI immediately
      setComments((prev) => [...prev, optimisticComment]);

      // Insert comment to database
      const { data: newComment, error: insertError } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content: content.trim(),
        })
        .select(`
          id,
          post_id,
          user_id,
          content,
          created_at,
          profiles (
            id,
            username,
            avatar_url,
            full_name
          )
        `)
        .single();

      if (insertError) {
        // Rollback optimistic update on error
        setComments((prev) => prev.filter(c => c.id !== tempId));
        throw insertError;
      }

      // Transform to match Comment interface
      const transformedComment = {
        ...newComment,
        user: Array.isArray(newComment.profiles) ? newComment.profiles[0] : newComment.profiles
      } as Comment;

      // Replace temporary comment with real one
      setComments((prev) => prev.map(c => c.id === tempId ? transformedComment : c));

      // Note: comments_count is automatically updated by database trigger

      // Award points and handle notifications
      try {
        // 1. Award 1 point to comment author for making a comment
        await supabase.from('user_points_history').insert({
          user_id: user.id,
          action_type: 'comment',
          points: 1,
          reference_id: postId,
        });

        // Update comment author's total points using RPC function
        await supabase.rpc('update_user_points', {
          target_user_id: user.id,
          points_to_add: 1,
        });

        // 2. Get post owner to award points and send notification
        const { data: post } = await supabase
          .from('posts')
          .select('user_id')
          .eq('id', postId)
          .maybeSingle();

        if (post && post.user_id !== user.id) {
          // Award 2 points to post owner for receiving a comment
          await supabase.from('user_points_history').insert({
            user_id: post.user_id,
            action_type: 'comment',
            points: 2,
            reference_id: postId,
          });

          // Update post owner's total points using RPC function
          await supabase.rpc('update_user_points', {
            target_user_id: post.user_id,
            points_to_add: 2,
          });

          // Create notification for post owner
          await supabase.from('notifications').insert({
            user_id: post.user_id,
            actor_id: user.id,
            type: 'comment',
            post_id: postId,
            comment_id: transformedComment.id,
          });
        }
      } catch (pointsError) {
        // Silently fail points/notification - don't block comment creation
        console.debug('Points/notification update failed:', pointsError);
      }

      return true;
    } catch (err) {
      console.error('Error adding comment:', err);
      setError(err instanceof Error ? err.message : 'Failed to add comment');
      return false;
    }
  };

  const refetch = async () => {
    await fetchComments();
  };

  useEffect(() => {
    if (postId) {
      fetchComments();
    }
  }, [postId]);

  return {
    comments,
    loading,
    error,
    addComment,
    refetch,
  };
};