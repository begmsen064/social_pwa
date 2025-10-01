import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

export const useFollow = (targetUserId: string | null) => {
  const { user } = useAuthStore();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user && targetUserId && user.id !== targetUserId) {
      checkFollowStatus();
    }
  }, [user, targetUserId]);

  const checkFollowStatus = async () => {
    if (!user || !targetUserId) return;

    try {
      const { data, error } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId)
        .maybeSingle();

      if (error) {
        console.error('Error checking follow status:', error);
        // Silently fail - don't break the UI
        return;
      }

      setIsFollowing(!!data);
    } catch (error) {
      console.error('Error checking follow status:', error);
    }
  };

  const toggleFollow = async () => {
    if (!user || !targetUserId || isLoading) return;

    try {
      setIsLoading(true);

      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', targetUserId);

        if (error) throw error;
        setIsFollowing(false);
      } else {
        // Follow
        const { error } = await supabase
          .from('follows')
          .insert({
            follower_id: user.id,
            following_id: targetUserId,
          });

        if (error) throw error;
        setIsFollowing(true);
      }

      return true;
    } catch (error) {
      console.error('Error toggling follow:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { isFollowing, isLoading, toggleFollow };
};