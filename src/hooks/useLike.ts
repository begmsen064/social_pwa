import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

export const useLike = (postId: string, initialLikesCount: number, postOwnerId: string) => {
  const { user } = useAuthStore();
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      checkIfLiked();
    }
  }, [user, postId]);

  const checkIfLiked = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .eq('type', 'like')
        .maybeSingle();

      // Only set liked if we actually have data and no error
      setIsLiked(!!data && !error);
    } catch (error) {
      // Silently handle any errors
      setIsLiked(false);
    }
  };

  const toggleLike = async () => {
    if (!user || isLoading) return;

    // Optimistic update - update UI immediately
    const previousIsLiked = isLiked;
    const previousLikesCount = likesCount;

    setIsLoading(true);
    setIsLiked(!isLiked);
    setLikesCount(isLiked ? Math.max(0, likesCount - 1) : likesCount + 1);

    try {
      if (previousIsLiked) {
        // Unlike
        await unlikePost(previousLikesCount);
      } else {
        // Like
        await likePost(previousLikesCount);
      }
    } catch (error) {
      console.error('Like toggle error:', error);
      // Rollback on error
      setIsLiked(previousIsLiked);
      setLikesCount(previousLikesCount);
    } finally {
      setIsLoading(false);
    }
  };

  const likePost = async (_previousCount: number) => {
    if (!user) return;

    try {
      // 1. Add like to database
      const { error: likeError } = await supabase
        .from('likes')
        .insert({
          post_id: postId,
          user_id: user.id,
          type: 'like',
        });

      if (likeError) throw likeError;

      // 2. Increment post likes count (using RPC to avoid race conditions)
      const { error: updateError } = await supabase.rpc('increment_likes_count', {
        post_id: postId
      });

      if (updateError) throw updateError;

      // 3. Add points to post owner (if not self-like)
      if (postOwnerId !== user.id) {
        // Add points history
        await supabase.from('user_points_history').insert({
          user_id: postOwnerId,
          points: 2,
          action_type: 'like',
          reference_id: postId,
        });

        // Update total points
        const { data: ownerData } = await supabase
          .from('profiles')
          .select('total_points')
          .eq('id', postOwnerId)
          .single();

        if (ownerData) {
          await supabase
            .from('profiles')
            .update({ total_points: (ownerData.total_points || 0) + 2 })
            .eq('id', postOwnerId);
        }

        // Create notification
        await supabase.from('notifications').insert({
          user_id: postOwnerId,
          actor_id: user.id,
          type: 'like',
          post_id: postId,
          is_read: false,
        });
      }
    } catch (error) {
      console.error('Like error:', error);
      throw error;
    }
  };

  const unlikePost = async (_previousCount: number) => {
    if (!user) return;

    try {
      // 1. Remove like from database
      const { error: deleteError } = await supabase
        .from('likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .eq('type', 'like');

      if (deleteError) throw deleteError;

      // 2. Decrement post likes count (using RPC to avoid race conditions)
      const { error: updateError } = await supabase.rpc('decrement_likes_count', {
        post_id: postId
      });

      if (updateError) throw updateError;

      // 3. Remove points from post owner (if not self-unlike)
      if (postOwnerId !== user.id) {
        // Add negative points history
        await supabase.from('user_points_history').insert({
          user_id: postOwnerId,
          points: -2,
          action_type: 'like',
          reference_id: postId,
        });

        // Update total points
        const { data: ownerData } = await supabase
          .from('profiles')
          .select('total_points')
          .eq('id', postOwnerId)
          .single();

        if (ownerData) {
          await supabase
            .from('profiles')
            .update({ total_points: Math.max(0, (ownerData.total_points || 0) - 2) })
            .eq('id', postOwnerId);
        }
      }
    } catch (error) {
      console.error('Unlike error:', error);
      throw error;
    }
  };

  return {
    isLiked,
    likesCount,
    isLoading,
    toggleLike,
  };
};