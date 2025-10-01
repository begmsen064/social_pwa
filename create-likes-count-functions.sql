-- =====================================================
-- Likes Count Increment/Decrement Functions
-- =====================================================
-- These functions safely update likes_count without race conditions
-- Run this in Supabase Dashboard > SQL Editor

-- Function to increment likes count
CREATE OR REPLACE FUNCTION increment_likes_count(post_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE posts
  SET likes_count = likes_count + 1
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrement likes count
CREATE OR REPLACE FUNCTION decrement_likes_count(post_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE posts
  SET likes_count = GREATEST(0, likes_count - 1)
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION increment_likes_count TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_likes_count TO authenticated;