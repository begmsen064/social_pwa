-- =====================================================
-- TEMPORARY: Disable RLS on Follows (DEVELOPMENT ONLY!)
-- =====================================================
-- ⚠️ WARNING: This is NOT secure for production!
-- Use this ONLY for testing, then enable RLS again

-- Disable RLS temporarily
ALTER TABLE follows DISABLE ROW LEVEL SECURITY;

-- To re-enable later, run:
-- ALTER TABLE follows ENABLE ROW LEVEL SECURITY;