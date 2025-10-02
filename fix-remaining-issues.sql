-- =============================================
-- FIX REMAINING 2 ISSUES
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. Fix profiles INSERT policy
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = id);


-- 2. Check and fix user_points_history duplicate policies
-- First, let's see what policies exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE tablename = 'user_points_history';

-- Drop duplicate INSERT policies if they exist
DROP POLICY IF EXISTS "System can insert points" ON public.user_points_history;
DROP POLICY IF EXISTS "System can insert points history" ON public.user_points_history;

-- Create a single INSERT policy
CREATE POLICY "System can insert points history" ON public.user_points_history
  FOR INSERT WITH CHECK (true);  -- System can insert for any user

-- =============================================
-- COMPLETED!
-- All issues should be resolved now
-- =============================================
