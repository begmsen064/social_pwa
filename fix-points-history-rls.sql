-- Fix RLS policies for user_points_history table

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own points history" ON user_points_history;
DROP POLICY IF EXISTS "Users can insert own points history" ON user_points_history;
DROP POLICY IF EXISTS "System can insert points history" ON user_points_history;

-- Allow users to view their own points history
CREATE POLICY "Users can view own points history"
ON user_points_history FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow authenticated users to insert points history for any user
-- This is needed because when you comment/like, it creates history for the post owner
CREATE POLICY "System can insert points history"
ON user_points_history FOR INSERT
TO authenticated
WITH CHECK (true);

-- Make sure RLS is enabled
ALTER TABLE user_points_history ENABLE ROW LEVEL SECURITY;