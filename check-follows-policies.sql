-- =====================================================
-- Check Current RLS Policies on Follows Table
-- =====================================================
-- Run this in Supabase Dashboard > SQL Editor to see current policies

SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'follows'
ORDER BY policyname;