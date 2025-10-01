-- =====================================================
-- Fix Follows Table RLS Policies
-- =====================================================
-- Run this in Supabase Dashboard > SQL Editor

-- First, drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Follows are viewable by everyone" ON follows;
DROP POLICY IF EXISTS "Users can follow others" ON follows;
DROP POLICY IF EXISTS "Users can unfollow" ON follows;

-- Recreate SELECT policy (anyone can view follows)
CREATE POLICY "Follows are viewable by everyone" ON follows
  FOR SELECT USING (true);

-- INSERT policy (users can only create follows where they are the follower)
CREATE POLICY "Users can follow others" ON follows
  FOR INSERT WITH CHECK (auth.uid() = follower_id);

-- DELETE policy (users can only delete their own follows)
CREATE POLICY "Users can unfollow" ON follows
  FOR DELETE USING (auth.uid() = follower_id);

-- Make sure RLS is enabled
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;